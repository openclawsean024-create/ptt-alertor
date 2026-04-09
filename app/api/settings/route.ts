/**
 * User Notification Settings API
 * GET /api/settings — get current notification settings
 * PATCH /api/settings — update notification channel credentials
 */

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

export async function GET(req: NextRequest) {
  try {
    const userId = await getSafeUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      'SELECT line_id, email, discord_webhook, tier FROM users WHERE clerk_user_id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        has_line: !!user.line_id,
        has_email: !!user.email,
        has_discord: !!user.discord_webhook,
        tier: user.tier,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('GET settings error:', message);
    return NextResponse.json({ error: `Internal error: ${message}` }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getSafeUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { line_token, email, discord_webhook } = body;

    const updates: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (line_token !== undefined) {
      updates.push(`line_id = $${paramIndex++}`);
      values.push(line_token.trim() || null);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email.trim() || null);
    }
    if (discord_webhook !== undefined) {
      updates.push(`discord_webhook = $${paramIndex++}`);
      values.push(discord_webhook.trim() || null);
    }

    if (values.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE clerk_user_id = $${paramIndex} RETURNING line_id, email, discord_webhook`,
      values
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        has_line: !!user.line_id,
        has_email: !!user.email,
        has_discord: !!user.discord_webhook,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('PATCH settings error:', message);
    return NextResponse.json({ error: `Internal error: ${message}` }, { status: 500 });
  }
}
