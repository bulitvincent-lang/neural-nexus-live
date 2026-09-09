import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

/** Flat galactic disc with sweeping arms and a hot golden bulge. */
const VARIANT: OrbVariant = {
  topology: "disc",
  palette: ["#5a1f00", "#ff9a3c", "#fff2c9"],
  accent: "#ffd27a",
  glass: "#ffcf8a",
  nodes: 3000,
  degree: 3,
  breath: 0.014,
  spin: 0.13,
  rim: 0.9,
  satellites: 7,
  coreSize: 0.16,
  bolts: 10,
};

export function GalaxyOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default GalaxyOrb;
