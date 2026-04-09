/**
 * PTT Crawler Cron Job
 * GET /api/cron/crawl — triggered by Vercel Cron (every 5 minutes)
 *
 * This endpoint:
 * 1. Fetches active subscriptions from the DB
 * 2. Groups them by board to minimize PTT requests
 * 3. For each subscription, checks new articles and sends notifications
 * 4. Logs all alerts to alert_logs table
 *
 * Vercel Cron Configuration (vercel.json):
 * { "crons": [{ "path": "/api/cron/crawl", "schedule": "every 5 minutes" }] }
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { crawlMultipleBoards } from '@/lib/ptt';
import { matchKeywords, parseNotificationSettings } from '@/lib/keywords';
import { dispatchNotifications } from '@/lib/notifications';
import type { KeywordRule } from '@/lib/keywords';
import type { PTTArticle } from '@/lib/ptt';

// Authorization: only Vercel Cron or internal calls can trigger this
const CRON_SECRET = process.env.CRON_SECRET || '';

function authorizeCron(request: Request): boolean {
  // Allow if no secret is configured (dev mode)
  if (!CRON_SECRET) return true;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${CRON_SECRET}`;
}

export async function GET(request: Request) {
  // Authorization check
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    subscriptionsChecked: 0,
    articlesScanned: 0,
    notificationsSent: 0,
    errors: [] as string[],
    duration: 0,
  };

  try {
    // 1. Fetch all active subscriptions with user notification config
    const subsResult = await pool.query(`
      SELECT
        s.id as subscription_id,
        s.board_name,
        s.keywords,
        s.notify_line,
        s.notify_email,
        s.notify_discord,
        s.user_id,
        u.clerk_user_id,
        u.line_id,
        u.email,
        u.discord_webhook
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_active = true
    `);

    const subscriptions = subsResult.rows;
    results.subscriptionsChecked = subscriptions.length;

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions',
        ...results,
        duration: Date.now() - startTime,
      });
    }

    // 2. Group subscriptions by board name to minimize PTT requests
    const boardGroups = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      if (!boardGroups.has(sub.board_name)) {
        boardGroups.set(sub.board_name, []);
      }
      boardGroups.get(sub.board_name)!.push(sub);
    }

    // 3. Crawl each board (rate-limited to 1.5s between boards)
    const boards = Array.from(boardGroups.keys());
    const crawlResults = await crawlMultipleBoards(boards, 30, 1500);

    const articlesByBoard = new Map<string, PTTArticle[]>();
    for (const cr of crawlResults) {
      articlesByBoard.set(cr.board, cr.articles);
      results.articlesScanned += cr.articles.length;
    }

    // 4. For each subscription, check for keyword matches and notify
    for (const sub of subscriptions) {
      const articles = articlesByBoard.get(sub.board_name) || [];
      const keywords: KeywordRule[] = Array.isArray(sub.keywords)
        ? sub.keywords
        : typeof sub.keywords === 'string'
        ? JSON.parse(sub.keywords)
        : [];

      if (articles.length === 0 || keywords.length === 0) continue;

      // Track already-notified articles for this subscription (in-memory, per run)
      // In production, track last notified article ID in DB to avoid re-notifying
      for (const article of articles) {
        const matchResult = matchKeywords(article.title, keywords);

        if (!matchResult.matched) continue;

        // Determine which channels to notify
        const notifyConfig = parseNotificationSettings({
          notify_line: sub.notify_line,
          notify_email: sub.notify_email,
          notify_discord: sub.notify_discord,
          line_token: sub.line_id,
          email: sub.email,
          discord_webhook: sub.discord_webhook,
        });

        const hasAnyChannel =
          (notifyConfig.notify_line && notifyConfig.line_token) ||
          (notifyConfig.notify_email && notifyConfig.email) ||
          (notifyConfig.notify_discord && notifyConfig.discord_webhook);

        if (!hasAnyChannel) continue;

        const payload = {
          article,
          subscriptionId: sub.subscription_id,
          boardName: sub.board_name,
          matchedKeywords: matchResult.matchedKeywords,
          userId: sub.clerk_user_id || sub.user_id,
        };

        // Send notifications
        const dispatchResults = await dispatchNotifications(payload, {
          line_token: notifyConfig.line_token,
          email: notifyConfig.email,
          discord_webhook: notifyConfig.discord_webhook,
        }, {
          SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
        });

        // Log successful notifications to alert_logs
        for (const dr of dispatchResults) {
          if (dr.success) {
            results.notificationsSent++;

            // Insert alert log
            try {
              await pool.query(
                `INSERT INTO alert_logs
                  (subscription_id, article_title, article_url, article_author, article_time, matched_keywords, notification_channel)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  sub.subscription_id,
                  article.title,
                  article.url,
                  article.author,
                  article.publishedAt,
                  JSON.stringify(matchResult.matchedKeywords),
                  dr.channel,
                ]
              );
            } catch (logErr) {
              console.error('[Cron] Failed to log alert:', logErr);
            }
          } else {
            results.errors.push(
              `[${sub.board_name}] ${dr.channel} notification failed: ${dr.error}`
            );
          }
        }
      }
    }

    results.duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Cron] Crawl job failed:', message);
    results.errors.push(`Fatal error: ${message}`);
    results.duration = Date.now() - startTime;

    return NextResponse.json(
      { success: false, ...results },
      { status: 500 }
    );
  }
}
