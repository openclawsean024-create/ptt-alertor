import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { pool } from '@/lib/db';

async function getSafeUserId() {
  try {
    const result = await auth();
    return result.userId ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getSafeUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT s.*, b.alias as board_alias
      FROM subscriptions s
      LEFT JOIN boards b ON s.board_name = b.name
      WHERE s.user_id = (SELECT id FROM users WHERE clerk_user_id = $1)
      ORDER BY s.created_at DESC
    `, [userId]);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('GET subscriptions error:', message);
    return NextResponse.json({ error: `Internal error: ${message}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSafeUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { board_name, keywords, notify_line, notify_email, notify_discord } = body;

    if (!board_name || !keywords?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure user exists in DB
    let userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1 LIMIT 1',
      [userId]
    );
    let userDbId = userResult.rows[0]?.id;

    if (!userDbId) {
      const newUser = await pool.query(
        'INSERT INTO users (clerk_user_id) VALUES ($1) RETURNING id',
        [userId]
      );
      userDbId = newUser.rows[0].id;
    }

    // Check tier limits
    const subCount = await pool.query(
      'SELECT COUNT(*) as count FROM subscriptions WHERE user_id = $1',
      [userDbId]
    );
    if (parseInt(subCount.rows[0].count) >= 1) {
      const userTier = await pool.query(
        'SELECT tier FROM users WHERE id = $1',
        [userDbId]
      );
      if (userTier.rows[0]?.tier === 'free') {
        return NextResponse.json(
          { error: 'Free tier limited to 1 subscription. Upgrade to add more.' },
          { status: 403 }
        );
      }
    }

    const result = await pool.query(`
      INSERT INTO subscriptions (user_id, board_name, keywords, notify_line, notify_email, notify_discord)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userDbId, board_name, JSON.stringify(keywords), notify_line || false, notify_email || true, notify_discord || false]);

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('POST subscription error:', message);
    return NextResponse.json({ error: `Internal error: ${message}` }, { status: 500 });
  }
}
