// Builds the mannequin body types from the MakeHuman base mesh (CC0, models/base.obj) + macro morph targets.
// Output: models/body.bin  (all body types, same topology) and src/landmarks.json (joint positions per body type).
// Units: metres, feet on y=0, facing +z.
import fs from 'node:fs';
const lines = fs.readFileSync('models/base.obj', 'utf8').split('\n');
const V0 = [], groups = {}; let cur = null;
for (const l of lines) {
  if (l.startsWith('v ')) V0.push(l.trim().split(/\s+/).slice(1, 4).map(Number));
  else if (l.startsWith('g ')) { cur = l.trim().split(/\s+/)[1]; groups[cur] = []; }
  else if (l.startsWith('f ')) groups[cur].push(l.trim().split(/\s+/).slice(1).map(t => parseInt(t.split('/')[0], 10) - 1));
}
const body = groups['body'];
const readTarget = f => { const o = []; for (const l of fs.readFileSync(`models/targets/${f}.target`, 'utf8').split('\n')) { if (!l || l[0] === '#') continue; const t = l.trim().split(/\s+/); o.push([+t[0], +t[1], +t[2], +t[3]]); } return o; };
const TG = {}; for (const n of ['minmuscle-minweight', 'minmuscle-averageweight', 'averagemuscle-minweight', 'averagemuscle-maxweight', 'maxmuscle-minweight', 'maxmuscle-averageweight']) TG[n] = readTarget(`universal-male-young-${n}`);
const ETH = ['african', 'asian', 'caucasian'].map(e => readTarget(`${e}-male-young`));

// body types: which macro targets to blend (weights) and how strongly to add the hand-made muscle shaping (k)
const TYPES = [
  { id: 'slim',      label: 'Slim',       mix: { 'minmuscle-minweight': 1 }, k: 0 },
  { id: 'lean',      label: 'Lean',       mix: { 'averagemuscle-minweight': 0.8, 'maxmuscle-minweight': 0.3 }, k: 0.45 },
  { id: 'athletic',  label: 'Athletic',   mix: { 'averagemuscle-minweight': 0.4, 'maxmuscle-minweight': 0.6 }, k: 0.8 },
  { id: 'muscular',  label: 'Muscular',   mix: { 'maxmuscle-minweight': 1 }, k: 1.0 },
  { id: 'power',     label: 'Powerhouse', mix: { 'maxmuscle-averageweight': 1 }, k: 1.2 },
  { id: 'stocky',    label: 'Stocky',     mix: { 'averagemuscle-maxweight': 0.75, 'minmuscle-averageweight': 0.0 }, k: 0.15 },
];

const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]);
const bell = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));

// the vertices that are kept (no head) are decided on the unmorphed base so every type has identical topology
let by0 = 1e9, by1 = -1e9; for (const f of body) for (const i of f) { by0 = Math.min(by0, V0[i][1]); by1 = Math.max(by1, V0[i][1]); }
const HEADCUT = 1.545, S0 = 1.78 / (by1 - by0);
const keepFaces = body.filter(f => f.every(i => (V0[i][1] - by0) * S0 <= HEADCUT));
const remap = new Map(), order = [];
const tris = [];
for (const f of keepFaces) { const a = f.map(i => { if (!remap.has(i)) { remap.set(i, order.length); order.push(i); } return remap.get(i); }); tris.push(a[0], a[1], a[2]); if (a.length === 4) tris.push(a[0], a[2], a[3]); }

function buildType(T) {
  const V = V0.map(p => p.slice());
  const apply = (tg, w) => { for (const [i, x, y, z] of tg) { V[i][0] += w * x; V[i][1] += w * y; V[i][2] += w * z; } };
  ETH.forEach(t => apply(t, 1 / 3));
  for (const [n, w] of Object.entries(T.mix)) if (w) apply(TG[n], w);
  let miny = 1e9, maxy = -1e9; for (const f of body) for (const i of f) { miny = Math.min(miny, V[i][1]); maxy = Math.max(maxy, V[i][1]); }
  const S = 1.78 / (maxy - miny);
  const HIP = 0.93, LEGLEN = 0.86, INWARD = 0.1;
  const stance = (x, y) => { const f = Math.min(1, Math.max(0, (HIP - y) / LEGLEN)); const k = f * f * (3 - 2 * f) * 0.35 + f * 0.65; return x - Math.sign(x) * Math.min(Math.abs(x) * 0.95, INWARD * k); };
  const T0 = p => { const y = (p[1] - miny) * S; return [stance(p[0] * S, y), y, p[2] * S]; };
  const J = {};
  for (const [g, faces] of Object.entries(groups)) { if (!g.startsWith('joint-')) continue; const set = new Set(faces.flat()); const c = [0, 0, 0]; for (const i of set) { const p = T0(V[i]); c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; } J[g.slice(6)] = c.map(v => v / set.size); }
  const K = T.k;
  function limb(q, A, B, kfun, rad, innerHalf) {
    const ab = sub(B, A), L = len(ab), u = mul(ab, 1 / L), ap = sub(q, A);
    const t = Math.min(L, Math.max(0, dot(ap, u))), c = add(A, mul(u, t)), r = sub(q, c), d = len(r);
    if (d > rad) return q;
    const w = 1 - ss(rad * 0.55, rad, d); let k = kfun(t) * w * K;
    if (innerHalf && (q[0] - c[0]) * innerHalf < 0) k *= 0.45;
    return add(c, mul(r, 1 + k));
  }
  const shape = (p0) => {
    let [x, y, z] = p0; const sgn = x < 0 ? -1 : 1; let q = [Math.abs(x), y, z];
    q = limb(q, J['l-shoulder'], J['l-elbow'], t => 0.1 * bell(t, 0.07, 0.07) + 0.2 * bell(t, 0.17, 0.08) + 0.06, 0.15);
    q = limb(q, J['l-elbow'], J['l-hand'], t => 0.12 * bell(t, 0.07, 0.09) + 0.03, 0.12);
    q = limb(q, J['l-upper-leg'], J['l-knee'], t => 0.11 * bell(t, 0.2, 0.17) + 0.015, 0.17, 1);
    q = limb(q, J['l-knee'], J['l-ankle'], t => 0.2 * bell(t, 0.12, 0.1) + 0.015, 0.12, 1);
    [x, y, z] = [q[0] * sgn, q[1], q[2]]; const ax = Math.abs(x);
    x *= 1 - 0.09 * K * ss(0.5, 0.88, y) * (1 - ss(0.98, 1.1, y));
    const torso = 1 - ss(0.2, 0.34, ax);
    const sx = 1 - 0.04 * K * ss(0.95, 1.08, y) * (1 - ss(1.12, 1.2, y)) + 0.1 * K * ss(1.18, 1.3, y) * ss(0.02, 0.12, ax) + 0.1 * K * ss(1.3, 1.42, y) * ss(0.08, 0.16, ax);
    x *= 1 + (sx - 1) * torso;
    const pec = Math.exp(-(Math.pow((ax - 0.085) / 0.085, 2) + Math.pow((y - 1.31) / 0.075, 2)));
    if (z > 0.05) z += 0.034 * K * pec;
    const belly = ss(0.98, 1.06, y) * (1 - ss(1.2, 1.3, y)) * (1 - ss(0.12, 0.22, ax));
    if (z > 0.05) z -= 0.01 * Math.min(1, K * 1.4) * belly;
    if (z < 0.01) z = 0.01 + (z - 0.01) * (1 - 0.15 * Math.min(1, K) * ss(0.78, 0.88, y) * (1 - ss(1.0, 1.1, y)));
    const nk = 1 + 0.2 * K * ss(1.43, 1.5, y) * (1 - ss(0.07, 0.13, ax));
    x *= nk; z = 0.012 + (z - 0.012) * nk;
    y += 0.016 * K * bell(ax, 0.09, 0.05) * ss(1.44, 1.5, y);
    return [x, y, z];
  };
  const T1 = p => shape(T0(p));
  const pos = new Float32Array(order.length * 3);
  order.forEach((i, k) => { const p = T1(V[i]); pos[k * 3] = p[0]; pos[k * 3 + 1] = p[1]; pos[k * 3 + 2] = p[2]; });
  const lm = {};
  for (const [g, faces] of Object.entries(groups)) { if (!g.startsWith('joint-')) continue; const set = new Set(faces.flat()); const c = [0, 0, 0]; for (const i of set) { const p = T1(V[i]); c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; } lm[g.slice(6)] = c.map(v => +(v / set.size).toFixed(4)); }
  return { pos, lm };
}

const built = TYPES.map(buildType);
const vc = order.length, ic = tris.length, nt = TYPES.length;
const buf = Buffer.alloc(12 + ic * 2 + (ic * 2) % 4 + nt * vc * 12);
buf.writeUInt32LE(nt, 0); buf.writeUInt32LE(vc, 4); buf.writeUInt32LE(ic, 8);
tris.forEach((v, k) => buf.writeUInt16LE(v, 12 + k * 2));
const base = 12 + ic * 2 + (ic * 2) % 4;      // keep float data 4-byte aligned
built.forEach((b, t) => b.pos.forEach((v, k) => buf.writeFloatLE(v, base + (t * vc * 3 + k) * 4)));
fs.writeFileSync('models/body.bin', buf);
const meta = {}; TYPES.forEach((T, t) => { meta[T.id] = { label: T.label, lm: built[t].lm }; });
fs.writeFileSync('src/landmarks.json', JSON.stringify(meta));
console.log('types', nt, 'verts', vc, 'tris', ic / 3, 'bytes', buf.length);
for (const T of TYPES) { const l = meta[T.id].lm; console.log(T.id.padEnd(9), 'shoulder', l['l-shoulder'].map(v => v.toFixed(3)).join(','), 'hand', l['l-hand'].map(v => v.toFixed(3)).join(',')); }
