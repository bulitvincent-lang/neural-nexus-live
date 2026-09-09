import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

/** The one orb whose identity is glass: faceted cage under a refracting shell. */
const VARIANT: OrbVariant = {
  topology: "facet",
  palette: ["#173b74", "#8fd8ff", "#ffffff"],
  accent: "#cfe8ff",
  glass: "#bfe8ff",
  nodes: 2200,
  degree: 4,
  breath: 0.01,
  spin: 0.045,
  rim: 1.5,
  shell: true,
  satellites: 6,
  coreSize: 0.28,
  bolts: 9,
};

export function CrystalOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default CrystalOrb;
