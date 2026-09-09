import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

const VARIANT: OrbVariant = {
  topology: "dendrite",
  palette: ["#132a6b", "#5ea8ff", "#ffe6b0"],
  accent: "#ffb347",
  glass: "#9fd0ff",
  nodes: 2400,
  degree: 3,
  breath: 0.03,
  spin: 0.05,
  rim: 1.0,
  rays: true,
  satellites: 5,
  coreSize: 0.22,
};

export function SynapseOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default SynapseOrb;
