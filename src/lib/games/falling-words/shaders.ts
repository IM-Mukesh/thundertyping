/** WebGL 1 only: analytic atmosphere and batched meshes, no raymarch or assets. */
export const SKY_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.99, 1.0);
}`;

export const SKY_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform float uHorizon;
uniform float uFloor;
uniform float uLaneInset;
uniform float uLanes;
uniform vec3 uAccent;
uniform vec3 uSecondary;
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform vec3 uGround;
uniform float uEnergy;
uniform float uImpact;
uniform float uHigh;

float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec3 ray = normalize(vec3((uv.x - 0.5) * aspect, uHorizon - uv.y, -1.15));
  vec3 sky = mix(uSkyTop, uSkyBottom, clamp(uv.y / uHorizon, 0.0, 1.0));
  vec2 cloudCoord = ray.xy * 4.0 + vec2(uTime * 0.012, 3.7);
  float cloud = noise(cloudCoord);
  if (uHigh > 0.5) cloud = cloud * 0.7 + noise(cloudCoord * 2.01 + 8.0) * 0.3;
  float fold = sin(ray.x * 4.1 + cloud * 3.0 + uTime * 0.08);
  float curtain = exp(-abs(ray.y - 0.22 - fold * 0.09) * 11.0);
  sky += uAccent * curtain * (0.20 + cloud * 0.2) * (0.7 + uEnergy * 0.5);
  sky += uSecondary * pow(cloud, 3.0) * 0.18 * (1.0 - uv.y);

  vec2 starCell = vec2(uv.x * aspect, uv.y) * 62.0;
  vec2 cell = floor(starCell);
  float seed = hash(cell);
  vec2 starPoint = fract(starCell) - vec2(hash(cell + 2.0), hash(cell + 7.0));
  float star = 1.0 - smoothstep(0.025, 0.10, length(starPoint));
  sky += vec3(0.53, 0.71, 0.83) * star * step(0.985 - uHigh * 0.007, seed) * (0.65 + sin(uTime * 0.4 + seed * 12.0) * 0.08);

  // Broad atmospheric dome/shell, distinct from the physical reactor rings.
  float dome = length(vec2((uv.x - 0.5) * 1.25, (uv.y - 0.93) * 0.84));
  float shell = exp(-abs(dome - 0.61) * 75.0);
  sky += uSecondary * shell * 0.18;
  sky += uAccent * exp(-abs(uv.y - uHorizon) * 30.0) * 0.18;

  vec3 color = sky;
  if (ray.y < -0.002) {
    // One plane intersection with organic mineral strata, no iterative tracing.
    float distanceToFloor = min(100.0, -2.4 / ray.y);
    vec3 world = vec3(0.0, 2.4, 10.0) + ray * distanceToFloor;
    float fog = exp(-distanceToFloor * 0.032);
    float strata = sin(world.x * 0.38 + world.z * 0.16 + cloud * 2.0);
    float seam = pow(max(0.0, 1.0 - abs(strata)), 16.0);
    vec3 ground = uGround * (0.8 + cloud * 0.35) + uAccent * seam * 0.045;
    color = mix(sky, ground, fog);
  }
  float defense = exp(-abs(uv.y - uFloor) * 400.0);
  float lane = (uv.x - uLaneInset) / (1.0 - 2.0 * uLaneInset) * uLanes;
  float laneMark = 1.0 - smoothstep(0.025, 0.10, abs(fract(lane) - 0.5));
  float inside = step(uLaneInset, uv.x) * step(uv.x, 1.0 - uLaneInset);
  color += uAccent * defense * (0.24 + laneMark * inside * 0.4);
  color += vec3(0.65, 0.08, 0.13) * uImpact * exp(-abs(uv.y - uFloor) * 28.0) * 0.3;
  color *= 0.68 + 0.32 * (1.0 - smoothstep(0.18, 0.8, length((uv - 0.5) * vec2(1.0, 0.8))));
  gl_FragColor = vec4(color, 1.0);
}`;

export const MESH_VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;
attribute float aEmission;
attribute float aAlpha;
uniform mat4 uViewProjection;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vColor;
varying float vEmission;
varying float vAlpha;
void main() {
  vPosition = aPosition;
  vNormal = aNormal;
  vColor = aColor;
  vEmission = aEmission;
  vAlpha = aAlpha;
  gl_Position = uViewProjection * vec4(aPosition, 1.0);
}`;

export const MESH_FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 uEye;
uniform vec3 uAccent;
uniform vec3 uFog;
uniform float uEnergy;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vColor;
varying float vEmission;
varying float vAlpha;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 light = normalize(vec3(-0.6, 0.8, 0.65));
  vec3 view = normalize(uEye - vPosition);
  float diffuse = max(dot(normal, light), 0.0);
  float specular = pow(max(dot(reflect(-light, normal), view), 0.0), 18.0);
  float rim = pow(1.0 - max(dot(normal, view), 0.0), 3.0);
  float coreLight = (0.10 + uEnergy * 0.15) / (1.0 + length(vPosition - vec3(0.0, 0.2, 1.0)) * 0.24);
  vec3 lit = vColor * (0.33 + diffuse * 0.86 + vEmission * 0.7);
  lit += vec3(0.65, 0.86, 1.0) * specular * 0.48 + uAccent * (rim * 0.13 + coreLight);
  float fog = exp(-max(0.0, uEye.z - vPosition.z - 12.0) * 0.025);
  gl_FragColor = vec4(mix(uFog, lit, fog), vAlpha);
}`;

export const SPRITE_VERTEX_SHADER = `
attribute vec2 aPosition;
attribute float aSize;
attribute vec4 aColor;
attribute float aRing;
uniform float uDpr;
uniform float uMaxPointSize;
varying vec4 vColor;
varying float vRing;
void main() {
  gl_Position = vec4(aPosition.x * 2.0 - 1.0, 1.0 - aPosition.y * 2.0, -0.99, 1.0);
  gl_PointSize = clamp(aSize * uDpr, 1.0, uMaxPointSize);
  vColor = aColor;
  vRing = aRing;
}`;

export const SPRITE_FRAGMENT_SHADER = `
precision mediump float;
varying vec4 vColor;
varying float vRing;
void main() {
  float radius = length(gl_PointCoord - 0.5) * 2.0;
  float glow = pow(max(0.0, 1.0 - radius), 2.0);
  float ring = smoothstep(0.65, 0.79, radius) * (1.0 - smoothstep(0.84, 1.0, radius));
  gl_FragColor = vec4(vColor.rgb, mix(glow, ring, vRing) * vColor.a);
}`;
