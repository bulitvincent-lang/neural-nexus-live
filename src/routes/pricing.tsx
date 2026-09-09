import { Link, createFileRoute } from "@tanstack/react-router";

import { SITE } from "@/config/site";
import {
  ORB_PRICE,
  SUBSCRIPTION_INCLUDES,
  SUBSCRIPTION_PRICE,
  TRIAL_DAYS,
  formatPrice,
} from "@/config/pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Neural Orb" },
      {
        name: "description",
        content: `Neural Orb costs ${formatPrice(SUBSCRIPTION_PRICE)} per year with a ${TRIAL_DAYS}-day free trial. Extra spheres are ${formatPrice(ORB_PRICE)} once, forever.`,
      },
      { property: "og:title", content: "Pricing — Neural Orb" },
      {
        property: "og:description",
        content: `${formatPrice(SUBSCRIPTION_PRICE)} per year, ${TRIAL_DAYS} days free, extra spheres ${formatPrice(ORB_PRICE)} once.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div
      className="min-h-screen text-[#eaf2ff]"
      style={{
        background:
          "linear-gradient(180deg, #22304f 0%, #1a2540 34%, #151e35 68%, #121a2c 100%)",
      }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 pt-6">
        <Link to="/" className="text-[11px] uppercase tracking-[0.42em] text-[#9db9de]">
          {SITE.name}
        </Link>
        <Link to="/" className="text-sm text-[#c3d6f2] hover:text-white">
          Back
        </Link>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-light">Pricing</h1>
        <p className="mt-4 max-w-xl text-[#c3d6f2]">
          One simple price. No monthly plan, no tiers, no hidden options.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#9db9de]">
              Neural Orb
            </p>
            <p className="mt-4 text-4xl font-light">
              {formatPrice(SUBSCRIPTION_PRICE)}
              <span className="ml-2 text-base text-[#8ea8cd]">per year</span>
            </p>
            <p className="mt-2 text-sm text-[#a9c1e2]">
              {TRIAL_DAYS} days free. Cancel anytime.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[#c3d6f2]">
              {SUBSCRIPTION_INCLUDES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#9db9de]">
              Extra spheres
            </p>
            <p className="mt-4 text-4xl font-light">
              {formatPrice(ORB_PRICE)}
              <span className="ml-2 text-base text-[#8ea8cd]">once</span>
            </p>
            <p className="mt-2 text-sm text-[#a9c1e2]">
              Every sphere costs the same. Bought once, yours forever.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[#c3d6f2]">
              <li>Never billed again for a sphere you own.</li>
              <li>Linked to your account, not to one computer.</li>
              <li>Restored automatically when you sign in elsewhere.</li>
              <li>Switch between your spheres whenever you like.</li>
            </ul>
            <Link
              to="/store"
              className="mt-8 inline-flex rounded-full border border-white/15 bg-white/[0.06] px-5 py-2 text-sm text-[#eaf2ff] transition-colors hover:bg-white/[0.12]"
            >
              Browse the Orb Store
            </Link>
          </section>
        </div>

        <section className="mt-14">
          <h2 className="text-xl font-light">Good to know</h2>
          <div className="mt-4 space-y-3 text-sm text-[#a9c1e2]">
            <p>
              The Neural sphere is included with your subscription from the first day.
            </p>
            <p>
              If your subscription ends, the spheres you bought stay yours and come back the
              moment you renew.
            </p>
            <p>Prices are in euros, taxes included where applicable.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
