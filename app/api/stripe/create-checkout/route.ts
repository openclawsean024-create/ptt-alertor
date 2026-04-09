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

    const { plan } = await req.json();
    const validPlans = ['light', 'pro'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = plan === 'light'
      ? process.env.STRIPE_LIGHT_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ptt-alertor-indol.vercel.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?stripe=success`,
      cancel_url: `${baseUrl}/pricing?stripe=cancelled`,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Stripe checkout error:', message);
    return NextResponse.json({ error: `Stripe error: ${message}` }, { status: 500 });
  }
}
