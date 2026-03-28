import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const userResult = await sql`SELECT id FROM users WHERE clerk_user_id = ${userId}`;
    const userDbId = userResult.rows[0]?.id;

    if (!userDbId) {
      return NextResponse.json({ data: [] });
    }

    const result = await sql`
      SELECT 
        a.id,
        a.article_title,
        a.article_url,
        a.article_author,
        a.article_time,
        a.matched_keywords,
        a.notified_at,
        a.notification_channel,
        s.board_name
      FROM alert_logs a
      JOIN subscriptions s ON a.subscription_id = s.id
      WHERE s.user_id = ${userDbId}
      ORDER BY a.notified_at DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('GET alerts error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
