import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const userResult = await sql`SELECT id FROM users WHERE clerk_user_id = ${userId}`;
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

    const result = await sql.query(
      `UPDATE subscriptions SET ${setClauses} WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING *`,
      values
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('PATCH subscription error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userResult = await sql`SELECT id FROM users WHERE clerk_user_id = ${userId}`;
    const userDbId = userResult.rows[0]?.id;

    if (!userDbId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await sql`DELETE FROM subscriptions WHERE id = ${id} AND user_id = ${userDbId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE subscription error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
