import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { OrbCard } from "@/components/store/OrbCard";
import { OrbPreviewModal } from "@/components/store/OrbPreviewModal";
import {
  ORB_PRICE,
  PAYMENTS_ENABLED,
  SUBSCRIPTION_PRICE,
  TRIAL_DAYS,
  formatPrice,
} from "@/config/pricing";
import { SITE } from "@/config/site";
import { useOrbLibrary } from "@/hooks/useOrbLibrary";
import { ORBS, ORB_BY_ID } from "@/lib/orbs/catalog";
import { orbState } from "@/lib/orbs/library";
import type { OrbId } from "@/lib/orbs/types";

export const Route = createFileRoute("/store")({
  ssr: false,
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
  const { library, setActiveOrb } = useOrbLibrary();
  const [previewId, setPreviewId] = useState<OrbId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const owned = useMemo(
    () => (library ? ORBS.filter((o) => orbState(library, o.id, o.included) !== "available") : []),
    [library],
  );
  const available = useMemo(
    () => (library ? ORBS.filter((o) => orbState(library, o.id, o.included) === "available") : ORBS),
    [library],
  );

  return (
    <div
      className="min-h-screen text-[#eaf2ff]"
      style={{
        background:
          "linear-gradient(180deg, #22304f 0%, #1a2540 34%, #151e35 68%, #121a2c 100%)",
      }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <Link to="/" className="text-[11px] uppercase tracking-[0.42em] text-[#9db9de]">
          {SITE.name}
        </Link>
        <Link
          to="/"
          className="text-[11px] tracking-wide text-[#9db9de] transition-colors hover:text-[#dcebff]"
        >
          Back to the app
        </Link>
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
        {!PAYMENTS_ENABLED && (
          <p className="mt-4 max-w-xl text-[11px] leading-relaxed text-[#8ba4c4]">
            Checkout opens shortly. Until then every orb can be tried free, as long as you like.
          </p>
        )}
      </section>

      {/* My Orbs */}
      <section className="mx-auto max-w-6xl px-6 pb-4">
        <h2 className="text-[11px] uppercase tracking-[0.32em] text-[#8ba4c4]">My Orbs</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {owned.map((orb) => (
            <OrbCard
              key={orb.id}
              orb={orb}
              state={library ? orbState(library, orb.id, orb.included) : "available"}
              active={library?.active_orb === orb.id}
              onPreview={() => setPreviewId(orb.id)}
              onUse={() => setActiveOrb(orb.id)}
              onBuy={() => undefined}
            />
          ))}
        </div>
      </section>

      {/* Available */}
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
              onPreview={() => setPreviewId(orb.id)}
              onUse={() => undefined}
              onBuy={() =>
                setNotice(
                  PAYMENTS_ENABLED
                    ? null
                    : `${orb.name} will be purchasable as soon as checkout opens. Nothing has been charged.`,
                )
              }
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

      {previewId ? (
        <OrbPreviewModal orb={ORB_BY_ID[previewId]} onClose={() => setPreviewId(null)} />
      ) : null}
    </div>
  );
}
