import { TRIAL_DAYS } from "@/config/pricing";
import { DEFAULT_ORB } from "./catalog";
import type { OrbId, OrbLibrary, OrbState, Subscription, UserOrb } from "./types";

const KEY = "neural-orb.library.v1";

function emptySubscription(): Subscription {
  return {
    status: "none",
    trial_started_at: null,
    trial_expires_at: null,
    started_at: null,
    expires_at: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
  };
}

function defaults(): OrbLibrary {
  return {
    subscription: emptySubscription(),
    orbs: [
      {
        orb_id: DEFAULT_ORB,
        source: "included",
        acquired_at: new Date().toISOString(),
        stripe_payment_intent_id: null,
      },
    ],
    active_orb: DEFAULT_ORB,
  };
}

export function readLibrary(): OrbLibrary {
  if (typeof localStorage === "undefined") return defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<OrbLibrary>;
    const base = defaults();
    return {
      subscription: { ...base.subscription, ...(parsed.subscription ?? {}) },
      orbs: parsed.orbs?.length ? parsed.orbs : base.orbs,
      active_orb: parsed.active_orb ?? base.active_orb,
    };
  } catch {
    return defaults();
  }
}

export function writeLibrary(lib: OrbLibrary): OrbLibrary {
  try {
    localStorage.setItem(KEY, JSON.stringify(lib));
  } catch {
    /* ignore */
  }
  return lib;
}

/** Refreshes derived status from the stored dates (no server needed yet). */
export function reconcile(lib: OrbLibrary): OrbLibrary {
  const s = lib.subscription;
  const now = Date.now();
  let status = s.status;
  if (status === "active" && s.expires_at && Date.parse(s.expires_at) < now) status = "expired";
  if (status === "trialing" && s.trial_expires_at && Date.parse(s.trial_expires_at) < now)
    status = "expired";
  if (status !== s.status) return { ...lib, subscription: { ...s, status } };
  return lib;
}

/** Starts the 7-day free trial once, silently, on first launch. */
export function startTrial(lib: OrbLibrary): OrbLibrary {
  if (lib.subscription.trial_started_at) return lib;
  const now = new Date();
  const end = new Date(now.getTime() + TRIAL_DAYS * 86400_000);
  return {
    ...lib,
    subscription: {
      ...lib.subscription,
      status: "trialing",
      trial_started_at: now.toISOString(),
      trial_expires_at: end.toISOString(),
    },
  };
}

/**
 * Adds an orb to the account for good. Called by real billing only —
 * purchases are never simulated in the UI.
 */
export function grantOrb(
  lib: OrbLibrary,
  orbId: OrbId,
  paymentIntentId: string | null = null,
): OrbLibrary {
  if (lib.orbs.some((o) => o.orb_id === orbId)) return lib;
  const entry: UserOrb = {
    orb_id: orbId,
    source: "purchase",
    acquired_at: new Date().toISOString(),
    stripe_payment_intent_id: paymentIntentId,
  };
  return { ...lib, orbs: [...lib.orbs, entry] };
}

export function ownsOrb(lib: OrbLibrary, orbId: OrbId): boolean {
  return lib.orbs.some((o) => o.orb_id === orbId);
}

export function orbState(lib: OrbLibrary, orbId: OrbId, included: boolean): OrbState {
  if (included) return "included";
  return ownsOrb(lib, orbId) ? "owned" : "available";
}

/** Subscription active or trialing = orbs are usable. Purchases are kept either way. */
export function isUsable(lib: OrbLibrary): boolean {
  const s = lib.subscription.status;
  return s === "trialing" || s === "active";
}

export function trialDaysLeft(lib: OrbLibrary): number | null {
  const end = lib.subscription.trial_expires_at;
  if (!end || lib.subscription.status !== "trialing") return null;
  return Math.max(0, Math.ceil((Date.parse(end) - Date.now()) / 86400_000));
}
