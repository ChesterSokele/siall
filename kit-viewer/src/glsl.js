// GLSL for the fitted garment shells. Every garment is a copy of the body surface pushed out along its
// normal ("ease"), cut at hems / sleeves / necklines, and shaded procedurally (pattern, trim, stripes, decals).

export const COMMON = /* glsl */`
uniform vec3 uS; uniform vec3 uE; uniform vec3 uHnd;
uniform float uSleeve; uniform float uHem; uniform float uStyle;
uniform vec4 uNeck; uniform float uBackY; uniform float uCollarW;
uniform float uWaist; uniform float uShortHem; uniform float uSockTop;
varying vec3 vObjP; varying vec3 vObjN;

float segD(vec3 p, vec3 a, vec3 b, out float t) {
  vec3 ab = b - a; float h = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  t = h * length(ab); return length(p - a - ab * h);
}
void armInfo(vec3 p, out float d, out float arc) {
  vec3 q = vec3(abs(p.x), p.y, p.z); float t1, t2;
  float d1 = segD(q, uS, uE, t1); float d2 = segD(q, uE, uHnd, t2);
  if (d1 < d2) { d = d1; arc = t1; } else { d = d2; arc = length(uE - uS) + t2; }
}
float necklineY(vec3 p, vec3 n) {
  float ax = abs(p.x);
  float front = (uStyle < 0.5) ? uNeck.x + uNeck.y * ax : uNeck.z + uNeck.w * ax * ax;
  float back = uBackY + 7.5 * ax * ax;
  return mix(back, front, smoothstep(-0.2, 0.35, n.z));
}
float hemLine(vec3 p) { return uHem + 0.014 * smoothstep(0.0, 0.2, abs(p.x)); }
float vfold(vec3 p) { return sin(p.y * 34.0 + p.x * 11.0) * sin(p.z * 21.0 - p.y * 9.0 + p.x * 5.0); }

#ifdef G_SHIRT
float garmentCut(vec3 p, vec3 n) {
  float d, arc; armInfo(p, d, arc);
  float c = hemLine(p) - p.y;
  if (d < 0.17 && arc > uSleeve) c = max(c, 1.0);
  return max(c, p.y - necklineY(p, n));
}
float garmentEase(vec3 p, vec3 n) {
  float d, arc; armInfo(p, d, arc);
  float armW = (1.0 - smoothstep(0.07, 0.1, d)) * smoothstep(0.02, 0.08, arc);
  float y = p.y;
  float torsoE = 0.015 + 0.006 * smoothstep(1.3, 0.95, y);
  float e = mix(torsoE, 0.018 + 0.022 * smoothstep(0.0, 0.17, arc), armW);
  float nl = (necklineY(p, n) - p.y) * (uStyle < 0.5 ? 0.6 : 0.8);
  e += uCollarW * 0.2 * (1.0 - smoothstep(0.0, uCollarW, nl)) * step(0.0, nl);
  e += (0.0028 * smoothstep(1.25, 0.95, p.y) + 0.0014 * armW) * vfold(p);
  return e;
}
#endif
#ifdef G_SHORTS
float garmentCut(vec3 p, vec3 n) { return max(max(p.y - uWaist, uShortHem - p.y), abs(p.x) - 0.27); }
float garmentEase(vec3 p, vec3 n) {
  return mix(0.036, 0.016, smoothstep(0.6, 0.99, p.y)) + 0.0022 * vfold(p) * smoothstep(1.0, 0.7, p.y);
}
#endif
#ifdef G_SOCKS
float garmentCut(vec3 p, vec3 n) { return p.y - uSockTop; }
float garmentEase(vec3 p, vec3 n) { return 0.0045 + 0.0008 * sin(p.y * 160.0); }
#endif
`;

export const VERT_INJECT = /* glsl */`
  vObjP = position; vObjN = normal;
  transformed += normalize(normal) * garmentEase(position, normal);
`;

export const FRAG_COMMON = /* glsl */`
uniform vec3 uK1; uniform vec3 uK2; uniform vec3 uK3; uniform vec3 uK4;
uniform float uPat; uniform float uTrimPat;
uniform sampler2D uDecF; uniform sampler2D uDecB; uniform vec4 uBox; uniform float uHasDec;

float checkerAA(vec2 p) {
  vec2 ddx = dFdx(p), ddy = dFdy(p); vec2 w = max(abs(ddx), abs(ddy)) + 0.001;
  vec2 i = 2.0 * (abs(fract((p - 0.5 * w) * 0.5) - 0.5) - abs(fract((p + 0.5 * w) * 0.5) - 0.5)) / w;
  return 0.5 - 0.5 * i.x * i.y;
}
float stripeAA(float x) {
  float w = max(abs(dFdx(x)), abs(dFdy(x))) + 0.001;
  float i = 2.0 * (abs(fract((x - 0.5 * w) * 0.5) - 0.5) - abs(fract((x + 0.5 * w) * 0.5) - 0.5)) / w;
  return 0.5 - 0.5 * i;
}
float edge(float v) { float w = fwidth(v) * 0.8 + 0.0005; return smoothstep(-w, w, v); }
float ornament(vec2 uv) {
  vec2 g = uv * 330.0;
  float a = sin(g.x) + sin(g.y * 1.2 + g.x * 0.5) + sin(g.y - g.x * 0.7);
  float fade = 1.0 - smoothstep(0.8, 2.0, length(fwidth(g)));
  return smoothstep(0.5, 1.7, abs(a)) * fade;
}
vec3 trimColor(vec3 base, vec2 uv, vec3 shade) {
  if (uTrimPat < 0.5) return base;
  return mix(base, mix(base, shade, 0.62) * 0.9, ornament(uv));
}
vec3 tonal(vec3 c, float m) { return mix(c * 0.86, c * 1.1 + vec3(0.010), m); }
vec3 tonalS(vec3 c, float m) { return mix(c * 0.93, c * 1.04 + vec3(0.003), m); }
vec3 pat(vec3 c, float pm) { return uPat > 1.5 ? tonalS(c, pm) : tonal(c, pm); }
vec4 decal(vec3 p, vec3 n) {
  if (uHasDec < 0.5) return vec4(0.0);
  float u = (p.x - uBox.x) / (uBox.y - uBox.x); float v = (p.y - uBox.z) / (uBox.w - uBox.z);
  vec4 f = vec4(0.0), b = vec4(0.0);
  if (u > 0.0 && u < 1.0 && v > 0.0 && v < 1.0) {
    f = texture2D(uDecF, vec2(u, v)); b = texture2D(uDecB, vec2(1.0 - u, v));
  }
  float wf = smoothstep(0.1, 0.45, n.z), wb = smoothstep(0.1, 0.45, -n.z);
  vec4 r = f * wf; r = mix(r, b, wb * b.a);
  r.a = max(f.a * wf, b.a * wb);
  return r;
}
`;

export const SHIRT_COLOR = /* glsl */`
  float d, arc; armInfo(vObjP, d, arc);
  vec3 P = vObjP, N = normalize(vObjN);
  float armW = (1.0 - smoothstep(0.07, 0.1, d)) * smoothstep(0.02, 0.08, arc);
  float ang = atan(P.x, P.z - 0.01);
  // surface coordinates: around/along the torso, or around/along the sleeve
  vec3 ax = normalize(uE - uS); vec3 rel = vec3(abs(P.x), P.y, P.z) - uS;
  vec3 b1 = normalize(cross(ax, vec3(0.0, 0.0, 1.0))); vec3 b2 = cross(ax, b1);
  vec2 uvT = vec2(ang * 0.17, P.y);
  vec2 uvS = vec2(atan(dot(rel, b2), dot(rel, b1)) * 0.05, arc);
  vec2 uv = armW > 0.5 ? uvS : uvT;
  vec3 col = uK1;
  float tone = 1.0;
  float pm = 1.0;
  if (uPat > 0.5 && uPat < 1.5) pm = checkerAA(uv / 0.042); else if (uPat > 1.5) pm = stripeAA(uv.x / 0.016);
  if (uPat > 0.5) col = pat(col, pm);
  // piping + side panel stripe running armpit to hem
  float sideA = abs(abs(ang) - 1.3);
  float below = smoothstep(1.3, 1.24, P.y) * (1.0 - armW);
  float stripe = (1.0 - edge(sideA - 0.095)) * below;
  float pipe = (1.0 - edge(abs(sideA - 0.175) - 0.016)) * below;
  col = mix(col, uK3, pipe);
  vec3 tcol = trimColor(uK2, uv, uK1);
  col = mix(col, tcol, stripe);
  // shoulder yoke (top-facing surface of the shoulders, running a little way onto the sleeve)
  float yokeY = 1.462 - 0.6 * (abs(P.x) - 0.09);
  float yoke = edge(P.y - yokeY) * (1.0 - edge(arc * armW - 0.05));
  col = mix(col, tcol, yoke);
  // sleeve cuff band
  float cuff = armW * (1.0 - edge(uSleeve - 0.043 - arc)) ;
  col = mix(col, tcol, cuff);
  // neckline rib / collar
  float nl = (necklineY(P, N) - P.y) * (uStyle < 0.5 ? 0.6 : 0.8);
  float collar = 1.0 - edge(nl - uCollarW);
  col = mix(col, trimColor(uK2, uv, uK1), collar);
  // hem + stitching
  float hemD = P.y - hemLine(P);
  col *= mix(0.9, 1.0, smoothstep(0.0, 0.05, hemD));
  float stitch = (1.0 - edge(abs(hemD - 0.013) - 0.0014)) + armW * (1.0 - edge(abs(arc - (uSleeve - 0.043)) - 0.0012)) + armW * (1.0 - edge(abs(arc - (uSleeve - 0.013)) - 0.0012));
  stitch += (1.0 - edge(abs(sideA - 0.095) - 0.0016)) * below + (1.0 - edge(abs(nl - uCollarW) - 0.0013));
  col *= 1.0 - 0.16 * clamp(stitch, 0.0, 1.0);
  gRough = 0.74;
  vec4 dc = decal(P, N); col = mix(col, dc.rgb, dc.a);
`;

export const SHORTS_COLOR = /* glsl */`
  vec3 P = vObjP, N = normalize(vObjN);
  float angL = atan(P.x - sign(P.x) * 0.1, P.z - 0.01);
  float angT = atan(P.x, P.z - 0.01);
  vec2 uv = vec2(mix(angL * 0.11, angT * 0.17, smoothstep(0.93, 1.0, P.y)), P.y);
  vec3 col = uK3; float pm = 1.0;
  if (uPat > 0.5 && uPat < 1.5) pm = checkerAA(uv / 0.042); else if (uPat > 1.5) pm = stripeAA(uv.x / 0.016);
  if (uPat > 0.5) col = pat(col, pm);
  vec3 tcol = trimColor(uK2, uv, uK3);
  // vent panel on the outer side of each leg
  float outer = smoothstep(0.55, 0.7, sign(P.x) * N.x);
  float vent = outer * (1.0 - edge(P.y - (uShortHem + 0.17 - 0.45 * abs(N.z))));
  vent *= 1.0 - edge(abs(N.z) - 0.42);
  col = mix(col, tcol, vent);
  // waistband
  float wb = edge(P.y - (uWaist - 0.035));
  col = mix(col, uK3 * 0.8, wb * 0.8);
  col *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.05, P.y - uShortHem));
  gRough = 0.78;
  vec4 dc = decal(P, N); col = mix(col, dc.rgb, dc.a);
`;

export const SOCKS_COLOR = /* glsl */`
  vec3 P = vObjP, N = normalize(vObjN);
  float ang = atan(P.x - sign(P.x) * 0.1, P.z - 0.01);
  vec2 uv = vec2(ang * 0.055, P.y);
  vec3 col = uK3; float pm = 1.0;
  if (uPat > 0.5 && uPat < 1.5) pm = checkerAA(uv / 0.04); else if (uPat > 1.5) pm = stripeAA(uv.x / 0.014);
  if (uPat > 0.5) col = pat(col, pm);
  col *= 0.94 + 0.06 * sin(P.y * 380.0);
  float top = edge(P.y - (uSockTop - 0.055));
  col = mix(col, trimColor(uK2, uv, uK3), top);
  gRough = 0.9;
  vec4 dc = decal(P, N); col = mix(col, dc.rgb, dc.a);
`;
