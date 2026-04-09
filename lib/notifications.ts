/**
 * Notification Service
 * Handles sending notifications via LINE Notify, Email (SendGrid), and Discord Webhook.
 * Includes rate limiting to respect platform limits:
 * - LINE Notify: 20 req/min per token
 * - Discord Webhook: 30 req/hr per webhook
 */

import type { PTTArticle } from './ptt';

export interface NotificationPayload {
  article: PTTArticle;
  subscriptionId: string;
  boardName: string;
  matchedKeywords: string[];
  userId: string;
}

export interface UserNotificationConfig {
  line_token?: string;
  email?: string;
  discord_webhook?: string;
}

// ──────────────────────────────────────────────────────────────
// Rate Limiter (in-memory, per serverless instance)
// Key: `${userId}:${channel}` → { count: number, resetAt: number }
// ──────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
  queue: NotificationPayload[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS = {
  line: { max: 18, windowMs: 60_000 },   // 20/min → use 18 to be safe
  discord: { max: 28, windowMs: 3_600_000 }, // 30/hr → use 28 to be safe
  email: { max: 100, windowMs: 60_000 },    // 100/min (SendGrid limit on free tier)
};

function checkRateLimit(userId: string, channel: 'line' | 'discord' | 'email'): boolean {
  const key = `${userId}:${channel}`;
  const limit = RATE_LIMITS[channel];
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + limit.windowMs,
      queue: [],
    });
    return true;
  }

  if (entry.count >= limit.max) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

function getResetDelay(userId: string, channel: 'line' | 'discord' | 'email'): number {
  const key = `${userId}:${channel}`;
  const entry = rateLimitStore.get(key);
  if (!entry) return 0;
  return Math.max(0, entry.resetAt - Date.now());
}

// ──────────────────────────────────────────────────────────────
// LINE Notify
// ──────────────────────────────────────────────────────────────

const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify';

export async function sendLineNotify(
  token: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!token || token.trim() === '') {
    return { success: false, error: 'No LINE token configured' };
  }

  const article = payload.article;
  const matchedText = payload.matchedKeywords.join('、');

  const message = [
    `🔔 PTT Alertor 通知`,
    ``,
    `📌 看板：/${article.board}`,
    `📝 標題：${article.title}`,
    `👤 作者：${article.author}`,
    `🔗 連結：${article.url}`,
    ``,
    `🏷️ 匹配關鍵字：${matchedText}`,
  ].join('\n');

  try {
    const res = await fetch(LINE_NOTIFY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ message }),
    });

    const data = await res.json();

    if (res.ok && (data.status === 200 || data.status === '200')) {
      return { success: true };
    }

    return { success: false, error: `LINE API error: ${data.message || res.status}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ──────────────────────────────────────────────────────────────
// SendGrid Email
// ──────────────────────────────────────────────────────────────

const SENDGRID_API = 'https://api.sendgrid.com/v3/mail/send';

export async function sendEmailNotification(
  toEmail: string,
  payload: NotificationPayload,
  sendgridApiKey: string
): Promise<{ success: boolean; error?: string }> {
  if (!toEmail || !sendgridApiKey) {
    return { success: false, error: 'Missing email config' };
  }

  const article = payload.article;
  const matchedText = payload.matchedKeywords.join('、');

  const subject = `[PTT Alertor] ${article.board} 出現新文章：${article.title.slice(0, 50)}`;
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #3b82f6; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">🔔 PTT Alertor 通知</h1>
        <p style="margin: 4px 0 0; opacity: 0.9;">有新文章符合你的訂閱條件</p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
            📌 看板：<strong>/${article.board}</strong>
          </p>
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #111827;">${escapeHtml(article.title)}</h2>
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
            👤 作者：${escapeHtml(article.author)}
          </p>
          <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px;">
            ⏰ 時間：${new Date(article.publishedAt).toLocaleString('zh-TW')}
          </p>
          <a href="${article.url}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            查看文章 →
          </a>
        </div>
        <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 12px;">
          <p style="margin: 0; font-size: 13px; color: #854d0e;">
            🏷️ 匹配關鍵字：<strong>${escapeHtml(matchedText)}</strong>
          </p>
        </div>
        <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
          此通知由 PTT Alertor 自動發送 · <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">取消訂閱</a>
        </p>
      </div>
    </div>
  `;

  const plainContent = [
    `🔔 PTT Alertor 通知`,
    ``,
    `看板：/${article.board}`,
    `標題：${article.title}`,
    `作者：${article.author}`,
    `時間：${new Date(article.publishedAt).toLocaleString('zh-TW')}`,
    `連結：${article.url}`,
    ``,
    `匹配關鍵字：${matchedText}`,
  ].join('\n');

  try {
    const res = await fetch(SENDGRID_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: 'noreply@pttalertor.com', name: 'PTT Alertor' },
        reply_to: { email: 'support@pttalertor.com', name: 'PTT Alertor' },
        subject,
        content: [
          { type: 'text/plain', value: plainContent },
          { type: 'text/html', value: htmlContent },
        ],
      }),
    });

    if (res.ok || res.status === 202) {
      return { success: true };
    }

    const errorText = await res.text();
    return { success: false, error: `SendGrid error: ${res.status} - ${errorText}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ──────────────────────────────────────────────────────────────
// Discord Webhook
// ──────────────────────────────────────────────────────────────

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl || webhookUrl.trim() === '') {
    return { success: false, error: 'No Discord webhook configured' };
  }

  const article = payload.article;
  const matchedText = payload.matchedKeywords.join('、');

  const embed = {
    title: article.title.slice(0, 256),
    url: article.url,
    description: `**看板：** /${article.board}\n**作者：** ${article.author}\n**時間：** ${new Date(article.publishedAt).toLocaleString('zh-TW')}`,
    color: 5814783, // Blue
    footer: {
      text: `PTT Alertor · 匹配關鍵字：${matchedText}`,
    },
    timestamp: article.publishedAt,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🔔 **PTT Alertor** — 新文章符合你的訂閱條件！`,
        embeds: [embed],
      }),
    });

    if (res.ok || res.status === 204) {
      return { success: true };
    }

    const errorText = await res.text();
    return { success: false, error: `Discord webhook error: ${res.status} - ${errorText}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ──────────────────────────────────────────────────────────────
// Dispatcher — sends all configured channels for a payload
// ──────────────────────────────────────────────────────────────

export interface DispatchResult {
  channel: string;
  success: boolean;
  error?: string;
}

export async function dispatchNotifications(
  payload: NotificationPayload,
  config: UserNotificationConfig,
  env: { SENDGRID_API_KEY?: string }
): Promise<DispatchResult[]> {
  const results: DispatchResult[] = [];

  // LINE Notify
  if (config.line_token) {
    if (checkRateLimit(payload.userId, 'line')) {
      const result = await sendLineNotify(config.line_token, payload);
      results.push({ channel: 'line', ...result });
    } else {
      const delay = Math.ceil(getResetDelay(payload.userId, 'line') / 1000);
      results.push({
        channel: 'line',
        success: false,
        error: `Rate limited. Try again in ~${delay}s.`,
      });
    }
  }

  // Email
  if (config.email && env.SENDGRID_API_KEY) {
    if (checkRateLimit(payload.userId, 'email')) {
      const result = await sendEmailNotification(config.email, payload, env.SENDGRID_API_KEY);
      results.push({ channel: 'email', ...result });
    } else {
      results.push({
        channel: 'email',
        success: false,
        error: 'Email rate limit reached. Try again later.',
      });
    }
  }

  // Discord
  if (config.discord_webhook) {
    if (checkRateLimit(payload.userId, 'discord')) {
      const result = await sendDiscordWebhook(config.discord_webhook, payload);
      results.push({ channel: 'discord', ...result });
    } else {
      const delay = Math.ceil(getResetDelay(payload.userId, 'discord') / 1000 / 60);
      results.push({
        channel: 'discord',
        success: false,
        error: `Discord rate limited. Try again in ~${delay} min.`,
      });
    }
  }

  return results;
}
