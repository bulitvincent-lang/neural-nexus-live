import { NeuralSphere } from "@/components/neural/NeuralSphere";
import { QUALITY_PROFILES } from "@/lib/neural/types";
import type { OrbViewProps } from "./useOrbEngine";

/** The included orb, unchanged — only wrapped in the shared renderer contract. */
export function NeuralOrbView({ engineRef, detail = 1 }: OrbViewProps) {
  const quality =
    detail < 0.55
      ? QUALITY_PROFILES.LOW_POWER
      : detail < 0.8
        ? QUALITY_PROFILES.BALANCED
        : QUALITY_PROFILES.HIGH;
  return <NeuralSphere quality={quality} engineRef={engineRef} />;
}

export default NeuralOrbView;
