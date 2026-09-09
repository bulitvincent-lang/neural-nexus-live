import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

/** A violet-amethyst crystal: fractured inner light, refracting shell. */
const VARIANT: OrbVariant = {
  topology: "facet",
  palette: ["#2a0d4a", "#d46cff", "#fff6a3"],
  accent: "#f0c4ff",
  glass: "#caa3ff",
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
