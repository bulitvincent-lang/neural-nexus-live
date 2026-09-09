import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length && found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

/**
 * One checkout for both the yearly subscription and a one-time orb.
 * Signed in only: every purchase must belong to an account.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { priceId: string; returnUrl: string; environment: StripeEnv; orbId?: string }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    const { userId, supabase } = context;

    // A given orb can never be bought twice by the same account.
    if (data.orbId) {
      const { data: owned } = await supabase
        .from("user_orbs")
        .select("orb_id")
        .eq("user_id", userId)
        .eq("orb_id", data.orbId)
        .eq("environment", data.environment)
        .maybeSingle();
      if (owned) return { error: "You already own this orb." };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("Price not found");
      const isRecurring = stripePrice.type === "recurring";

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const customerId = await resolveOrCreateCustomer(stripe, {
        email: user?.email ?? undefined,
        userId,
      });

      let productDescription: string | undefined;
      if (!isRecurring) {
        const productId =
          typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
        const product = await stripe.products.retrieve(productId);
        productDescription = product.name;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        managed_payments: { enabled: true },
        ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
        metadata: {
          userId,
          priceId: data.priceId,
          managed_payments: "true",
          ...(data.orbId && { orbId: data.orbId }),
        },
        ...(isRecurring && { subscription_data: { metadata: { userId } } }),
      } as any);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type SyncResult = { orbIds: string[]; subscriptionActive: boolean } | { error: string };

/**
 * Reads the truth from the payment provider and writes it into the account.
 * Used when returning from checkout and by "Restore purchases", so a lost
 * connection or a closed window can never lose a paid purchase.
 */
export const syncPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<SyncResult> => {
    const { userId, supabase } = context;
    try {
      const stripe = createStripeClient(data.environment);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const customerIds = new Set<string>();
      const byMeta = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 100,
      });
      for (const c of byMeta.data) customerIds.add(c.id);
      if (customerIds.size === 0 && user?.email) {
        const byEmail = await stripe.customers.list({ email: user.email, limit: 100 });
        for (const c of byEmail.data) customerIds.add(c.id);
      }
      if (customerIds.size === 0) return { orbIds: [], subscriptionActive: false };

      const { ORB_BY_PRICE_ID } = await import("@/config/pricing");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const orbIds = new Set<string>();
      let subscriptionActive = false;

      for (const customerId of customerIds) {
        const sessions = await stripe.checkout.sessions.list({
          customer: customerId,
          limit: 100,
        });
        for (const session of sessions.data) {
          if (session.payment_status === "unpaid") continue;
          const priceId = session.metadata?.["priceId"];
          const orbId = session.metadata?.["orbId"] ?? (priceId ? ORB_BY_PRICE_ID[priceId] : undefined);
          if (!orbId) continue;
          orbIds.add(orbId);
          await supabaseAdmin.from("user_orbs").upsert(
            {
              user_id: userId,
              orb_id: orbId,
              source: "purchase",
              stripe_session_id: session.id,
              stripe_payment_intent_id:
                typeof session.payment_intent === "string" ? session.payment_intent : null,
              environment: data.environment,
            },
            { onConflict: "user_id,orb_id,environment" },
          );
        }

        const subs = await stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 100,
        });
        for (const sub of subs.data) {
          const item = sub.items?.data?.[0];
          const periodEnd = item?.current_period_end ?? (sub as any).current_period_end;
          if (["active", "trialing", "past_due"].includes(sub.status)) subscriptionActive = true;
          await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_subscription_id: sub.id,
              stripe_customer_id: customerId,
              price_id: item?.price?.lookup_key ?? item?.price?.id ?? null,
              product_id:
                typeof item?.price?.product === "string" ? item.price.product : null,
              status: sub.status,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
              environment: data.environment,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" },
          );
        }
      }

      return { orbIds: [...orbIds], subscriptionActive };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
