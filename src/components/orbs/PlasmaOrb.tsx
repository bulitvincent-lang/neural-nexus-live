import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

const VARIANT: OrbVariant = {
  topology: "filament",
  palette: ["#3a1155", "#c85cff", "#ffd6f6"],
  accent: "#ff7ad0",
  glass: "#d07dff",
  nodes: 2600,
  degree: 3,
  breath: 0.035,
  spin: 0.065,
  rim: 1.25,
  coreSize: 0.3,
};

export function PlasmaOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default PlasmaOrb;
