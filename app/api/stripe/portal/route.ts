import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';

async function getUserId() {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ptt-alertor-olive.vercel.app';

    // Look up user's Stripe customer ID
    const { pool } = await import('@/lib/db');
    const result = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE clerk_user_id = $1',
      [userId]
    );

    const customerId = result.rows[0]?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Billing portal error:', message);
    return NextResponse.json({ error: `Billing error: ${message}` }, { status: 500 });
  }
}
