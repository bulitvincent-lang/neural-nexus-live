import { AdaptiveDpr, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";

import { activityBus } from "@/lib/neural/eventBus";
import type { NeuralEngine } from "@/lib/neural/neuralEngine";
import { startDefaultProviders } from "@/lib/neural/providers";
import { runPreviewScript } from "@/lib/orbs/previewScript";
import type { OrbId } from "@/lib/orbs/types";
import type { OrbViewProps } from "./useOrbEngine";

/** Every orb shares this contract, so only the selected one is ever loaded. */
type OrbComponent = React.ComponentType<OrbViewProps>;

const RENDERERS: Record<OrbId, React.LazyExoticComponent<OrbComponent>> = {
  neural: lazy(() => import("./NeuralOrbView")),
  galaxy: lazy(() => import("./GalaxyOrb")),
  liquid: lazy(() => import("./LiquidOrb")),
  synapse: lazy(() => import("./SynapseOrb")),
  singularity: lazy(() => import("./SingularityOrb")),
  crystal: lazy(() => import("./CrystalOrb")),
  plasma: lazy(() => import("./PlasmaOrb")),
  aurora: lazy(() => import("./AuroraOrb")),
};

export interface OrbStageProps {
  orbId: OrbId;
  /** live = real AI activity, preview = scripted demonstration */
  mode?: "live" | "preview";
  /** 0.4 store preview .. 1 full quality */
  detail?: number;
  /** true when the ConnectorManager already runs the activity layer */
  managed?: boolean;
  interactive?: boolean;
  bloom?: number;
}

export function OrbStage({
  orbId,
  mode = "live",
  detail,
  managed = false,
  interactive = true,
  bloom = 0.55,
}: OrbStageProps) {
  const engineRef = useRef<NeuralEngine | null>(null);
  const [visible, setVisible] = useState(true);
  const Orb = RENDERERS[orbId];
  // previews run in a browser tab next to the whole store: keep them light
  const quality = detail ?? (mode === "preview" ? 0.5 : 1);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (mode !== "live" || managed) return;
    return startDefaultProviders();
  }, [mode, managed]);

  useEffect(() => {
    if (mode !== "live") return;
    const id = window.setInterval(() => engineRef.current?.connect(activityBus), 250);
    return () => window.clearInterval(id);
  }, [mode, orbId]);

  useEffect(() => {
    if (mode !== "preview") return;
    return runPreviewScript(() => engineRef.current);
  }, [mode, orbId]);

  const camera = useMemo(
    () => ({ position: [0, 0, 3.05] as [number, number, number], fov: 42 }),
    [],
  );

  return (
    <Canvas
      dpr={quality < 0.7 ? [1, 1.25] : [1, 2]}
      frameloop={visible ? "always" : "never"}
      camera={camera}
      performance={{ min: 0.45 }}
      gl={{ antialias: quality > 0.7, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Orb engineRef={engineRef} detail={quality} />
      </Suspense>
      <AdaptiveDpr pixelated={false} />
      {interactive ? (
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.32}
          minDistance={2.5}
          maxDistance={3.6}
          zoomSpeed={0.25}
        />
      ) : null}
      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={bloom}
          luminanceThreshold={0.62}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={0.6}
        />
        <ToneMapping />

        {quality > 0.7 ? <Noise opacity={0.014} premultiply /> : <></>}
        <Vignette offset={0.3} darkness={0.65} />
      </EffectComposer>
    </Canvas>
  );
}

