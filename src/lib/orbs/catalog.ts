import type { Orb, OrbId } from "./types";

export const ORBS: Orb[] = [
  {
    id: "neural",
    name: "Neural",
    summary: "The original living network of nodes, links and impulses.",
    behaviour: "Impulses travel along the connections as your AI thinks.",
    included: true,
    thumb: ["#4ce3ff", "#3a74ff"],
  },
  {
    id: "galaxy",
    name: "Galaxy",
    summary: "A living galaxy: spiral arms, a bright core and cosmic dust.",
    behaviour: "The arms accelerate and the core flares with activity.",
    included: false,
    thumb: ["#ffd39b", "#6d5cff"],
  },
  {
    id: "liquid",
    name: "Liquid",
    summary: "A fluid sphere with a breathing surface and inner waves.",
    behaviour: "Turbulence and vortices rise as the work intensifies.",
    included: false,
    thumb: ["#39f0d0", "#1e6bff"],
  },
  {
    id: "synapse",
    name: "Synapse",
    summary: "A biological structure of dendrites and branching growth.",
    behaviour: "New branches grow and synaptic impulses fire.",
    included: false,
    thumb: ["#b6ff8a", "#2bd6a8"],
  },
  {
    id: "singularity",
    name: "Singularity",
    summary: "A dark core, a luminous ring and orbital matter.",
    behaviour: "Matter is pulled toward the centre as answers converge.",
    included: false,
    thumb: ["#ffb469", "#3a1c6e"],
  },
  {
    id: "crystal",
    name: "Crystal",
    summary: "A crystalline structure of facets, polyhedra and inner shards.",
    behaviour: "Facets light up and geometry propagates through the shell.",
    included: false,
    thumb: ["#d9f2ff", "#7f8dff"],
  },
  {
    id: "plasma",
    name: "Plasma",
    summary: "Living energy: filaments, arcs and a controlled field.",
    behaviour: "Arcs multiply and discharge with every operation.",
    included: false,
    thumb: ["#ff7ad9", "#4dd2ff"],
  },
  {
    id: "aurora",
    name: "Aurora",
    summary: "Semi-transparent veils drifting in a calm volumetric flow.",
    behaviour: "The veils swell and drift with the rhythm of your AI.",
    included: false,
    thumb: ["#7cffc4", "#8f6bff"],
  },
];

export const ORB_BY_ID: Record<OrbId, Orb> = ORBS.reduce(
  (acc, o) => {
    acc[o.id] = o;
    return acc;
  },
  {} as Record<OrbId, Orb>,
);

export const DEFAULT_ORB: OrbId = "neural";
