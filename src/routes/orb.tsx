import { createFileRoute } from "@tanstack/react-router";

import { NeuralCanvas } from "@/components/neural/NeuralCanvas";

export const Route = createFileRoute("/orb")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Neural Orb — Living Visualisation of Your AI" },
      {
        name: "description",
        content:
          "A silent desktop orb: a living 3D neural sphere that breathes, pulses and converges with the real activity of your AI.",
      },
      { property: "og:title", content: "Neural Orb — Living Visualisation of Your AI" },
      {
        property: "og:description",
        content: "Watch your AI think: a wordless neural sphere driven by real agent activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrbPage,
});

function OrbPage() {
  return (
    <main
      data-tauri-drag-region
      className="fixed inset-0 select-none overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 46%, rgba(26,48,92,0.34) 0%, rgba(6,10,22,0.94) 46%, #01030a 100%)",
      }}
    >
      <NeuralCanvas />
    </main>
  );
}
