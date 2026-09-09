import { createFileRoute } from "@tanstack/react-router";

import { OrbApp } from "@/components/orb-ui/OrbApp";

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
  component: OrbApp,
});
