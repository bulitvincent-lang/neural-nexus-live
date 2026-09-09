import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { NeuralCanvas } from "@/components/neural/NeuralCanvas";
import {
  ORB_PRICE,
  SUBSCRIPTION_INCLUDES,
  SUBSCRIPTION_PRICE,
  TRIAL_DAYS,
  formatPrice,
} from "@/config/pricing";
import {
  DOWNLOADS,
  SITE,
  downloadUrl,
  guessPlatform,
  type PlatformId,
} from "@/config/site";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Neural Orb — See your AI live and work" },
      {
        name: "description",
        content:
          "Neural Orb is a living neural sphere on your desktop: it breathes, glows and settles with the rhythm of your AI. No text, no settings to learn.",
      },
      { property: "og:title", content: "Neural Orb — See your AI live and work" },
      {
        property: "og:description",
        content:
          "A silent, living sphere showing your AI's activity. For macOS, Windows and Linux.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { t } = useI18n();
  const [platform, setPlatform] = useState<PlatformId>("macos-arm");

  useEffect(() => {
    setPlatform(guessPlatform(navigator.userAgent));
  }, []);

  const primary = DOWNLOADS.find((d) => d.id === platform) ?? DOWNLOADS[0];
  
  const ready = SITE.releaseReady;

  const features = [
    { title: t("f1.title"), body: t("f1.body") },
    { title: t("f2.title"), body: t("f2.body") },
    { title: t("f3.title"), body: t("f3.body") },
    { title: t("f4.title"), body: t("f4.body") },
  ];

  return (
    <div
      className="min-h-screen text-[#eaf2ff]"
      style={{
        background:
          "linear-gradient(180deg, #22304f 0%, #1a2540 34%, #151e35 68%, #121a2c 100%)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <span className="text-[11px] uppercase tracking-[0.42em] text-[#9db9de]">
          {SITE.name}
        </span>
      </div>

      {/* Hero — the orb sits in its own space, never behind the words */}
      <header className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 pt-6 text-center">
        <div className="relative h-[46vh] min-h-[260px] w-full max-w-[560px]">
          <NeuralCanvas />
        </div>

        <h1 className="mt-4 max-w-3xl text-4xl font-light leading-[1.08] tracking-tight sm:text-6xl">
          {t("hero.title1")}
          <span className="block bg-gradient-to-r from-[#7ceaff] via-[#a793ff] to-[#6c9dff] bg-clip-text text-transparent">
            {t("hero.title2")}
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#b3c6de] sm:text-base">
          {t("hero.sub")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          {ready ? (
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <label className="relative">
                <span className="sr-only">Choose your system</span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as PlatformId)}
                  className="appearance-none rounded-full border border-white/15 bg-[#101a30]/70 py-4 pl-6 pr-11 text-sm text-[#dcebff] backdrop-blur transition-colors hover:border-white/35 focus:border-[#7ceaff]/60 focus:outline-none"
                >
                  {DOWNLOADS.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#101a30] text-[#dcebff]">
                      {d.label} — {d.note}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-[#9db9de]">
                  ▼
                </span>
              </label>
              <a
                href={downloadUrl(primary)}
                className="group relative inline-flex items-center gap-3 rounded-full border border-[#7ceaff]/30 bg-[#101a30]/60 px-8 py-4 text-sm tracking-wide backdrop-blur transition-all hover:border-[#7ceaff]/70 hover:shadow-[0_0_40px_-8px_rgba(124,234,255,0.5)]"
              >
                <span className="h-2 w-2 rounded-full bg-[#7ceaff] shadow-[0_0_12px_2px_rgba(124,234,255,0.8)]" />
                {t("hero.download", { platform: primary.label })}
              </a>
            </div>
          ) : (
            <Link
              to="/orb"
              className="group relative inline-flex items-center gap-3 rounded-full border border-[#7ceaff]/30 bg-[#101a30]/60 px-8 py-4 text-sm tracking-wide backdrop-blur transition-all hover:border-[#7ceaff]/70 hover:shadow-[0_0_40px_-8px_rgba(124,234,255,0.5)]"
            >
              <span className="h-2 w-2 rounded-full bg-[#7ceaff] shadow-[0_0_12px_2px_rgba(124,234,255,0.8)]" />
              {t("hero.try")}
              <span className="text-[#9db9de]">{t("hero.tryNote")}</span>
            </Link>
          )}

          {!ready && (
            <p className="max-w-md text-[11px] leading-relaxed text-[#8ba4c4]">
              {t("hero.soon")}
            </p>
          )}

          {ready && (
            <p className="max-w-md text-[11px] leading-relaxed text-[#8ba4c4]">
              {t("hero.firstRun")}
            </p>
          )}

          <Link
            to="/connect"
            className="text-[11px] tracking-wide text-[#9db9de] underline-offset-4 transition-colors hover:text-[#dcebff] hover:underline"
          >
            {t("hero.howto")}
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
          {features.map((f) => (
            <article key={f.title} className="bg-[#182238]/90 p-8">
              <h2 className="text-base font-medium tracking-tight text-[#e6efff]">{f.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#a9bdd8]">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Pricing — one price, one CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-[#182238]/80 p-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[#8ba4c4]">{SITE.name}</p>
          <p className="mt-5 text-4xl font-light tracking-tight text-[#eaf2ff] sm:text-5xl">
            {formatPrice(SUBSCRIPTION_PRICE)}{" "}
            <span className="text-base text-[#9db9de]">/ year</span>
          </p>
          <p className="mt-3 text-sm text-[#b3c6de]">{TRIAL_DAYS}-day free trial</p>

          <ul className="mx-auto mt-8 max-w-sm space-y-2 text-left text-[13px] leading-relaxed text-[#a9bdd8]">
            {SUBSCRIPTION_INCLUDES.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-[#7ceaff]" />
                {line}
              </li>
            ))}
          </ul>

          {ready ? (
            <a
              href={downloadUrl(primary)}
              className="mt-9 inline-flex items-center gap-3 rounded-full border border-[#7ceaff]/40 bg-[#101a30]/60 px-8 py-4 text-sm tracking-wide transition-all hover:border-[#7ceaff]/80 hover:shadow-[0_0_40px_-8px_rgba(124,234,255,0.5)]"
            >
              Try Neural Orb free
              <span className="text-[#9db9de]">{primary.label}</span>
            </a>
          ) : (
            <Link
              to="/orb"
              className="mt-9 inline-flex items-center gap-3 rounded-full border border-[#7ceaff]/40 bg-[#101a30]/60 px-8 py-4 text-sm tracking-wide transition-all hover:border-[#7ceaff]/80"
            >
              Try Neural Orb free
            </Link>
          )}

          <p className="mt-5 text-[11px] leading-relaxed text-[#7f96b6]">
            No monthly plan, no tiers. Extra orbs are {formatPrice(ORB_PRICE)} each, one-time.
          </p>
          <Link
            to="/store"
            className="mt-4 inline-block text-[11px] tracking-wide text-[#9db9de] underline-offset-4 transition-colors hover:text-[#dcebff] hover:underline"
          >
            See the Orb Store
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-[11px] tracking-wide text-[#8098b6]">
        <p>
          {SITE.name} v{SITE.version} · {SITE.domain}
        </p>
        <p className="mt-2 flex flex-wrap justify-center gap-4">
          <Link to="/orb" className="transition-colors hover:text-[#dcebff]">
            {t("nav.preview")}
          </Link>
          <Link to="/store" className="transition-colors hover:text-[#dcebff]">
            Orb Store
          </Link>
          <Link to="/connect" className="transition-colors hover:text-[#dcebff]">
            {t("nav.connect")}
          </Link>
        </p>
      </footer>
    </div>
  );
}
