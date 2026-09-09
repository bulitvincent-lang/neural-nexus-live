import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { OrbId } from "@/lib/orbs/types";

const CYAN = "#09d8ff";
const VIOLET = "#6b62ff";
const MAGENTA = "#ff4fd8";
const AMBER = "#ffae55";

function RelicDust({ count = 260 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const y = 1 - (2 * (i + 0.5)) / count;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = i * 2.399963;
      const shell = 1.22 + ((i * 37) % 41) / 210;
      data[i * 3] = Math.cos(angle) * radius * shell;
      data[i * 3 + 1] = y * shell;
      data[i * 3 + 2] = Math.sin(angle) * radius * shell;
    }
    return data;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    ref.current.rotation.y += dt * 0.025;
    ref.current.rotation.z -= dt * 0.009;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={CYAN}
        size={0.009}
        transparent
        opacity={0.26}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function Ring({
  radius,
  tube = 0.006,
  rotation,
  color,
  opacity = 0.34,
}: {
  radius: number;
  tube?: number;
  rotation: [number, number, number];
  color: string;
  opacity?: number;
}) {
  return (
    <mesh rotation={rotation}>
      <torusGeometry args={[radius, tube, 8, 160]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function GlassShell({ radius = 1.04, opacity = 0.12 }: { radius?: number; opacity?: number }) {
  return (
    <mesh>
      <icosahedronGeometry args={[radius, 5]} />
      <meshPhysicalMaterial
        color={VIOLET}
        roughness={0.08}
        metalness={0.08}
        transmission={0.72}
        thickness={0.35}
        ior={1.38}
        iridescence={0.72}
        iridescenceIOR={1.3}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Satellites({ crystal = false }: { crystal?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const points = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const angle = (i / 9) * Math.PI * 2;
        return {
          position: [Math.cos(angle) * (1.12 + (i % 3) * 0.08), Math.sin(i * 1.7) * 0.42, Math.sin(angle) * (1.12 + (i % 3) * 0.08)] as [number, number, number],
          scale: 0.018 + (i % 4) * 0.009,
        };
      }),
    [],
  );
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += Math.min(delta, 0.05) * 0.12;
  });
  return (
    <group ref={group} rotation={[0.32, 0, -0.18]}>
      {points.map((point, i) => (
        <mesh key={i} position={point.position} scale={point.scale}>
          {crystal ? <octahedronGeometry args={[1, 0]} /> : <sphereGeometry args={[1, 10, 10]} />}
          <meshBasicMaterial color={i % 3 === 0 ? MAGENTA : i % 2 === 0 ? AMBER : CYAN} />
        </mesh>
      ))}
    </group>
  );
}

function Accents({ orbId }: { orbId: Exclude<OrbId, "neural"> }) {
  switch (orbId) {
    case "galaxy":
      return (
        <>
          <Ring radius={1.1} rotation={[1.18, 0.18, 0.12]} color={VIOLET} />
          <Ring radius={1.23} tube={0.004} rotation={[1.42, -0.28, 0.54]} color={CYAN} opacity={0.22} />
          <Satellites />
        </>
      );
    case "liquid":
      return (
        <>
          <GlassShell radius={1.04} opacity={0.16} />
          <Ring radius={1.12} tube={0.004} rotation={[1.36, 0.14, -0.38]} color={CYAN} opacity={0.2} />
        </>
      );
    case "synapse":
      return (
        <>
          <mesh scale={1.05}>
            <icosahedronGeometry args={[1, 2]} />
            <meshBasicMaterial color={VIOLET} wireframe transparent opacity={0.055} depthWrite={false} />
          </mesh>
          <Satellites />
        </>
      );
    case "singularity":
      return (
        <>
          <Ring radius={0.86} tube={0.012} rotation={[1.3, 0.12, 0.16]} color={AMBER} opacity={0.5} />
          <Ring radius={1.02} tube={0.005} rotation={[1.46, -0.18, -0.22]} color={MAGENTA} opacity={0.3} />
          <Ring radius={1.18} tube={0.003} rotation={[1.24, 0.35, 0.42]} color={CYAN} opacity={0.2} />
        </>
      );
    case "crystal":
      return (
        <>
          <mesh rotation={[0.32, 0.45, 0.08]}>
            <icosahedronGeometry args={[1.08, 2]} />
            <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.15} depthWrite={false} />
          </mesh>
          <Satellites crystal />
        </>
      );
    case "plasma":
      return (
        <>
          <GlassShell radius={1.06} opacity={0.08} />
          <Ring radius={1.12} rotation={[0.7, 0.4, 0.3]} color={MAGENTA} opacity={0.3} />
          <Ring radius={1.12} rotation={[1.9, -0.3, 0.9]} color={CYAN} opacity={0.3} />
        </>
      );
    case "aurora":
      return (
        <>
          <GlassShell radius={0.98} opacity={0.07} />
          <Ring radius={1.08} tube={0.004} rotation={[0.45, 0.25, 0.9]} color={MAGENTA} opacity={0.22} />
          <Ring radius={1.16} tube={0.004} rotation={[2.2, -0.2, 0.3]} color={CYAN} opacity={0.22} />
        </>
      );
  }
}

export function PaidOrbAccents({ orbId }: { orbId: Exclude<OrbId, "neural"> }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const dt = Math.min(delta, 0.05);
    group.current.rotation.y += dt * 0.018;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.025;
  });

  return (
    <group ref={group}>
      <RelicDust count={210} />
      <Accents orbId={orbId} />
    </group>
  );
}