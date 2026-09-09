import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

const VARIANT: OrbVariant = {
  topology: "ribbon",
  palette: ["#0d3a52", "#37e8d0", "#eafff8"],
  accent: "#8fa0ff",
  glass: "#63f0d8",
  nodes: 2300,
  degree: 3,
  breath: 0.05,
  spin: 0.035,
  rim: 1.0,
  satellites: 4,
  coreSize: 0.24,
  bolts: 11,
};

export function AuroraOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default AuroraOrb;
