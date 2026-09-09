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
${DISPLACE}
void main() {
  vec3 p = displace(position, aSeed, uTime, uActivity, 1.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  int ci = int(mod(aCluster, 6.0));
  vec3 base = uPalette[0];
  for (int i = 0; i < 6; i++) { if (i == ci) base = uPalette[i]; }
  vec3 hot = mix(base, uPalette[3], 0.75);
  vColor = mix(base, hot, clamp(aAct, 0.0, 1.0));
  vAct = aAct;
  vDepth = clamp((-mv.z - 1.2) / 3.2, 0.0, 1.0);

  float size = uSize * (0.55 + 1.5 * aAct) * (0.75 + 0.45 * length(position));
  gl_PointSize = size * (300.0 / max(0.001, -mv.z));
}
`;

export const NODE_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAct;
varying float vDepth;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float glow = pow(core, 3.0);
  float depthFade = mix(1.0, 0.28, vDepth);
  float a = (0.10 + 0.9 * vAct) * (glow * 0.9 + core * 0.25) * depthFade;
  gl_FragColor = vec4(vColor * (0.6 + 1.5 * vAct), a);
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
  vColor = mix(base, uPalette[3], 0.25 * aAlpha);
  float depthFade = mix(1.0, 0.22, clamp((-mv.z - 1.2) / 3.2, 0.0, 1.0));
  vAlpha = aAlpha * depthFade;
}
`;

export const EDGE_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(vColor, vAlpha);
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
  vColor = mix(base, uPalette[3], 0.55);
  vEnergy = aEnergy;
  vDepth = clamp((-mv.z - 1.2) / 3.2, 0.0, 1.0);
  gl_PointSize = uSize * (0.4 + 1.4 * aEnergy) * (300.0 / max(0.001, -mv.z));
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
  float a = pow(core, 2.2) * vEnergy * mix(1.0, 0.3, vDepth);
  gl_FragColor = vec4(vColor * 1.6, a);
}
`;

export const DUST_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uActivity;
uniform float uSize;
varying float vFade;
${DISPLACE}
void main() {
  vec3 p = displace(position, aSeed, uTime, uActivity, 1.6);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vFade = mix(1.0, 0.15, clamp((-mv.z - 1.2) / 3.2, 0.0, 1.0));
  gl_PointSize = uSize * (0.5 + 0.5 * fract(aSeed * 7.3)) * (300.0 / max(0.001, -mv.z));
}
`;

export const DUST_FRAG = /* glsl */ `
uniform float uActivity;
varying float vFade;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(0.72, 0.85, 1.0), core * (0.06 + 0.10 * uActivity) * vFade);
}
`;
