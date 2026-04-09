import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';

async function getSafeUserId() {
  try {
    const result = await auth();
    return result.userId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSafeUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ptt-alertor-indol.vercel.app';

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
