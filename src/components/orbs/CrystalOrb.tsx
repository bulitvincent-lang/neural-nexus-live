import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

const VARIANT: OrbVariant = {
  topology: "facet",
  palette: ["#173b74", "#8fd8ff", "#ffffff"],
  accent: "#cfe8ff",
  glass: "#bfe8ff",
  nodes: 2000,
  degree: 4,
  breath: 0.012,
  spin: 0.045,
  rim: 1.6,
  satellites: 6,
  coreSize: 0.28,
};

export function CrystalOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default CrystalOrb;
