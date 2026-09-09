import * as THREE from "three";

/**
 * Cold, premium palette: electric blue, cyan, violet, ice white, azure,
 * plus a single whisper of amber used sparingly for rare accents.
 */
export const PALETTE = [
  new THREE.Color("#3a74ff"),
  new THREE.Color("#4ce3ff"),
  new THREE.Color("#8f6bff"),
  new THREE.Color("#e6f2ff"),
  new THREE.Color("#59b6ff"),
  new THREE.Color("#ffc98a"),
];

export const PALETTE_FLAT = PALETTE.flatMap((c) => [c.r, c.g, c.b]);
