import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key && key.startsWith('sk_')
  ? new Stripe(key, { typescript: true })
  : (null as unknown as Stripe);
