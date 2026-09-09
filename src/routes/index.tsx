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

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Neural Orb — Voyez votre IA vivre et travailler" },
      {
        name: "description",
        content:
          "Neural Orb est une sphère neuronale vivante posée sur votre bureau : elle respire, s'illumine et s'apaise au rythme de votre IA. Sans texte, sans réglages compliqués.",
      },
      {
        property: "og:title",
        content: "Neural Orb — Voyez votre IA vivre et travailler",
      },
      {
        property: "og:description",
        content:
          "Une sphère silencieuse et vivante qui montre l'activité de votre IA. Pour macOS, Windows et Linux.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    title: "Aucune interface",
    body: "Pas de texte, pas de menu, pas de graphique. Seulement une sphère vivante posée au-dessus de votre travail.",
  },
  {
    title: "Le rythme réel de votre IA",
    body: "Quand elle réfléchit, cherche ou répond, la sphère s'anime en conséquence — sans jamais inventer.",
  },
  {
    title: "Installation en un clic",
    body: "Vous choisissez simplement votre IA au premier lancement. Tout le reste se fait tout seul.",
  },
  {
    title: "Respect de votre vie privée",
    body: "Vos messages, réponses et fichiers ne quittent jamais votre ordinateur. Seul le rythme d'activité est utilisé.",
  },
];

function LandingPage() {
  const [platform, setPlatform] = useState<PlatformId>("macos-arm");

  useEffect(() => {
    setPlatform(guessPlatform(navigator.userAgent));
  }, []);

  const primary = DOWNLOADS.find((d) => d.id === platform) ?? DOWNLOADS[0];
  const others = DOWNLOADS.filter((d) => d !== primary);
  const ready = SITE.releaseReady;

  return (
    <div
      className="min-h-screen text-[#e6f2ff]"
      style={{
        background:
          "radial-gradient(circle at 50% 18%, rgba(30,56,104,0.3) 0%, rgba(5,9,20,0.97) 40%, #01030a 100%)",
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
            Voyez votre IA
            <span className="block bg-gradient-to-r from-[#4ce3ff] via-[#8f6bff] to-[#3a74ff] bg-clip-text text-transparent">
              vivre et travailler.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#9fb6d4] sm:text-base">
            Une sphère silencieuse sur votre bureau. Elle respire quand votre IA réfléchit,
            s'illumine quand elle cherche, se rassemble quand elle répond. Aucun mot, aucun
            tableau de bord.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            {ready ? (
              <a
                href={downloadUrl(primary)}
                className="group relative inline-flex items-center gap-3 rounded-full border border-[#4ce3ff]/30 bg-[#0b1830]/70 px-8 py-4 text-sm tracking-wide backdrop-blur transition-all hover:border-[#4ce3ff]/70 hover:shadow-[0_0_40px_-8px_rgba(76,227,255,0.55)]"
              >
                <span className="h-2 w-2 rounded-full bg-[#4ce3ff] shadow-[0_0_12px_2px_rgba(76,227,255,0.8)]" />
                Télécharger pour {primary.label}
                <span className="text-[#7fa6d8]">{primary.note}</span>
              </a>
            ) : (
              <Link
                to="/orb"
                className="group relative inline-flex items-center gap-3 rounded-full border border-[#4ce3ff]/30 bg-[#0b1830]/70 px-8 py-4 text-sm tracking-wide backdrop-blur transition-all hover:border-[#4ce3ff]/70 hover:shadow-[0_0_40px_-8px_rgba(76,227,255,0.55)]"
              >
                <span className="h-2 w-2 rounded-full bg-[#4ce3ff] shadow-[0_0_12px_2px_rgba(76,227,255,0.8)]" />
                Essayer la sphère maintenant
                <span className="text-[#7fa6d8]">dans le navigateur</span>
              </Link>
            )}

            {ready ? (
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
            ) : (
              <p className="max-w-md text-[11px] leading-relaxed text-[#6f8bab]">
                L'application pour macOS, Windows et Linux arrive très bientôt. En
                attendant, l'aperçu ci-dessus fonctionne directement ici.
              </p>
            )}

            <Link
              to="/connecteur"
              className="text-[11px] tracking-wide text-[#7fa6d8] underline-offset-4 transition-colors hover:text-[#cfe4ff] hover:underline"
            >
              Comment connecter votre IA en trois étapes
            </Link>
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
        <p className="mt-2 flex flex-wrap justify-center gap-4">
          <Link to="/orb" className="transition-colors hover:text-[#cfe4ff]">
            Aperçu de la sphère
          </Link>
          <Link to="/connecteur" className="transition-colors hover:text-[#cfe4ff]">
            Connecter mon IA
          </Link>
        </p>
      </footer>
    </div>
  );
}
