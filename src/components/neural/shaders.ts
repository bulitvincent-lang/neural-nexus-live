/** Shared organic displacement so nodes, edges and pulses breathe identically. */
export const DISPLACE = /* glsl */ `
vec3 displace(vec3 p, float seed, float time, float activity, float breath) {
  float s = seed * 6.2831853;
  float pulse = 1.0 + breath * (0.014 + 0.012 * activity) * sin(time * 0.35 + s);
  vec3 drift = vec3(
    sin(time * 0.31 + s * 3.1),
    cos(time * 0.27 + s * 2.3),
    sin(time * 0.23 + s * 1.7)
  ) * (0.010 + 0.016 * activity);
  return p * pulse * (1.0 + 0.02 * activity) + drift;
}
`;

export const NODE_VERT = /* glsl */ `
attribute float aSeed;
attribute float aCluster;
attribute float aAct;
uniform float uTime;
uniform float uActivity;
uniform float uSize;
uniform vec3 uPalette[6];
varying vec3 vColor;
varying float vAct;
varying float vDepth;
varying float vTwinkle;
${DISPLACE}
void main() {
  vec3 p = displace(position, aSeed, uTime, uActivity, 1.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  int ci = int(mod(aCluster, 6.0));
  vec3 base = uPalette[0];
  for (int i = 0; i < 6; i++) { if (i == ci) base = uPalette[i]; }
  vec3 hot = mix(base, uPalette[3], 0.82);
  vColor = mix(base, hot, clamp(aAct * 1.15, 0.0, 1.0));
  vAct = aAct;
  vDepth = clamp((-mv.z - 1.2) / 3.2, 0.0, 1.0);
  vTwinkle = 0.82 + 0.18 * sin(uTime * (1.1 + fract(aSeed * 13.7) * 2.4) + aSeed * 31.0);

  float size = uSize * (0.5 + 1.7 * aAct) * (0.72 + 0.5 * length(position));
  gl_PointSize = size * vTwinkle * (3.0 / max(0.001, -mv.z));
}
`;

export const NODE_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAct;
varying float vDepth;
varying float vTwinkle;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  // two-lobe falloff: a tight incandescent core inside a soft halo
  float hot = pow(core, 7.0);
  float halo = pow(core, 1.7);
  float depthFade = mix(1.0, 0.26, vDepth);
  float a = (0.07 + 0.55 * vAct) * (hot * 1.15 + halo * 0.34) * depthFade * vTwinkle;
  vec3 col = mix(vColor, vec3(1.0), hot * (0.25 + 0.5 * vAct));
  gl_FragColor = vec4(col * (0.42 + 1.25 * vAct), a);
}
`;

export const EDGE_VERT = /* glsl */ `
attribute float aSeed;
attribute float aCluster;
attribute float aAlpha;
uniform float uTime;
uniform float uActivity;
uniform vec3 uPalette[6];
varying vec3 vColor;
varying float vAlpha;
${DISPLACE}
void main() {
  vec3 p = displace(position, aSeed, uTime, uActivity, 1.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  int ci = int(mod(aCluster, 6.0));
  vec3 base = uPalette[1];
  for (int i = 0; i < 6; i++) { if (i == ci) base = uPalette[i]; }
  vColor = mix(base, uPalette[3], 0.18 + 0.35 * aAlpha);
  float depth = clamp((-mv.z - 1.2) / 3.2, 0.0, 1.0);
  vAlpha = aAlpha * mix(1.0, 0.18, depth);
}
`;

export const EDGE_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(vColor * (0.7 + 0.6 * vAlpha), vAlpha * 0.52);
}
`;

export const PULSE_VERT = /* glsl */ `
attribute float aEnergy;
attribute float aTone;
uniform float uSize;
uniform vec3 uPalette[6];
varying vec3 vColor;
varying float vEnergy;
varying float vDepth;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  int ci = int(mod(aTone, 6.0));
  vec3 base = uPalette[1];
  for (int i = 0; i < 6; i++) { if (i == ci) base = uPalette[i]; }
  vColor = mix(base, uPalette[3], 0.4);
  vEnergy = aEnergy;
  vDepth = clamp((-mv.z - 1.2) / 3.2, 0.0, 1.0);
  gl_PointSize = uSize * (0.4 + 1.5 * aEnergy) * (3.0 / max(0.001, -mv.z));
}
`;

export const PULSE_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vEnergy;
varying float vDepth;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float hot = pow(core, 8.0);
  float halo = pow(core, 2.2);
  float a = (hot * 0.9 + halo * 0.4) * vEnergy * 0.6 * mix(1.0, 0.28, vDepth);
  // white-hot travelling head with a coloured corona
  vec3 col = mix(vColor, vec3(1.0), hot * 0.75);
  gl_FragColor = vec4(col, a);
}
`;

export const DUST_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uActivity;
uniform float uSize;
varying float vFade;
varying float vTint;
${DISPLACE}
void main() {
  vec3 p = displace(position, aSeed, uTime, uActivity, 1.6);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vFade = mix(1.0, 0.14, clamp((-mv.z - 1.2) / 3.2, 0.0, 1.0));
  vFade *= 0.6 + 0.4 * sin(uTime * (0.5 + fract(aSeed * 9.1)) + aSeed * 21.0);
  vTint = fract(aSeed * 5.3);
  gl_PointSize = uSize * (0.5 + 0.6 * fract(aSeed * 7.3)) * (3.0 / max(0.001, -mv.z));
}
`;

export const DUST_FRAG = /* glsl */ `
uniform float uActivity;
varying float vFade;
varying float vTint;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = pow(smoothstep(0.5, 0.0, d), 1.8);
  vec3 col = mix(vec3(0.62, 0.80, 1.0), vec3(0.80, 0.72, 1.0), vTint);
  gl_FragColor = vec4(col, core * (0.035 + 0.06 * uActivity) * max(vFade, 0.0));
}
`;

/** Soft fresnel shell: gives the network a glassy atmosphere and a lit rim. */
export const ATMO_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const ATMO_FRAG = /* glsl */ `
uniform float uTime;
uniform float uActivity;
uniform vec3 uInner;
uniform vec3 uRim;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float f = 1.0 - clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
  float rim = pow(f, 3.2);
  float body = pow(1.0 - f, 2.0);
  float breathe = 0.9 + 0.1 * sin(uTime * 0.5);
  vec3 col = uRim * rim * (0.55 + 0.9 * uActivity) + uInner * body * 0.22;
  float a = (rim * 0.30 + body * 0.05) * breathe * (0.7 + 0.5 * uActivity);
  gl_FragColor = vec4(col, a);
}
`;
