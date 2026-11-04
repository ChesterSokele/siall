import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import bodyBin from '../models/body.bin';
import { createMaterials, createDecalTextures, paintDecals, setLandmarks, BOX } from './garments.js';
import LM from './landmarks.json';

// body.bin: all body types share one topology (header: types, verts, indices; then indices; then positions per type)
function loadBodies() {
  const dv = new DataView(bodyBin.buffer, bodyBin.byteOffset, bodyBin.byteLength);
  const nt = dv.getUint32(0, true), vc = dv.getUint32(4, true), ic = dv.getUint32(8, true);
  const idx = new Uint16Array(ic); for (let i = 0; i < ic; i++) idx[i] = dv.getUint16(12 + i * 2, true);
  const base = 12 + ic * 2 + (ic * 2) % 4, types = [];
  for (let t = 0; t < nt; t++) { const p = new Float32Array(vc * 3); for (let i = 0; i < vc * 3; i++) p[i] = dv.getFloat32(base + (t * vc * 3 + i) * 4, true); types.push(p); }
  return { idx, types, vc };
}
const BODY_IDS = Object.keys(LM);

// Taubin (shrink-free) smoothing: garments drape over a smoothed body instead of tracing every muscle and rib
function makeSmoother(idx, n) {
  const adj = Array.from({ length: n }, () => new Set());
  for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2]; adj[a].add(b).add(c); adj[b].add(a).add(c); adj[c].add(a).add(b); }
  const nb = adj.map(s => Array.from(s));
  return (src, iters) => {
    let p = new Float32Array(src);
    const step = (lambda) => { const q = new Float32Array(p.length);
      for (let i = 0; i < n; i++) { const l = nb[i]; let x = 0, y = 0, z = 0; for (const j of l) { x += p[j * 3]; y += p[j * 3 + 1]; z += p[j * 3 + 2]; }
        const k = 1 / l.length; q[i * 3] = p[i * 3] + lambda * (x * k - p[i * 3]); q[i * 3 + 1] = p[i * 3 + 1] + lambda * (y * k - p[i * 3 + 1]); q[i * 3 + 2] = p[i * 3 + 2] + lambda * (z * k - p[i * 3 + 2]); }
      p = q; };
    for (let k = 0; k < iters; k++) { step(0.55); step(-0.58); }
    return p;
  };
}

const Kit3D = { ready: false };

Kit3D.init = function (stage, state, opts) {
  opts = Object.assign({ bar: true }, opts || {});
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return false; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'kit-gl';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D kit on a mannequin. Drag to rotate.');
  stage.classList.add('has3d'); stage.insertBefore(renderer.domElement, stage.firstChild);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.85;
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);

  // lights: soft key with shadow, cool fill, back rim
  const key = new THREE.DirectionalLight(0xfff4e8, 2.1); key.position.set(2.2, 3.6, 3.2); key.castShadow = false;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -1.3; key.shadow.camera.right = 1.3; key.shadow.camera.top = 2.2; key.shadow.camera.bottom = -0.5;
  key.shadow.camera.near = 1; key.shadow.camera.far = 10; key.shadow.radius = 5; key.shadow.bias = -0.0004; key.target.position.set(0, 0.9, 0);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.7); fill.position.set(-3, 1.6, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.0); rim.position.set(-1, 2.5, -4); scene.add(rim);

  // mannequin
  const skin = new THREE.MeshPhysicalMaterial({ color: 0x1b1e25, roughness: 0.34, metalness: 0.05, clearcoat: 0.85, clearcoatRoughness: 0.22 });
  const bodies = loadBodies(), smooth = makeSmoother(bodies.idx, bodies.vc);
  const geo = new THREE.BufferGeometry(), geoCloth = new THREE.BufferGeometry();
  [geo, geoCloth].forEach(g => { g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bodies.vc * 3), 3)); g.setIndex(new THREE.BufferAttribute(bodies.idx, 1)); });
  const figure = new THREE.Group(); scene.add(figure);
  const body = new THREE.Mesh(geo, skin); body.castShadow = true; figure.add(body);
  let bodyId = null;
  function setBody(id) {
    const t = BODY_IDS.indexOf(id); if (t < 0 || id === bodyId) return; bodyId = id;
    geo.attributes.position.array.set(bodies.types[t]); geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    geoCloth.attributes.position.array.set(smooth(bodies.types[t], 10)); geoCloth.attributes.position.needsUpdate = true; geoCloth.computeVertexNormals();
    setLandmarks(LM[id].lm);
  }
  setBody((state && state.body) || 'athletic');
  function setHeight(m) { const k = Math.max(0.92, Math.min(1.12, m / 1.78)); figure.scale.setScalar(k); }
  // headless dress-form look: a smooth cap closes the neck
  const neckCap = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skin);
  neckCap.scale.set(0.092, 0.03, 0.08); neckCap.position.set(0, 1.545, 0.04); neckCap.castShadow = true; figure.add(neckCap);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.03, 80), new THREE.MeshPhysicalMaterial({ color: 0x0a0b0e, roughness: 0.7, clearcoat: 0.1, envMapIntensity: 0.4 }));
  plinth.position.y = -0.015; plinth.receiveShadow = true; scene.add(plinth);
  const sc = document.createElement('canvas'); sc.width = sc.height = 256; const sx = sc.getContext('2d');
  const gr = sx.createRadialGradient(128, 128, 10, 128, 128, 126); gr.addColorStop(0, 'rgba(8,16,40,.55)'); gr.addColorStop(0.55, 'rgba(8,16,40,.18)'); gr.addColorStop(1, 'rgba(8,16,40,0)');
  sx.fillStyle = gr; sx.fillRect(0, 0, 256, 256);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.032; scene.add(floor);

  // dark "stadium" theme for the Kit Studio page: glowing rings round the podium and a light shaft from above
  if (opts.theme === 'dark') {
    floor.visible = false; plinth.material.color.set(0x14161c); plinth.material.clearcoat = 0.6; plinth.material.roughness = 0.4;
    const glowMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.395, 0.0075, 12, 140), glowMat(0xff6a0a, 0.95)); ring1.rotation.x = Math.PI / 2; ring1.position.y = 0.003; scene.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.004, 12, 140), glowMat(0x57c7ff, 0.6)); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.003; scene.add(ring2);
    const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d');
    const gg = gx.createRadialGradient(128, 128, 20, 128, 128, 126); gg.addColorStop(0, 'rgba(255,106,10,.0)'); gg.addColorStop(0.62, 'rgba(255,106,10,.28)'); gg.addColorStop(1, 'rgba(255,106,10,0)');
    gx.fillStyle = gg; gx.fillRect(0, 0, 256, 256);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.85, 64), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.002; scene.add(halo);
    const bc = document.createElement('canvas'); bc.width = 4; bc.height = 256; const bx = bc.getContext('2d');
    const bg = bx.createLinearGradient(0, 0, 0, 256); bg.addColorStop(0, 'rgba(160,200,255,0)'); bg.addColorStop(1, 'rgba(160,200,255,.9)');
    bx.fillStyle = bg; bx.fillRect(0, 0, 4, 256);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.95, 3.6, 48, 1, true), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 1.8; scene.add(beam);
    scene.userData.rings = [ring1, ring2];
  }

  // garments: fitted shells over the body
  const mats = createMaterials();
  const decals = createDecalTextures(renderer.capabilities.getMaxAnisotropy());
  const shirt = new THREE.Mesh(geoCloth, mats.shirt), shorts = new THREE.Mesh(geoCloth, mats.shorts), socks = new THREE.Mesh(geo, mats.socks);
  [shirt, shorts, socks].forEach(m => { m.frustumCulled = false; figure.add(m); });
  [['shirt', mats.shirt], ['shorts', mats.shorts], ['socks', mats.socks]].forEach(([k, mt]) => {
    const U = mt.userData.U; U.uDecF.value = decals[k].tf; U.uDecB.value = decals[k].tb; U.uBox.value.set(...BOX[k]);
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.8, 0); controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = false;
  controls.autoRotate = true; controls.autoRotateSpeed = 1.2; controls.minPolarAngle = 0.9; controls.maxPolarAngle = 1.75;
  controls.addEventListener('start', () => { controls.autoRotate = false; syncSpin(); });
  camera.position.set(0, 1.25, 5); controls.update();

  // view bar
  const bar = document.createElement('div'); bar.className = 'view-bar';
  const btn = (label, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (cls) b.className = cls; b.addEventListener('click', fn); bar.appendChild(b); return b; };
  let tween = null;
  function viewTo(theta) {
    const off = camera.position.clone().sub(controls.target), r = off.length(), cur = Math.atan2(off.x, off.z); let diff = theta - cur;
    while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
    const polar = 1.42, t0 = performance.now(); controls.autoRotate = false; syncSpin();
    tween = (now) => {
      const p = Math.min(1, (now - t0) / 750), e = 1 - Math.pow(1 - p, 3), th = cur + diff * e;
      camera.position.set(controls.target.x + r * Math.sin(polar) * Math.sin(th), controls.target.y + r * Math.cos(polar), controls.target.z + r * Math.sin(polar) * Math.cos(th));
      if (p >= 1) tween = null;
    };
  }
  function zoomTo(dist, y) { const dir = camera.position.clone().sub(controls.target).normalize(); controls.target.y = y; camera.position.copy(controls.target).addScaledVector(dir, dist); }
  btn('Front', () => viewTo(0)); btn('Side', () => viewTo(Math.PI / 2)); btn('Back', () => viewTo(Math.PI));
  const spin = btn('Auto-spin', () => { controls.autoRotate = !controls.autoRotate; syncSpin(); }, 'on');
  const syncSpin = () => spin.classList.toggle('on', controls.autoRotate);
  if (document.getElementById('kit')) {
    const flat = btn('Flat view', () => { const on = stage.classList.toggle('flat'); flat.classList.toggle('on', on); flat.textContent = on ? '3D view' : 'Flat view'; });
  }
  if (opts.bar) {
    stage.appendChild(bar);
    const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = 'Drag to rotate · scroll or pinch to zoom'; stage.appendChild(hint);
  }
  // camera API for custom UIs (the Kit Studio page)
  let fitDist = 5, tween2 = null;
  const FOCUS = { full: [0.8, 1.0], shirt: [1.27, 0.62], shorts: [0.74, 0.62], socks: [0.27, 0.5], back: [1.2, 0.7] };
  Kit3D.view = (name) => viewTo({ front: 0, side: Math.PI / 2, back: Math.PI }[name] || 0);
  Kit3D.setSpin = (on) => { controls.autoRotate = !!on; syncSpin(); };
  Kit3D.isSpinning = () => controls.autoRotate;
  Kit3D.rotate = (d) => { controls.autoRotate = false; syncSpin(); const off = camera.position.clone().sub(controls.target), th = Math.atan2(off.x, off.z) + d, r = Math.hypot(off.x, off.z); camera.position.set(controls.target.x + r * Math.sin(th), camera.position.y, controls.target.z + r * Math.cos(th)); };
  Kit3D.zoom = (f) => { const dir = camera.position.clone().sub(controls.target), d = Math.min(controls.maxDistance, Math.max(controls.minDistance, dir.length() * f)); camera.position.copy(controls.target).addScaledVector(dir.normalize(), d); };
  Kit3D.focus = (part) => {
    const f = FOCUS[part] || FOCUS.full, t0 = performance.now(), y0 = controls.target.y, off = camera.position.clone().sub(controls.target), d0 = off.length(), dir = off.normalize();
    const d1 = Math.min(controls.maxDistance, Math.max(controls.minDistance, fitDist * f[1]));
    tween2 = (now) => { const p = Math.min(1, (now - t0) / 650), e = 1 - Math.pow(1 - p, 3); controls.target.y = y0 + (f[0] - y0) * e; camera.position.copy(controls.target).addScaledVector(dir, d0 + (d1 - d0) * e); if (p >= 1) tween2 = null; };
  };

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const tanV = Math.tan(camera.fov * Math.PI / 360), fit = Math.max(0.98 / tanV, 0.7 / (tanV * camera.aspect));
    controls.minDistance = fit * 0.4; controls.maxDistance = fit * 1.5; fitDist = fit;
    const d = camera.position.distanceTo(controls.target);
    if (!Kit3D.ready || d > controls.maxDistance || d < controls.minDistance) {
      const dir = camera.position.clone().sub(controls.target).normalize(); camera.position.copy(controls.target).addScaledVector(dir, fit);
    }
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); window.addEventListener('resize', resize);
  resize();

  // ---- state -> materials ----
  let cur = state, queued = false;
  function apply() {
    queued = false;
    const s = cur, c = s.colors || {};
    if (s.body) setBody(s.body); if (s.height) setHeight(s.height);
    [mats.shirt, mats.shorts, mats.socks].forEach(mt => {
      const U = mt.userData.U;
      U.uK1.value.set(c.k1); U.uK2.value.set(c.k2); U.uK3.value.set(c.k3); U.uK4.value.set(c.k4);
      U.uPat.value = s.pat === 'checker' ? 1 : s.pat === 'stripes' ? 2 : 0;
      U.uTrimPat.value = s.trimPat === 'plain' ? 0 : 1;
      const col = s.collar || 'vneck';
      U.uStyle.value = col === 'crew' ? 1 : 0; U.uCollarW.value = col === 'polo' ? 0.05 : 0.024;
      mt.sheenColor.copy(U.uK1.value).multiplyScalar(0.7);
    });
    mats.socks.sheenColor.copy(mats.socks.userData.U.uK3.value).multiplyScalar(0.7);
    mats.shorts.sheenColor.copy(mats.shorts.userData.U.uK3.value).multiplyScalar(0.7);
    paintDecals(s, decals);
    [decals.shirt, decals.shorts, decals.socks].forEach(d => { d.tf.needsUpdate = true; d.tb.needsUpdate = true; });
  }
  Kit3D.update = (s) => { cur = s; if (!queued) { queued = true; requestAnimationFrame(apply); } };
  apply();
  if (document.fonts && document.fonts.load) document.fonts.load('800 40px Sora').then(() => apply(), () => { });

  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(stage);
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    if (tween) tween(now);
    if (tween2) tween2(now);
    if (scene.userData.rings) scene.userData.rings[1].rotation.z = now * 0.0003;
    controls.update(); renderer.render(scene, camera);
  })(performance.now());
  Kit3D.ready = true;
  return true;
};

window.Kit3D = Kit3D;
