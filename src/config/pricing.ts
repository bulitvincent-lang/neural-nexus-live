import type { OrbId } from "@/lib/orbs/types";

/**
 * Single source of truth for every price in Neural Orb.
 * No monthly plan, no tiers, no per-orb pricing.
 */
export const SUBSCRIPTION_PRICE = 19;
export const ORB_PRICE = 7.9;
export const TRIAL_DAYS = 7;
export const CURRENCY = "EUR";
export const CURRENCY_SYMBOL = "€";

/** Real checkout is live: prices exist in the payment system. */
export const PAYMENTS_ENABLED = true;

/** Subscription price id in the payment system. */
export const SUBSCRIPTION_PRICE_ID = "neural_orb_yearly";

/** One-time price id per purchasable orb. Neural is included, so it has none. */
export const ORB_PRICE_IDS: Partial<Record<OrbId, string>> = {
  galaxy: "orb_galaxy_onetime",
  liquid: "orb_liquid_onetime",
  synapse: "orb_synapse_onetime",
  singularity: "orb_singularity_onetime",
  crystal: "orb_crystal_onetime",
  plasma: "orb_plasma_onetime",
  aurora: "orb_aurora_onetime",
};

/** Reverse map, used by the payment webhook to know which orb was bought. */
export const ORB_BY_PRICE_ID: Record<string, OrbId> = Object.entries(ORB_PRICE_IDS).reduce(
  (acc, [orbId, priceId]) => {
    if (priceId) acc[priceId] = orbId as OrbId;
    return acc;
  },
  {} as Record<string, OrbId>,
);

export function formatPrice(amount: number): string {
  const fixed = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(".", ",");
  return `${fixed} ${CURRENCY_SYMBOL}`;
}

export const SUBSCRIPTION_INCLUDES = [
  "Desktop app for macOS, Windows and Linux",
  "The Neural orb included",
  "Compatible AI connectors",
  "Updates and compatibility maintenance",
  "Access to the Orb Store",
] as const;
