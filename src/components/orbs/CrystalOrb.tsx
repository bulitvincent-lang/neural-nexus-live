import { NeuralGlassOrb, type OrbVariant } from "./NeuralGlassOrb";
import type { OrbViewProps } from "./useOrbEngine";

/**
 * Rose-quartz crystal: sharp interlocking prisms of blush light with copper
 * edges, under a warm refracting shell. Deliberately unlike Plasma's violet.
 */
const VARIANT: OrbVariant = {
  topology: "shard",
  palette: ["#3a1226", "#ff9fc0", "#fff3e4"],
  accent: "#ffb277",
  glass: "#ffc2d4",
  nodes: 2400,
  degree: 4,
  breath: 0.008,
  spin: 0.038,
  rim: 1.35,
  shell: true,
  rays: true,
  satellites: 5,
  coreSize: 0.2,
  bolts: 12,
  tilt: 0.22,
};

export function CrystalOrb(props: OrbViewProps) {
  return <NeuralGlassOrb {...props} variant={VARIANT} />;
}

export default CrystalOrb;
