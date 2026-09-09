import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

const VARIANT: OrbVariant = {
  topology: "ring",
  palette: ["#1b1440", "#7b6bff", "#ffcf8a"],
  accent: "#ff9d3d",
  glass: "#8f7dff",
  nodes: 2800,
  degree: 3,
  breath: 0.018,
  spin: 0.11,
  rim: 1.2,
  satellites: 9,
  coreSize: 0.2,
};

export function SingularityOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default SingularityOrb;
