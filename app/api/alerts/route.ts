import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Bypass mode: no auth, return empty data
async function getSafeUserId() {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') return 'bypass-user';
  return null; // NextAuth auth not configured, return null
}

export async function GET(req: NextRequest) {
  const userId = await getSafeUserId();

  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.json({ success: true, data: [], source: 'bypass' });
  }

  if (!userId) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [userId]
    );
    const userDbId = userResult.rows[0]?.id;
    if (!userDbId) return NextResponse.json({ success: true, data: [] });

    const result = await pool.query(`
      SELECT a.id, a.article_title, a.article_url, a.article_author,
             a.article_time, a.matched_keywords, a.notified_at,
             a.notification_channel, s.board_name
      FROM alert_logs a
      JOIN subscriptions s ON a.subscription_id = s.id
      WHERE s.user_id = $1
      ORDER BY a.notified_at DESC LIMIT $2
    `, [userDbId, limit]);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('GET alerts error:', message);
    return NextResponse.json({ success: true, data: [], error: message });
  }
}
