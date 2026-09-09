import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { NeuralCanvas } from "@/components/neural/NeuralCanvas";
import {
  DOWNLOADS,
  SITE,
  downloadUrl,
  guessPlatform,
  type PlatformId,
} from "@/config/site";
import { LanguageSwitcher, useI18n } from "@/lib/i18n";

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
  const others = DOWNLOADS.filter((d) => d !== primary);
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
        <LanguageSwitcher />
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
            <a
              href={downloadUrl(primary)}
              className="group relative inline-flex items-center gap-3 rounded-full border border-[#7ceaff]/30 bg-[#101a30]/60 px-8 py-4 text-sm tracking-wide backdrop-blur transition-all hover:border-[#7ceaff]/70 hover:shadow-[0_0_40px_-8px_rgba(124,234,255,0.5)]"
            >
              <span className="h-2 w-2 rounded-full bg-[#7ceaff] shadow-[0_0_12px_2px_rgba(124,234,255,0.8)]" />
              {t("hero.download", { platform: primary.label })}
              <span className="text-[#9db9de]">{primary.note}</span>
            </a>
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

          {ready ? (
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-[#8ba4c4]">
              {others.map((d) => (
                <a
                  key={d.id + d.file}
                  href={downloadUrl(d)}
                  className="transition-colors hover:text-[#dcebff]"
                >
                  {d.label} · {d.note}
                </a>
              ))}
            </div>
          ) : (
            <p className="max-w-md text-[11px] leading-relaxed text-[#8ba4c4]">
              {t("hero.soon")}
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

      <footer className="border-t border-white/10 px-6 py-10 text-center text-[11px] tracking-wide text-[#8098b6]">
        <p>
          {SITE.name} v{SITE.version} · {SITE.domain}
        </p>
        <p className="mt-2 flex flex-wrap justify-center gap-4">
          <Link to="/orb" className="transition-colors hover:text-[#dcebff]">
            {t("nav.preview")}
          </Link>
          <Link to="/connect" className="transition-colors hover:text-[#dcebff]">
            {t("nav.connect")}
          </Link>
        </p>
      </footer>
    </div>
  );
}
