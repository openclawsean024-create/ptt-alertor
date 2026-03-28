import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { pool } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          await pool.query(
            'UPDATE users SET tier = $1, stripe_customer_id = $2, updated_at = NOW() WHERE clerk_user_id = $3',
            [plan, session.customer, userId]
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await pool.query(
            'UPDATE users SET tier = $1, stripe_subscription_id = $2, updated_at = NOW() WHERE clerk_user_id = $3',
            [sub.metadata?.plan || 'free', sub.id, userId]
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await pool.query(
            'UPDATE users SET tier = $1, stripe_subscription_id = NULL, updated_at = NOW() WHERE clerk_user_id = $2',
            ['free', userId]
          );
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Webhook handler error:', message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
