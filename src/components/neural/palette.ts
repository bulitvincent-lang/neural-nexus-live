import * as THREE from "three";

/** Cold, premium palette: electric blue, cyan, violet, cold white, a whisper of amber. */
export const PALETTE = [
  new THREE.Color("#2e6bff"),
  new THREE.Color("#38d6f0"),
  new THREE.Color("#7b5cf0"),
  new THREE.Color("#cfe4ff"),
  new THREE.Color("#4aa8ff"),
  new THREE.Color("#f0b46a"),
];

export const PALETTE_FLAT = PALETTE.flatMap((c) => [c.r, c.g, c.b]);
