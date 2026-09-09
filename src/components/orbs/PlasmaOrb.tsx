import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

const VARIANT: OrbVariant = {
  topology: "filament",
  palette: ["#3a1155", "#c85cff", "#ffd6f6"],
  accent: "#ff7ad0",
  glass: "#d07dff",
  nodes: 2700,
  degree: 3,
  breath: 0.04,
  spin: 0.07,
  rim: 1.0,
  coreSize: 0.3,
  bolts: 16,
};

export function PlasmaOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default PlasmaOrb;
