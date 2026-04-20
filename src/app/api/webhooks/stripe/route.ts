import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by stripe customer ID
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id, status')
        .eq('stripe_customer_id', customerId)
        .single();

      if (sub) {
        let status: 'trial' | 'active' | 'cancelled' = 'active';
        if (subscription.status === 'trialing') status = 'trial';
        else if (subscription.status === 'canceled' || subscription.status === 'unpaid')
          status = 'cancelled';

        await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        // Grant monthly credits on renewal (active status, was not already active)
        if (subscription.status === 'active' && sub.status !== 'active') {
          await supabase.from('credit_ledger').insert({
            user_id: sub.user_id,
            amount: 5,
            event_type: 'monthly_grant',
            description: 'Monthly subscription credits',
          });
        }

        // Grant trial credits when trial starts (only if transitioning to trial)
        if (subscription.status === 'trialing' && sub.status !== 'trial') {
          await supabase.from('credit_ledger').insert({
            user_id: sub.user_id,
            amount: 2,
            event_type: 'trial_grant',
            description: 'Free trial credits',
          });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Mark subscription as cancelled on payment failure
      if (customerId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_customer_id', customerId);

        // Notify user
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub) {
          await supabase.from('notifications').insert({
            user_id: sub.user_id,
            type: 'credit_received',
            title: 'Payment Failed',
            body: 'Your subscription payment failed. Please update your payment method to continue.',
            data: { event: 'payment_failed' },
          });
        }
      }
      break;
    }

    default:
      // Unhandled event — return 200 to prevent Stripe retries
      break;
  }

  return NextResponse.json({ received: true });
}
