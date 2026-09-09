import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { DEFAULT_ORB } from "@/lib/orbs/catalog";
import type { OrbId } from "@/lib/orbs/types";
import { getAccount, setAccountActiveOrb } from "@/utils/account.functions";
import { syncPurchases } from "@/utils/payments.functions";

const ACTIVE_KEY = "neural-orb.active-orb.v1";

function readLocalActive(): OrbId {
  if (typeof localStorage === "undefined") return DEFAULT_ORB;
  return (localStorage.getItem(ACTIVE_KEY) as OrbId) ?? DEFAULT_ORB;
}

function env(): "sandbox" | "live" {
  return paymentsConfigured() ? getStripeEnvironment() : "sandbox";
}

export interface OrbAccount {
  /** null while loading, false when nobody is signed in */
  email: string | null;
  signedIn: boolean;
  loading: boolean;
  orbIds: OrbId[];
  activeOrb: OrbId;
  subscriptionActive: boolean;
  subscriptionStatus: string | null;
  refresh: () => Promise<void>;
  restore: () => Promise<void>;
  setActiveOrb: (orbId: OrbId) => void;
  signOut: () => Promise<void>;
}

/**
 * The account is the source of truth for owned orbs. The chosen orb is also
 * mirrored locally so the desktop app opens on the right orb instantly.
 */
export function useOrbAccount(): OrbAccount {
  const [email, setEmail] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orbIds, setOrbIds] = useState<OrbId[]>([DEFAULT_ORB]);
  const [activeOrb, setActive] = useState<OrbId>(DEFAULT_ORB);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    setSignedIn(Boolean(session));
    setEmail(session?.user.email ?? null);
    if (!session) {
      setOrbIds([DEFAULT_ORB]);
      setActive(readLocalActive());
      setSubscriptionActive(false);
      setSubscriptionStatus(null);
      setLoading(false);
      return;
    }
    try {
      const account = await getAccount({ data: { environment: env() } });
      setOrbIds(account.orbIds as OrbId[]);
      setActive(account.activeOrb as OrbId);
      setSubscriptionActive(account.subscriptionActive);
      setSubscriptionStatus(account.subscriptionStatus);
      localStorage.setItem(ACTIVE_KEY, account.activeOrb);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setActive(readLocalActive());
    void load();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load();
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const setActiveOrb = useCallback(
    (orbId: OrbId) => {
      setActive(orbId);
      try {
        localStorage.setItem(ACTIVE_KEY, orbId);
      } catch {
        /* ignore */
      }
      if (signedIn) void setAccountActiveOrb({ data: { orbId } });
    },
    [signedIn],
  );

  const restore = useCallback(async () => {
    if (!signedIn || !paymentsConfigured()) return;
    await syncPurchases({ data: { environment: env() } });
    await load();
  }, [signedIn, load]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await load();
  }, [load]);

  return {
    email,
    signedIn,
    loading,
    orbIds,
    activeOrb,
    subscriptionActive,
    subscriptionStatus,
    refresh: load,
    restore,
    setActiveOrb,
    signOut,
  };
}
