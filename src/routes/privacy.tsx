import { Link, createFileRoute } from "@tanstack/react-router";

import { SITE } from "@/config/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Neural Orb" },
      {
        name: "description",
        content:
          "Neural Orb only reads the rhythm of your AI activity. It never reads your prompts, answers, files or conversations.",
      },
      { property: "og:title", content: "Privacy — Neural Orb" },
      {
        property: "og:description",
        content: "Neural Orb never reads your prompts, answers, files or conversations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div
      className="min-h-screen text-[#eaf2ff]"
      style={{
        background:
          "linear-gradient(180deg, #22304f 0%, #1a2540 34%, #151e35 68%, #121a2c 100%)",
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-6">
        <Link to="/" className="text-[11px] uppercase tracking-[0.42em] text-[#9db9de]">
          {SITE.name}
        </Link>
        <Link to="/" className="text-sm text-[#c3d6f2] hover:text-white">
          Back
        </Link>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-light">Privacy</h1>
        <p className="mt-6 text-[#c3d6f2]">
          Neural Orb watches the rhythm of your AI, not its content. It sees when something
          starts, how intense it is and when it stops — nothing else.
        </p>

        <h2 className="mt-10 text-xl font-light">What it never reads</h2>
        <ul className="mt-3 space-y-2 text-[#a9c1e2]">
          <li>Your prompts and questions.</li>
          <li>The answers you receive.</li>
          <li>Your files, documents and conversations.</li>
          <li>Your screen contents.</li>
        </ul>

        <h2 className="mt-10 text-xl font-light">What is stored</h2>
        <p className="mt-3 text-[#a9c1e2]">
          Your account email, your subscription status and the spheres you own, so they follow
          you to any computer. Activity itself is never stored or sent anywhere.
        </p>

        <h2 className="mt-10 text-xl font-light">Contact</h2>
        <p className="mt-3 text-[#a9c1e2]">
          Questions about your data? Reach us through {SITE.domain}.
        </p>
      </main>
    </div>
  );
}
