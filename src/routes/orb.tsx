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
          "radial-gradient(circle at 50% 48%, rgba(16,26,48,0.55) 0%, rgba(4,6,12,0.92) 58%, rgba(2,3,6,1) 100%)",
      }}
    >
      <NeuralCanvas />
    </main>
  );
}
