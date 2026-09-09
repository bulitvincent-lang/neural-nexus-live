import { createFileRoute } from "@tanstack/react-router";

import { SITE, connectorDownloadUrl } from "@/config/site";

export const Route = createFileRoute("/connecteur")({
  head: () => ({
    meta: [
      { title: `Connecter votre IA à ${SITE.name} — 3 étapes` },
      {
        name: "description",
        content:
          "Ajoutez le connecteur navigateur Neural Orb en trois étapes simples et regardez votre sphère réagir à ChatGPT, Claude, Gemini ou Copilot.",
      },
      { property: "og:title", content: `Connecter votre IA à ${SITE.name}` },
      {
        property: "og:description",
        content: "Trois étapes, aucune configuration technique, aucune donnée personnelle envoyée.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConnectorGuide,
});

const STEPS = [
  {
    title: "Téléchargez le connecteur",
    body: "Un seul fichier. Décompressez-le, il crée un dossier Neural Orb Connector.",
  },
  {
    title: "Ouvrez la page des modules de votre navigateur",
    body: "Menu du navigateur, puis Extensions. Activez le mode développeur en haut de la page.",
  },
  {
    title: "Choisissez le dossier",
    body: "Cliquez sur « Charger le dossier décompressé » et sélectionnez le dossier téléchargé. Terminé.",
  },
];

function ConnectorGuide() {
  return (
    <main
      className="min-h-screen px-6 py-20 text-white/80"
      style={{
        background:
          "radial-gradient(circle at 50% 12%, rgba(30,56,104,0.3) 0%, rgba(5,9,20,0.97) 42%, #01030a 100%)",
      }}
    >
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-light text-white/90">Connecter votre IA</h1>
        <p className="mt-3 text-white/50">
          Vous continuez à utiliser ChatGPT, Claude, Gemini ou Copilot exactement comme
          d'habitude. La sphère se met simplement à vivre en même temps que vous.
        </p>

        <a
          href={connectorDownloadUrl}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#38d6f0]/40 bg-[#38d6f0]/10 px-6 py-3 text-sm text-white/90 transition hover:bg-[#38d6f0]/20"
        >
          <span className="h-2 w-2 rounded-full bg-[#38d6f0]" />
          Télécharger le connecteur
        </a>

        <ol className="mt-12 space-y-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm text-white/70">
                {i + 1}
              </span>
              <span>
                <span className="block text-white/90">{s.title}</span>
                <span className="mt-1 block text-sm text-white/45">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-white/85">Vos conversations restent les vôtres</h2>
          <p className="mt-2 text-sm text-white/45">
            Le connecteur ne lit jamais vos messages, les réponses, vos fichiers ni vos
            conversations. Il observe uniquement le rythme de l'activité — début, en cours,
            terminé — et le transmet à l'application installée sur votre ordinateur. Rien ne part
            sur Internet.
          </p>
        </section>
      </div>
    </main>
  );
}
