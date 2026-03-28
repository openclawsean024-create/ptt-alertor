import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      SELECT s.*, b.alias as board_alias
      FROM subscriptions s
      LEFT JOIN boards b ON s.board_name = b.name
      WHERE s.user_id = (SELECT id FROM users WHERE clerk_user_id = ${userId})
      ORDER BY s.created_at DESC
    `;

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('GET subscriptions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { board_name, keywords, notify_line, notify_email, notify_discord } = body;

    if (!board_name || !keywords?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure user exists in DB
    let userResult = await sql`SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1`;
    let userDbId = userResult.rows[0]?.id;

    if (!userDbId) {
      const newUser = await sql`
        INSERT INTO users (clerk_user_id) VALUES (${userId}) RETURNING id
      `;
      userDbId = newUser.rows[0].id;
    }

    // Check tier limits
    const subCount = await sql`SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ${userDbId}`;
    if (parseInt(subCount.rows[0].count) >= 1) {
      // Check if user is on free tier
      const userTier = await sql`SELECT tier FROM users WHERE id = ${userDbId}`;
      if (userTier.rows[0]?.tier === 'free') {
        return NextResponse.json({ error: 'Free tier limited to 1 subscription. Upgrade to add more.' }, { status: 403 });
      }
    }

    const result = await sql`
      INSERT INTO subscriptions (user_id, board_name, keywords, notify_line, notify_email, notify_discord)
      VALUES (${userDbId}, ${board_name}, ${JSON.stringify(keywords)}, ${notify_line || false}, ${notify_email || true}, ${notify_discord || false})
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('POST subscription error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
