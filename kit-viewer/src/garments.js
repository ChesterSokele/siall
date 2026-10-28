import * as THREE from 'three';
import { COMMON, VERT_INJECT, FRAG_COMMON, SHIRT_COLOR, SHORTS_COLOR, SOCKS_COLOR } from './glsl.js';
import LOGO90 from './logo90.json';

const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);
const S = new THREE.Vector3(), E = new THREE.Vector3(), HND = new THREE.Vector3();
// joint positions of the current body type (shared by reference with every garment's uniforms)
export function setLandmarks(lm) { S.set(...lm['l-shoulder']); E.set(...lm['l-elbow']); const H = v3(lm['l-hand']); HND.copy(H).add(H.clone().sub(v3(lm['l-elbow'])).multiplyScalar(0.55)); }


function sharedUniforms() {
  return {
    uS: { value: S }, uE: { value: E }, uHnd: { value: HND },
    uSleeve: { value: 0.178 }, uHem: { value: 0.865 }, uStyle: { value: 0 },
    uNeck: { value: new THREE.Vector4(1.375, 1.45, 1.445, 8.0) }, uBackY: { value: 1.492 }, uCollarW: { value: 0.024 },
    uWaist: { value: 1.03 }, uShortHem: { value: 0.6 }, uSockTop: { value: 0.435 },
    uK1: { value: new THREE.Color() }, uK2: { value: new THREE.Color() }, uK3: { value: new THREE.Color() }, uK4: { value: new THREE.Color() },
    uPat: { value: 1 }, uTrimPat: { value: 1 },
    uDecF: { value: null }, uDecB: { value: null }, uBox: { value: new THREE.Vector4() }, uHasDec: { value: 1 },
  };
}

function make(kind, define, colorChunk, props) {
  const U = sharedUniforms();
  const mat = new THREE.MeshPhysicalMaterial(Object.assign({ side: THREE.DoubleSide, roughness: 0.8, metalness: 0, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff) }, props));
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    const head = `#define ${define}\n` + COMMON;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + head)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_INJECT);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + head + FRAG_COMMON)
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n float gRough = 0.8; if (garmentCut(vObjP, normalize(vObjN)) > 0.0) discard;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n {' + colorChunk + '\n diffuseColor.rgb = col; if (!gl_FrontFacing) diffuseColor.rgb *= 0.5; }')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec3 pp = vObjP * 1100.0; float fw = length(fwidth(pp));
          float h = (sin(pp.x) * sin(pp.y * 1.1 + pp.z * 0.4) + sin(pp.z) * 0.6) * (1.0 - smoothstep(0.6, 1.6, fw));
          vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition);
          float dHx = dFdx(h), dHy = dFdy(h);
          vec3 R1 = cross(sY, normal), R2 = cross(normal, sX);
          float det = dot(sX, R1);
          vec3 grad = sign(det) * (dHx * R1 + dHy * R2);
          normal = normalize(abs(det) * normal - 0.0009 * grad);
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = gRough;');
  };
  mat.customProgramCacheKey = () => kind;
  mat.userData.U = U;
  return mat;
}

export function createMaterials() {
  return {
    shirt: make('shirt', 'G_SHIRT', SHIRT_COLOR),
    shorts: make('shorts', 'G_SHORTS', SHORTS_COLOR),
    socks: make('socks', 'G_SOCKS', SOCKS_COLOR, { sheen: 0.5 }),
  };
}

/* ---------- decals (logos, name, number) painted on canvases and projected onto the garments ---------- */
const PPM = 1500; // pixels per metre
const BOX = {
  shirt: [-0.34, 0.34, 0.84, 1.56],
  shorts: [-0.34, 0.34, 0.55, 1.06],
  socks: [-0.34, 0.34, 0.0, 0.5],
};
function newCanvas(box) {
  const c = document.createElement('canvas');
  c.width = Math.round((box[1] - box[0]) * PPM); c.height = Math.round((box[3] - box[2]) * PPM);
  return c;
}
// world (x, y) -> canvas; `back` mirrors x because the back is seen from the other side
function mapper(box, back) {
  return (x, y) => [((back ? box[1] - x : x - box[0]) / (box[1] - box[0])) * (box[1] - box[0]) * PPM, (box[3] - y) * PPM];
}
// 90mins+ brand logo (vector, one colour) is the fixed mark on every kit; the customer's own logo goes in the slot.
const brandPaths = LOGO90.paths.map(d => new Path2D(d));
const BRAND_RATIO = LOGO90.vb[3] / LOGO90.vb[2];
function brandLogo(ctx, cx, cy, wM, tint, rot) {
  const w = wM * PPM, sc = w / LOGO90.vb[2];
  ctx.save(); ctx.translate(cx, cy); if (rot) ctx.rotate(rot);
  ctx.scale(sc, sc); ctx.translate(-LOGO90.vb[0] - LOGO90.vb[2] / 2, -LOGO90.vb[1] - LOGO90.vb[3] / 2);
  ctx.fillStyle = tint; brandPaths.forEach(p => ctx.fill(p, 'evenodd'));
  ctx.restore();
}
// The customer logo slot: 'custom' = the uploaded image, otherwise a dashed "YOUR LOGO" placeholder showing where it goes.
function customerSlot(ctx, cx, cy, sizeM, st, fabric, tint, rot) {
  const S = sizeM * PPM, mode = st.customerMode || (st.customer ? 'custom' : 'none');
  ctx.save(); ctx.translate(cx, cy); if (rot) ctx.rotate(rot);
  if (mode === 'custom' && st.customer) {
    const r = Math.min(S / st.customer.width, S / st.customer.height), w = st.customer.width * r, h = st.customer.height * r;
    ctx.drawImage(st.customer, -w / 2, -h / 2, w, h);
  } else {
    ctx.strokeStyle = tint; ctx.fillStyle = tint; ctx.globalAlpha = 0.85; ctx.lineWidth = Math.max(2, S * 0.035);
    ctx.setLineDash([S * 0.12, S * 0.09]); ctx.lineJoin = 'round';
    const r = S * 0.16, x = -S / 2, y = -S / 2;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + S, y, x + S, y + S, r); ctx.arcTo(x + S, y + S, x, y + S, r); ctx.arcTo(x, y + S, x, y, r); ctx.arcTo(x, y, x + S, y, r); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${S * 0.2}px Sora, Inter, sans-serif`; ctx.fillText('YOUR', 0, -S * 0.11); ctx.fillText('LOGO', 0, S * 0.13);
  }
  ctx.restore();
}

export function paintDecals(st, targets) {
  const c = st.colors;
  // shirt
  const sb = BOX.shirt, fF = targets.shirt.front.getContext('2d'), fB = targets.shirt.back.getContext('2d');
  [fF, fB].forEach(x => x.clearRect(0, 0, x.canvas.width, x.canvas.height));
  let m = mapper(sb, false);
  let p = m(-0.092, 1.318); brandLogo(fF, p[0], p[1], 0.078, c.k5);                         // chest, viewer's left: 90mins+
  p = m(0.092, 1.318); customerSlot(fF, p[0], p[1], 0.07, st, c.k1, c.k5);                // chest, viewer's right: customer logo
  p = m(0.062, 0.95); brandLogo(fF, p[0], p[1], 0.04, c.k5);                          // hem
  // woven label at the hem
  p = m(0.135, 0.958); fF.fillStyle = '#0d0d10'; fF.fillRect(p[0] - 0.021 * PPM, p[1] - 0.028 * PPM, 0.042 * PPM, 0.056 * PPM);
  fF.fillStyle = '#fff'; fF.fillRect(p[0] - 0.014 * PPM, p[1] + 0.012 * PPM, 0.028 * PPM, 0.003 * PPM); fF.fillRect(p[0] - 0.014 * PPM, p[1] + 0.019 * PPM, 0.02 * PPM, 0.003 * PPM);
  brandLogo(fF, p[0], p[1] - 0.008 * PPM, 0.026, '#ffffff');
  m = mapper(sb, true);
  p = m(0, 1.462); brandLogo(fB, p[0], p[1], 0.05, c.k5);                          // nape
  fB.fillStyle = c.k5; fB.textAlign = 'center'; fB.textBaseline = 'alphabetic';
  p = m(0, 1.395); fB.font = `800 ${0.034 * PPM}px Sora, Inter, sans-serif`;
  if ('letterSpacing' in fB) fB.letterSpacing = `${0.006 * PPM}px`;
  fB.fillText((st.name || '').toUpperCase(), p[0], p[1]);
  if ('letterSpacing' in fB) fB.letterSpacing = '0px';
  p = m(0, 1.11); fB.font = `800 ${0.3 * PPM}px Sora, Inter, sans-serif`;
  fB.fillText(st.number || '', p[0], p[1]);
  // shorts
  const hb = BOX.shorts, hF = targets.shorts.front.getContext('2d'), hB = targets.shorts.back.getContext('2d');
  [hF, hB].forEach(x => x.clearRect(0, 0, x.canvas.width, x.canvas.height));
  m = mapper(hb, false);
  p = m(-0.155, 0.69); brandLogo(hF, p[0], p[1], 0.07, c.k4);
  p = m(0.155, 0.69); customerSlot(hF, p[0], p[1], 0.06, st, c.k3, c.k4);
  // socks: logos read upwards along the shin
  const kb = BOX.socks, kF = targets.socks.front.getContext('2d'), kB = targets.socks.back.getContext('2d');
  [kF, kB].forEach(x => x.clearRect(0, 0, x.canvas.width, x.canvas.height));
  m = mapper(kb, false);
  p = m(-0.105, 0.25); brandLogo(kF, p[0], p[1], 0.11, c.k4, -Math.PI / 2);
  p = m(0.105, 0.25); customerSlot(kF, p[0], p[1], 0.055, st, c.k3, c.k4, -Math.PI / 2);
}

export function createDecalTextures(maxAniso) {
  const mk = (box) => { const f = newCanvas(box), b = newCanvas(box); const tf = new THREE.CanvasTexture(f), tb = new THREE.CanvasTexture(b); [tf, tb].forEach(t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; }); return { front: f, back: b, tf, tb }; };
  return { shirt: mk(BOX.shirt), shorts: mk(BOX.shorts), socks: mk(BOX.socks) };
}
export { BOX };
