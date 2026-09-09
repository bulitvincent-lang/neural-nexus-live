import { AdaptiveDpr, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

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
  bloom = 0.26,
}: OrbStageProps) {
  const engineRef = useRef<NeuralEngine | null>(null);
  const [visible, setVisible] = useState(true);
  const Orb = RENDERERS[orbId];
  // full-fidelity previews; AdaptiveDpr protects weaker machines
  const quality = detail ?? 1;

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
      dpr={[1, 2]}
      frameloop={visible ? "always" : "never"}
      camera={camera}
      performance={{ min: 0.6 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
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
          autoRotate={mode === "preview"}
          autoRotateSpeed={0.35}
          minDistance={2.5}
          maxDistance={3.6}
          zoomSpeed={0.25}
        />
      ) : null}
      <EffectComposer enableNormalPass={false} multisampling={4}>
        <Bloom
          intensity={bloom}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.4}
          mipmapBlur
          radius={0.5}
        />
        <ToneMapping />
        <Noise opacity={0.012} premultiply />
        <Vignette offset={0.28} darkness={0.7} />
      </EffectComposer>

    </Canvas>
  );
}

