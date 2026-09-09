import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

const VARIANT: OrbVariant = {
  topology: "membrane",
  palette: ["#0a3a5c", "#22e0ff", "#d9fbff"],
  accent: "#ffc06a",
  glass: "#5fe6ff",
  nodes: 2600,
  degree: 4,
  breath: 0.055,
  spin: 0.04,
  rim: 1.35,
  coreSize: 0.34,
};

export function LiquidOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default LiquidOrb;
