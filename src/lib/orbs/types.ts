export type OrbId =
  | "neural"
  | "galaxy"
  | "liquid"
  | "synapse"
  | "singularity"
  | "crystal"
  | "plasma"
  | "aurora";

export interface Orb {
  id: OrbId;
  name: string;
  /** one short sentence, plain language */
  summary: string;
  /** how this orb translates AI activity, in plain language */
  behaviour: string;
  /** included with the subscription, or a one-time purchase */
  included: boolean;
  /** two colors used for the lightweight store thumbnail */
  thumb: [string, string];
}

export type SubscriptionStatus = "none" | "trialing" | "active" | "expired";

/** Stripe-ready shape. Filled by real billing later, never faked. */
export interface Subscription {
  status: SubscriptionStatus;
  trial_started_at: string | null;
  trial_expires_at: string | null;
  started_at: string | null;
  expires_at: string | null;
  /** set by billing once it exists */
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export interface UserOrb {
  orb_id: OrbId;
  /** "included" for the bundled orb, "purchase" for a one-time buy */
  source: "included" | "purchase";
  acquired_at: string;
  stripe_payment_intent_id: string | null;
}

export interface OrbLibrary {
  subscription: Subscription;
  orbs: UserOrb[];
  active_orb: OrbId;
}

export type OrbState = "included" | "owned" | "available";
