/**
 * Single source of truth for every price in Neural Orb.
 * No monthly plan, no tiers, no per-orb pricing.
 */
export const SUBSCRIPTION_PRICE = 19;
export const ORB_PRICE = 7.9;
export const TRIAL_DAYS = 7;
export const CURRENCY = "EUR";
export const CURRENCY_SYMBOL = "€";

/** Flip to true only once a real Stripe checkout is connected. */
export const PAYMENTS_ENABLED = false;

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
