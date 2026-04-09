import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { pool } from '@/lib/db';

async function getUserId() {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [userId]
    );
    const userDbId = userResult.rows[0]?.id;

    if (!userDbId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: Record<string, any> = { updated_at: new Date() };
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.keywords !== undefined) updates.keywords = JSON.stringify(body.keywords);
    if (body.notify_line !== undefined) updates.notify_line = body.notify_line;
    if (body.notify_email !== undefined) updates.notify_email = body.notify_email;
    if (body.notify_discord !== undefined) updates.notify_discord = body.notify_discord;

    const setClauses = Object.entries(updates)
      .map(([key, _], i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = [...Object.values(updates), id, userDbId];

    const result = await pool.query(
      `UPDATE subscriptions SET ${setClauses} WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('PATCH subscription error:', message);
    return NextResponse.json({ error: `Internal error: ${message}` }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [userId]
    );
    const userDbId = userResult.rows[0]?.id;

    if (!userDbId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await pool.query(
      'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2',
      [id, userDbId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('DELETE subscription error:', message);
    return NextResponse.json({ error: `Internal error: ${message}` }, { status: 500 });
  }
}
