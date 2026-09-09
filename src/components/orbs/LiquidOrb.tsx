import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

/** Breathing cyan membrane, no shell — the surface itself is the object. */
const VARIANT: OrbVariant = {
  topology: "membrane",
  palette: ["#08324f", "#22e0ff", "#eaffff"],
  accent: "#7cf9ff",
  glass: "#5fe6ff",
  nodes: 2800,
  degree: 5,
  breath: 0.07,
  spin: 0.03,
  rim: 1.0,
  coreSize: 0.36,
  bolts: 12,
};

export function LiquidOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default LiquidOrb;
