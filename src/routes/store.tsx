import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { CheckoutOverlay } from "@/components/store/CheckoutOverlay";
import { OrbCard } from "@/components/store/OrbCard";
import { OrbPreviewModal } from "@/components/store/OrbPreviewModal";
import {
  ORB_PRICE,
  ORB_PRICE_IDS,
  SUBSCRIPTION_PRICE,
  SUBSCRIPTION_PRICE_ID,
  TRIAL_DAYS,
  formatPrice,
} from "@/config/pricing";
import { SITE } from "@/config/site";
import { useOrbAccount } from "@/hooks/useOrbAccount";
import { ORBS, ORB_BY_ID } from "@/lib/orbs/catalog";
import { paymentsConfigured } from "@/lib/stripe";
import type { OrbId } from "@/lib/orbs/types";

export const Route = createFileRoute("/store")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { session_id?: string | undefined } => ({
    session_id: typeof search["session_id"] === "string" ? (search["session_id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Orb Store — eight ways to watch your AI | Neural Orb" },
      {
        name: "description",
        content: `Neural is included with Neural Orb. Seven more orbs — Galaxy, Liquid, Synapse, Singularity, Crystal, Plasma, Aurora — are ${formatPrice(ORB_PRICE)} each, one-time. Try each one free before buying.`,
      },
      { property: "og:title", content: "Orb Store — eight ways to watch your AI" },
      {
        property: "og:description",
        content: "Preview every orb free, then keep the ones you love. One-time purchase, no tiers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { session_id: sessionId } = Route.useSearch();
  const navigate = useNavigate();
  const account = useOrbAccount();
  const [previewId, setPreviewId] = useState<OrbId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<OrbId | "subscription" | null>(null);
  const [checkout, setCheckout] = useState<{ priceId: string; orbId?: OrbId | undefined; title: string } | null>(
    null,
  );

  const ownedIds = useMemo(() => new Set(account.orbIds), [account.orbIds]);
  const owned = ORBS.filter((o) => o.included || ownedIds.has(o.id));
  const available = ORBS.filter((o) => !o.included && !ownedIds.has(o.id));

  // Coming back from a payment: confirm with the payment provider, then show it.
  useEffect(() => {
    if (!sessionId || !account.signedIn) return;
    let cancelled = false;
    (async () => {
      setNotice("Confirming your purchase…");
      try {
        await account.restore();
        if (!cancelled) setNotice("All set — your purchase is on your account.");
      } catch {
        if (!cancelled)
          setNotice(
            "Your payment went through. It can take a moment to appear — use Restore purchases if needed.",
          );
      }
      navigate({ to: "/store", search: {}, replace: true });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, account.signedIn]);

  const startPurchase = (orbId: OrbId, name: string) => {
    if (pending) return;
    if (!account.signedIn) {
      navigate({ to: "/auth", search: { next: "/store" } });
      return;
    }
    if (!paymentsConfigured()) {
      setNotice("Checkout is not available in this build yet. Nothing has been charged.");
      return;
    }
    const priceId = ORB_PRICE_IDS[orbId];
    if (!priceId) return;
    setPending(orbId);
    setCheckout({ priceId, orbId, title: `${name} · ${formatPrice(ORB_PRICE)} one-time` });
  };

  const startSubscription = () => {
    if (pending) return;
    if (!account.signedIn) {
      navigate({ to: "/auth", search: { next: "/store" } });
      return;
    }
    if (!paymentsConfigured()) {
      setNotice("Checkout is not available in this build yet. Nothing has been charged.");
      return;
    }
    setPending("subscription");
    setCheckout({
      priceId: SUBSCRIPTION_PRICE_ID,
      title: `Neural Orb · ${formatPrice(SUBSCRIPTION_PRICE)} / year`,
    });
  };

  const closeCheckout = () => {
    setCheckout(null);
    setPending(null);
    setNotice("Payment cancelled — nothing has been charged.");
  };

  const returnUrl = `${typeof window === "undefined" ? SITE.url : window.location.origin}/store?session_id={CHECKOUT_SESSION_ID}`;

  return (
    <div
      className="min-h-screen text-[#eaf2ff]"
      style={{
        background: "linear-gradient(180deg, #22304f 0%, #1a2540 34%, #151e35 68%, #121a2c 100%)",
      }}
    >
      <PaymentTestModeBanner />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <Link to="/" className="text-[11px] uppercase tracking-[0.42em] text-[#9db9de]">
          {SITE.name}
        </Link>
        <div className="flex items-center gap-4 text-[11px] tracking-wide text-[#9db9de]">
          {account.signedIn ? (
            <>
              <button
                type="button"
                onClick={() => void account.restore()}
                className="transition-colors hover:text-[#dcebff]"
              >
                Restore purchases
              </button>
              <button
                type="button"
                onClick={() => void account.signOut()}
                className="transition-colors hover:text-[#dcebff]"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" search={{ next: "/store" }} className="transition-colors hover:text-[#dcebff]">
              Sign in
            </Link>
          )}
          <Link to="/" className="transition-colors hover:text-[#dcebff]">
            Back to the app
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16">
        <h1 className="max-w-2xl text-3xl font-light leading-tight tracking-tight sm:text-5xl">
          Orb Store
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#b3c6de]">
          Every orb reads the same activity from your AI and shows it in a completely different way.
          Neural comes with your {formatPrice(SUBSCRIPTION_PRICE)} / year subscription. Any other orb
          is {formatPrice(ORB_PRICE)}, once, yours for good.
        </p>
        {!account.signedIn && !account.loading ? (
          <p className="mt-4 max-w-xl text-[11px] leading-relaxed text-[#8ba4c4]">
            Sign in before buying so your orbs follow you on every computer.
          </p>
        ) : null}
        {account.signedIn && !account.subscriptionActive ? (
          <button
            type="button"
            onClick={startSubscription}
            disabled={pending === "subscription"}
            className="mt-6 rounded-full border border-[#7ceaff]/40 px-6 py-3 text-[12px] tracking-wide text-[#dcebff] transition-colors hover:border-[#7ceaff] disabled:opacity-40"
          >
            {pending === "subscription"
              ? "Opening…"
              : `Start Neural Orb — ${formatPrice(SUBSCRIPTION_PRICE)} / year`}
          </button>
        ) : null}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-4">
        <h2 className="text-[11px] uppercase tracking-[0.32em] text-[#8ba4c4]">My Orbs</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {owned.map((orb) => (
            <OrbCard
              key={orb.id}
              orb={orb}
              state={orb.included ? "included" : "owned"}
              active={account.activeOrb === orb.id}
              onPreview={() => setPreviewId(orb.id)}
              onUse={() => {
                account.setActiveOrb(orb.id);
                setNotice(`${orb.name} is now your live orb.`);
              }}
              onBuy={() => undefined}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <h2 className="text-[11px] uppercase tracking-[0.32em] text-[#8ba4c4]">
          Available · {formatPrice(ORB_PRICE)} each, one-time
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((orb) => (
            <OrbCard
              key={orb.id}
              orb={orb}
              state="available"
              active={false}
              busy={pending === orb.id}
              onPreview={() => setPreviewId(orb.id)}
              onUse={() => undefined}
              onBuy={() => startPurchase(orb.id, orb.name)}
            />
          ))}
        </div>
        <p className="mt-8 max-w-xl text-[11px] leading-relaxed text-[#7f96b6]">
          Orbs you buy stay in your account for good. If your {formatPrice(SUBSCRIPTION_PRICE)} /
          year subscription lapses they stay yours and come back the moment it is active again. Your
          first {TRIAL_DAYS} days are free.
        </p>
      </section>

      {notice ? (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/15 bg-[#101a30]/90 px-6 py-3 text-[12px] text-[#dcebff] backdrop-blur">
          {notice}
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="ml-4 text-[#8ba4c4] transition-colors hover:text-white"
          >
            OK
          </button>
        </div>
      ) : null}

      {checkout ? (
        <CheckoutOverlay
          priceId={checkout.priceId}
          orbId={checkout.orbId}
          title={checkout.title}
          returnUrl={returnUrl}
          onClose={closeCheckout}
        />
      ) : null}

      {previewId ? (
        <OrbPreviewModal orb={ORB_BY_ID[previewId]} onClose={() => setPreviewId(null)} />
      ) : null}
    </div>
  );
}
