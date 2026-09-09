import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";

import { useEffect, useMemo, useRef, useState } from "react";

import { activityBus } from "@/lib/neural/eventBus";
import { startDefaultProviders } from "@/lib/neural/providers";


import type { NeuralEngine } from "@/lib/neural/neuralEngine";
import { QUALITY_PROFILES, type QualityLevel } from "@/lib/neural/types";
import { NeuralSphere } from "./NeuralSphere";

function autoQuality(): QualityLevel {
  if (typeof window === "undefined") return "BALANCED";
  const px = window.innerWidth * window.innerHeight;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (px < 200 * 200) return "LOW_POWER";
  if (cores >= 8 && px > 900 * 700) return "ULTRA";
  if (cores >= 6) return "HIGH";
  return "BALANCED";
}

export function NeuralCanvas({
  managed = false,
  powerSaving = false,
}: {
  /** true when the ConnectorManager already runs the activity layer */
  managed?: boolean;
  powerSaving?: boolean;
} = {}) {
  const engineRef = useRef<NeuralEngine | null>(null);
  const [visible, setVisible] = useState(true);
  const [level, setLevel] = useState<QualityLevel>("BALANCED");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("quality")?.toUpperCase() as QualityLevel | undefined;
    setLevel(
      powerSaving ? "LOW_POWER" : forced && forced in QUALITY_PROFILES ? forced : autoQuality(),
    );

    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [powerSaving]);

  // Providers -> Local Activity Bridge -> Event Bus. No host is hardcoded.
  useEffect(() => {
    if (managed) return;
    return startDefaultProviders();
  }, [managed]);



  const quality = QUALITY_PROFILES[level];

  useEffect(() => {
    const id = window.setInterval(() => {
      engineRef.current?.connect(activityBus);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const camera = useMemo(() => ({ position: [0, 0, 3.05] as [number, number, number], fov: 42 }), []);

  return (
    <Canvas
      dpr={quality.dpr}
      frameloop={visible ? "always" : "never"}
      camera={camera}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <NeuralSphere quality={quality} engineRef={engineRef} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.32}
        minDistance={2.5}
        maxDistance={3.6}
        zoomSpeed={0.25}
      />
      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={quality.bloom * 0.78}
          luminanceThreshold={0.28}
          luminanceSmoothing={0.5}
          mipmapBlur
          radius={0.74}
        />
        <ChromaticAberration offset={[0.0006, 0.0009]} radialModulation modulationOffset={0.35} />
        <ToneMapping />
        <Noise opacity={0.016} premultiply />
        <Vignette offset={0.28} darkness={0.7} />
      </EffectComposer>

    </Canvas>
  );
}
