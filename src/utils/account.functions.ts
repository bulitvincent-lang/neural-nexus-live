import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AccountState {
  /** every orb the account owns, purchased or included */
  orbIds: string[];
  activeOrb: string;
  subscriptionActive: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
}

/** The account's orbs and current choice — the source of truth on every device. */
export const getAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: "sandbox" | "live" }) => data)
  .handler(async ({ data, context }): Promise<AccountState> => {
    const { supabase, userId } = context;

    const [{ data: orbs }, { data: pref }, { data: subs }] = await Promise.all([
      supabase
        .from("user_orbs")
        .select("orb_id")
        .eq("user_id", userId)
        .eq("environment", data.environment),
      supabase.from("user_preferences").select("active_orb").eq("user_id", userId).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const sub = subs?.[0] ?? null;
    const endsInFuture = !sub?.current_period_end || Date.parse(sub.current_period_end) > Date.now();
    const subscriptionActive = Boolean(
      sub &&
        endsInFuture &&
        ["active", "trialing", "past_due"].includes(sub.status) === true,
    ) ||
      Boolean(
        sub &&
          sub.status === "canceled" &&
          sub.current_period_end &&
          Date.parse(sub.current_period_end) > Date.now(),
      );

    return {
      // Neural is always part of the account.
      orbIds: ["neural", ...(orbs ?? []).map((o) => o.orb_id)].filter(
        (id, i, all) => all.indexOf(id) === i,
      ),
      activeOrb: pref?.active_orb ?? "neural",
      subscriptionActive,
      subscriptionStatus: sub?.status ?? null,
      currentPeriodEnd: sub?.current_period_end ?? null,
    };
  });

/** Remembers the chosen orb on the account, so it survives restarts and devices. */
export const setAccountActiveOrb = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orbId: string }) => {
    if (!/^[a-z]+$/.test(data.orbId)) throw new Error("Invalid orb");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, active_orb: data.orbId }, { onConflict: "user_id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
