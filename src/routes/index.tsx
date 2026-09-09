import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { NeuralCanvas } from "@/components/neural/NeuralCanvas";
import {
  DOWNLOADS,
  SITE,
  downloadUrl,
  guessPlatform,
  type PlatformId,
} from "@/config/site";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Neural Orb — Watch Your AI Think" },
      {
        name: "description",
        content:
          "Neural Orb is a silent desktop companion: a living neural sphere that breathes and pulses with your AI's real activity. Free download for macOS, Windows and Linux.",
      },
      { property: "og:title", content: "Neural Orb — Watch Your AI Think" },
      {
        property: "og:description",
        content:
          "A wordless, always-on-top neural sphere that shows your AI living and working. Download for macOS, Windows and Linux.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    title: "No interface",
    body: "No text, no menus, no charts. Only a living sphere floating above your work.",
  },
  {
    title: "Driven by real activity",
    body: "Searches, tool calls, thinking, parallel agents — each one becomes light and motion.",
  },
  {
    title: "Works with any AI",
    body: "A local bridge accepts activity from any agent or runtime. Nothing is stored, nothing leaves your machine.",
  },
  {
    title: "Feather-light",
    body: "GPU-native rendering with four quality modes, from Ultra down to a battery-friendly whisper.",
  },
];

function LandingPage() {
  const [platform, setPlatform] = useState<PlatformId>("macos-arm");

  useEffect(() => {
    setPlatform(guessPlatform(navigator.userAgent));
  }, []);

  const primary = DOWNLOADS.find((d) => d.id === platform) ?? DOWNLOADS[0];
  const others = DOWNLOADS.filter((d) => d !== primary);

  return (
    <div
      className="min-h-screen text-[#e6f2ff]"
      style={{
        background:
          "radial-gradient(circle at 50% 20%, rgba(18,30,58,0.75) 0%, rgba(5,7,14,0.96) 55%, #020306 100%)",
      }}
    >
      {/* Hero */}
      <header className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-[6vh] mx-auto h-[62vh] w-full max-w-[620px]">
          <NeuralCanvas />
        </div>

        <div className="relative z-10 mt-[46vh] flex flex-col items-center">
          <p className="text-[11px] uppercase tracking-[0.42em] text-[#7fa6d8]">
            {SITE.name}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-light leading-[1.08] tracking-tight sm:text-6xl">
            See your AI
            <span className="block bg-gradient-to-r from-[#4ce3ff] via-[#8f6bff] to-[#3a74ff] bg-clip-text text-transparent">
              live and work.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#9fb6d4] sm:text-base">
            A silent orb on your desktop. It breathes when your AI thinks, ignites when it
            searches, converges when it answers. No words. No dashboard.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <a
              href={downloadUrl(primary)}
              className="group relative inline-flex items-center gap-3 rounded-full border border-[#4ce3ff]/30 bg-[#0b1830]/70 px-8 py-4 text-sm tracking-wide backdrop-blur transition-all hover:border-[#4ce3ff]/70 hover:shadow-[0_0_40px_-8px_rgba(76,227,255,0.55)]"
            >
              <span className="h-2 w-2 rounded-full bg-[#4ce3ff] shadow-[0_0_12px_2px_rgba(76,227,255,0.8)]" />
              Download for {primary.label}
              <span className="text-[#7fa6d8]">{primary.note}</span>
            </a>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-[#6f8bab]">
              {others.map((d) => (
                <a
                  key={d.id + d.file}
                  href={downloadUrl(d)}
                  className="transition-colors hover:text-[#cfe4ff]"
                >
                  {d.label} · {d.note}
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <article key={f.title} className="bg-[#05070e]/80 p-8">
              <h2 className="text-base font-medium tracking-tight text-[#dfeaff]">{f.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#8ea6c4]">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-10 text-center text-[11px] tracking-wide text-[#5d7794]">
        <p>
          {SITE.name} v{SITE.version} · {SITE.domain}
        </p>
        <p className="mt-2">
          <a href={SITE.releasesPage} className="transition-colors hover:text-[#cfe4ff]">
            All builds &amp; release notes
          </a>
        </p>
      </footer>
    </div>
  );
}
