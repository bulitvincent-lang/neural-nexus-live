import { useEffect, useMemo } from "react";

import { NeuralEngine } from "@/lib/neural/neuralEngine";

/** Every orb shares the same activity engine; only the graphics differ. */
export function useOrbEngine(
  engineRef: React.MutableRefObject<NeuralEngine | null>,
  clusterCount = 12,
) {
  const engine = useMemo(() => new NeuralEngine({ clusterCount }), [clusterCount]);
  useEffect(() => {
    engineRef.current = engine;
    return () => {
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [engine, engineRef]);
  return engine;
}

export interface OrbViewProps {
  engineRef: React.MutableRefObject<NeuralEngine | null>;
  /** 0.4 (light store preview) .. 1 (full desktop quality) */
  detail?: number;
}
