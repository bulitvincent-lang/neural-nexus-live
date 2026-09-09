import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

const VARIANT: OrbVariant = {
  topology: "spiral",
  palette: ["#123a7a", "#4fb6ff", "#ffd7a1"],
  accent: "#ffb058",
  glass: "#7fd8ff",
  nodes: 2200,
  degree: 3,
  breath: 0.02,
  spin: 0.075,
  rim: 1.1,
  satellites: 7,
  coreSize: 0.26,
};

export function GalaxyOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default GalaxyOrb;
