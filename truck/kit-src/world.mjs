// Kochi – NH544 – Thrissur world builder.
// Geography is hand-traced from approximate lat/lon of real junctions (not survey data).
// Scale: cities at ~1:3.3, open highway at ~1:8.3 (ETS2 uses ~1:19 for roads) – change below.
import fs from 'fs';
import * as THREE from 'three';
import { Model, C, makeDoc, nodeOf, instancedNode, writeGLB, rng } from './lib.mjs';
import * as A from './assets.mjs';

const HIGHWAY_SCALE = 0.12, CITY_SCALE = 0.3;
const ORIGIN = [9.975, 76.290];                         // lat, lon of world (0,0) before warp (Kochi centre)
const CITIES = [
  { name: 'Kochi', ll: [9.975, 76.290], R: 7000 },
  { name: 'Thrissur', ll: [10.5243, 76.2144], R: 4000 },
];
const LAT_M = 110574, LON_M = 111320 * Math.cos(ORIGIN[0] * Math.PI / 180);
const toM = ([lat, lon]) => [(lon - ORIGIN[1]) * LON_M, -(lat - ORIGIN[0]) * LAT_M]; // x east, z south
for (const c of CITIES) c.m = toM(c.ll);
export function warp([x, z]) {
  let wx = x * HIGHWAY_SCALE, wz = z * HIGHWAY_SCALE;
  for (const c of CITIES) {
    const dx = x - c.m[0], dz = z - c.m[1], r = Math.hypot(dx, dz) || 1e-9, k = (CITY_SCALE - HIGHWAY_SCALE) * Math.min(r, c.R) / r;
    wx += dx * k; wz += dz * k;
  }
  return [wx, wz];
}
const W = ll => warp(toM(ll));
for (const c of CITIES) c.w = W(c.ll);
const TH = CITIES[1].w, ROUND_R = 330 * CITY_SCALE;  // Swaraj Round radius in world metres

// ---------------- road network (main roads only) ----------------
const ROADS = [
  { name: 'NH544 Edappally-Mannuthy', type: 'nh', ll: [[10.0261, 76.3083], [10.040, 76.313], [10.0530, 76.3200], [10.075, 76.330], [10.095, 76.343], [10.1076, 76.3516], [10.116, 76.357], [10.135, 76.370], [10.155, 76.377], [10.175, 76.383], [10.1960, 76.3860], [10.226, 76.377], [10.247, 76.362], [10.267, 76.348], [10.289, 76.339], [10.307, 76.333], [10.330, 76.322], [10.352, 76.312], [10.372, 76.305], [10.391, 76.295], [10.405, 76.283], [10.423, 76.268], [10.445, 76.262], [10.468, 76.261], [10.490, 76.265], [10.512, 76.269], [10.532, 76.273]] },
  { name: 'Mannuthy-Thrissur Road', type: 'city', ll: [[10.532, 76.273], [10.531, 76.262], [10.529, 76.250], [10.527, 76.240], [10.5250, 76.230], [10.5244, 76.2205]] },
  { name: 'NH66 Bypass Kundannoor-Edappally', type: 'nh', ll: [[9.9395, 76.3190], [9.9530, 76.3195], [9.9674, 76.3183], [9.9820, 76.3150], [9.9983, 76.3110], [10.0130, 76.3095], [10.0261, 76.3083]] },
  { name: 'MG Road', type: 'city', ll: [[9.9470, 76.2960], [9.9600, 76.2890], [9.9706, 76.2853], [9.9817, 76.2810], [9.9890, 76.2803]] },
  { name: 'Banerji Rd - Kaloor - Palarivattom - Edappally', type: 'city', ll: [[9.9890, 76.2803], [9.9930, 76.2870], [9.9973, 76.2935], [10.0010, 76.3010], [10.0042, 76.3075], [10.0150, 76.3080], [10.0255, 76.3079]] },
  { name: 'Sahodaran Ayyappan Road', type: 'city', ll: [[9.9706, 76.2853], [9.9685, 76.2950], [9.9670, 76.3050], [9.9674, 76.3180]] },
  { name: 'Marine Drive', type: 'city', ll: [[9.9760, 76.2790], [9.9830, 76.2788], [9.9890, 76.2796]] },
  { name: 'Thevara - Willingdon Island - Fort Kochi', type: 'city', ll: [[9.9470, 76.2960], [9.9440, 76.2880], [9.9460, 76.2780], [9.9520, 76.2720], [9.9450, 76.2650], [9.9390, 76.2600], [9.9420, 76.2540], [9.9530, 76.2520], [9.9620, 76.2460], [9.9658, 76.2421]] },
  // Thrissur radial roads (end at the Round)
  { name: 'Shoranur Road', type: 'city', ll: [[10.5273, 76.2146], [10.5350, 76.2150], [10.5450, 76.2160], [10.5560, 76.2180]] },
  { name: 'Guruvayur Road', type: 'city', ll: [[10.5265, 76.2125], [10.5320, 76.2060], [10.5400, 76.2000], [10.5500, 76.1930]] },
  { name: 'Kodungallur Road', type: 'city', ll: [[10.5225, 76.2117], [10.5180, 76.2030], [10.5120, 76.1930]] },
  { name: 'Ollur Road', type: 'city', ll: [[10.5213, 76.2146], [10.5150, 76.2160], [10.5050, 76.2200], [10.4900, 76.2290], [10.4703, 76.2400], [10.4680, 76.2600]] },
];
const WIDTH = { nh: 21, city: 11, round: 16 };
const ROAD_Y = { city: 0.40, nh: 0.45, round: 0.50 };

function smooth(wpts, step = 8) {
  const curve = new THREE.CatmullRomCurve3(wpts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const n = Math.max(2, Math.ceil(curve.getLength() / step));
  return curve.getSpacedPoints(n).map(v => [v.x, v.z]);
}
for (const r of ROADS) { r.w = r.ll.map(W); r.pts = smooth(r.w); r.width = WIDTH[r.type]; }
// Swaraj Round as closed loop (one-way, clockwise in reality)
const roundPts = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; roundPts.push([TH[0] + Math.cos(a) * ROUND_R, TH[1] + Math.sin(a) * ROUND_R]); }
ROADS.push({ name: 'Swaraj Round', type: 'round', pts: roundPts, width: WIDTH.round, loop: true });
// snap Thrissur radial road ends onto the ring
for (const r of ROADS) if (r.type === 'city' && Math.hypot(r.pts[0][0] - TH[0], r.pts[0][1] - TH[1]) < ROUND_R * 1.6) {
  const p = r.pts[0], a = Math.atan2(p[1] - TH[1], p[0] - TH[0]); r.pts[0] = [TH[0] + Math.cos(a) * ROUND_R, TH[1] + Math.sin(a) * ROUND_R];
}
{ const r = ROADS.find(r => r.name.startsWith('Mannuthy')), p = r.pts.at(-1), a = Math.atan2(p[1] - TH[1], p[0] - TH[0]); r.pts[r.pts.length - 1] = [TH[0] + Math.cos(a) * ROUND_R, TH[1] + Math.sin(a) * ROUND_R]; }

// ---------------- water ----------------
const waterLL = [[9.80, 76.00], [9.80, 76.31], [9.90, 76.305], [9.925, 76.300], [9.940, 76.290], [9.950, 76.284], [9.965, 76.2795], [9.985, 76.2765], [10.000, 76.279], [10.030, 76.282], [10.060, 76.290], [10.085, 76.29], [10.20, 76.30], [10.20, 76.00]];
const islandsLL = [
  { name: 'Willingdon Island', ll: [[9.9420, 76.2620], [9.9440, 76.2710], [9.9480, 76.2800], [9.9600, 76.2760], [9.9640, 76.2660], [9.9560, 76.2630], [9.9480, 76.2620]] },
  { name: 'Fort Kochi - Mattancherry - Thoppumpady', ll: [[9.8800, 76.2550], [9.9200, 76.2600], [9.9360, 76.2615], [9.9420, 76.2585], [9.9560, 76.2560], [9.9650, 76.2500], [9.9700, 76.2430], [9.9680, 76.2360], [9.9500, 76.2340], [9.9000, 76.2460]] },
  { name: 'Vypeen', ll: [[9.9720, 76.2400], [9.9760, 76.2480], [10.0400, 76.2300], [10.1100, 76.2120], [10.1100, 76.1980], [10.0400, 76.2170]] },
  { name: 'Vallarpadam - Bolgatty', ll: [[9.9850, 76.2580], [9.9900, 76.2700], [10.0150, 76.2680], [10.0200, 76.2500], [10.0000, 76.2480]] },
];
const RIVERS = [
  { name: 'Periyar', ll: [[10.150, 76.420], [10.125, 76.380], [10.112, 76.356], [10.110, 76.330], [10.100, 76.300], [10.085, 76.285]], width: 70 },
  { name: 'Chalakudy River', ll: [[10.330, 76.420], [10.300, 76.360], [10.293, 76.336], [10.285, 76.310], [10.265, 76.270]], width: 40 },
];
const water = waterLL.map(W), islands = islandsLL.map(i => ({ ...i, w: i.ll.map(W) }));
for (const r of RIVERS) r.pts = smooth(r.ll.map(W), 20);
const inPoly = ([x, z], poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const segDist = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz); };
const nearRiver = (p, pad = 0) => RIVERS.some(r => r.pts.some((q, i) => i && segDist(p, r.pts[i - 1], q) < r.width / 2 + pad));
const isWater = (p, pad = 0) => (inPoly(p, water) && !islands.some(i => inPoly(p, i.w))) || nearRiver(p, pad);

// ---------------- spatial hash for roads/occupancy ----------------
const CELL = 50, grid = new Map(), key = (x, z) => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
for (const r of ROADS) for (let i = 1; i < r.pts.length; i++) {
  const a = r.pts[i - 1], b = r.pts[i]; const k = key((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  (grid.get(k) || grid.set(k, []).get(k)).push({ road: { a, b, hw: r.width / 2 } });
}
function near(x, z) { const out = []; const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const g = grid.get(`${cx + i},${cz + j}`); if (g) out.push(...g); } return out; }
function free(x, z, rad) {
  for (const o of near(x, z)) {
    if (o.road && segDist([x, z], o.road.a, o.road.b) < o.road.hw + rad + 1.5) return false;
    if (o.circ && Math.hypot(x - o.circ[0], z - o.circ[1]) < rad + o.circ[2]) return false;
  }
  return true;
}
const occupy = (x, z, rad) => { const k = key(x, z); (grid.get(k) || grid.set(k, []).get(k)).push({ circ: [x, z, rad] }); };

// ---------------- road meshes (chunked 800 m tiles) ----------------
const TILE = 800, chunks = new Map();
const chunk = (layer, x, z) => { const k = `${layer}_${Math.floor(x / TILE)}_${Math.floor(z / TILE)}`; if (!chunks.has(k)) chunks.set(k, new Model(k)); return chunks.get(k); };
function frames(pts, loop) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    return { p, n: [-tz, tx] };           // n = left-hand normal
  });
}
function strip(layer, color, F, a, b, y, { dash = null, walls = null } = {}) {
  let dist = 0;
  for (let i = 1; i < F.length; i++) {
    const f0 = F[i - 1], f1 = F[i], seg = Math.hypot(f1.p[0] - f0.p[0], f1.p[1] - f0.p[1]); dist += seg;
    if (dash && (dist % dash[1]) > dash[0]) continue;
    const P = (f, o) => [f.p[0] + f.n[0] * o, y, f.p[1] + f.n[1] * o];
    const m = chunk(layer, f0.p[0], f0.p[1]);
    m.quad(color, P(f0, a), P(f1, a), P(f1, b), P(f0, b), true);
    if (walls) for (const o of walls) { const h = 1.0; const p0 = P(f0, o), p1 = P(f1, o); m.quad(C.concrete, p0, p1, [p1[0], y + h, p1[2]], [p0[0], y + h, p0[2]], true); }
  }
}
for (const r of ROADS) {
  const F = frames(r.pts), y = ROAD_Y[r.type], hw = r.width / 2;
  if (r.type === 'nh') {
    strip('road', C.asphalt, F, -hw, -0.8, y); strip('road', C.asphalt, F, 0.8, hw, y);
    strip('road', C.kerb, F, -0.8, 0.8, y + 0.3);                                     // raised median
    strip('road', C.kerb, F, -0.8, -0.8, y, { walls: [-0.8, 0.8] });
    for (const s of [-1, 1]) { strip('mark', C.line, F, s * (hw - 1.6), s * (hw - 1.4), y + 0.03); strip('mark', C.yellowLine, F, s * 1.1, s * 1.25, y + 0.03); strip('mark', C.line, F, s * 5.6 - 0.07, s * 5.6 + 0.07, y + 0.03, { dash: [3, 9] }); }
  } else {
    strip('road', r.type === 'round' ? C.asphaltLight : C.asphalt, F, -hw, hw, y);
    strip('road', C.kerb, F, -hw - 1.5, -hw, y - 0.02); strip('road', C.kerb, F, hw, hw + 1.5, y - 0.02);   // footpaths
    for (const s of [-1, 1]) strip('mark', C.line, F, s * (hw - 0.5), s * (hw - 0.35), y + 0.03);
    if (r.type === 'city') strip('mark', C.line, F, -0.07, 0.07, y + 0.03, { dash: [3, 6] });
    else strip('mark', C.line, F, -0.07, 0.07, y + 0.03, { dash: [3, 6] }), strip('mark', C.line, F, 3.9, 4.05, y + 0.03, { dash: [3, 6] }), strip('mark', C.line, F, -4.05, -3.9, y + 0.03, { dash: [3, 6] });
  }
  // bridges: parapet walls where the road is over water
  const over = F.map(f => isWater(f.p));
  const Fb = []; F.forEach((f, i) => { if (over[i] || over[i - 1] || over[i + 1]) Fb.push(f); else if (Fb.length) { strip('road', C.concrete, Fb.splice(0), 0, 0, y, { walls: [-hw - 0.2, hw + 0.2] }); } });
  if (Fb.length > 1) strip('road', C.concrete, Fb, 0, 0, y, { walls: [-hw - 0.2, hw + 0.2] });
}

// ---------------- ground, water ----------------
const allPts = ROADS.flatMap(r => r.pts); const bb = allPts.reduce((b, [x, z]) => [Math.min(b[0], x), Math.min(b[1], z), Math.max(b[2], x), Math.max(b[3], z)], [1e9, 1e9, -1e9, -1e9]);
const PAD = 1200; const G = [bb[0] - PAD, bb[1] - PAD, bb[2] + PAD, bb[3] + PAD];
const ground = new Model('ground');
const tileG = 1000; for (let x = G[0]; x < G[2]; x += tileG) for (let z = G[1]; z < G[3]; z += tileG) ground.quad(C.grass, [x, 0, z + tileG], [x + tileG, 0, z + tileG], [x + tileG, 0, z], [x, 0, z]);
const polyModel = (m, color, pts, y, holes = []) => { const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); sh.holes = holes.map(h => new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z)))); const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); m.add(g, color, { y, ds: true }); };
const waterM = new Model('water');
polyModel(waterM, C.water, water, 0.15, islands.map(i => i.w));
for (const r of RIVERS) { const F = frames(r.pts); for (let i = 1; i < F.length; i++) { const P = (f, o) => [f.p[0] + f.n[0] * o, 0.15, f.p[1] + f.n[1] * o]; waterM.quad(C.water, P(F[i - 1], -r.width / 2), P(F[i], -r.width / 2), P(F[i], r.width / 2), P(F[i - 1], r.width / 2), true); } }
// urban ground patches
const urban = new Model('urban_ground');
urban.add(new THREE.CircleGeometry(ROUND_R + 260, 40), '#7f8f5c', { x: TH[0], y: 0.08, z: TH[1], rx: -Math.PI / 2 });
urban.add(new THREE.CircleGeometry(ROUND_R - WIDTH.round / 2 - 1.5, 48), C.grassDark, { x: TH[0], y: 0.30, z: TH[1], rx: -Math.PI / 2 }); // Thekkinkadu Maidan

// ---------------- prototypes ----------------
const P = {
  trad: A.keralaHouseTraditional(), nalu: A.nalukettu(), mod: [0, 1, 2, 3, 4].map(A.keralaHouseModern), apt: [0, 1, 2].map(A.apartmentTower),
  tea: [0, 1, 2, 3].map(A.teaShop), row: [0, 1, 2, 3, 4].map(A.shopRow), lodge: [0, 1].map(A.lodge), mall: A.mall(), fuel: A.petrolPump(),
  ware: A.warehouse(), cont: [0, 1, 2, 3, 4].map(A.shippingContainer), temple: A.keralaTempleSmall(), church: A.church(), mosque: A.mosque(),
  net: A.chineseFishingNet(), toll: A.tollPlaza(8), shelter: A.busShelter(), hub: A.busTerminal(), metro: A.metroPier(), pole: A.electricPole(),
  light: A.streetLight(), palm: [0, 1].map(A.coconutPalm), banana: A.bananaPlant(), tree: [0, 1, 2].map(A.shadeTree), vadak: A.vadakkunnathanTemple(),
};
function footprint(m) { const b = new THREE.Box3(); for (const gs of m.parts.values()) for (const g of gs) { g.computeBoundingBox(); b.union(g.boundingBox); } return { r: Math.hypot(b.max.x - b.min.x, b.max.z - b.min.z) / 2 * 0.85, depth: b.max.z, back: -b.min.z, w: b.max.x - b.min.x }; }
const FP = new Map(); const fp = m => FP.get(m) || FP.set(m, footprint(m)).get(m);
const inst = new Map(); // model -> items
const put = (m, x, z, ry = 0, s = 1) => { (inst.get(m) || inst.set(m, []).get(m)).push({ x, z, ry, s }); };
const R = rng(544);
const pick = arr => arr[Math.floor(R() * arr.length)];
function weighted(table) { const t = table.reduce((s, e) => s + e[0], 0); let v = R() * t; for (const [w, f] of table) if ((v -= w) <= 0) return f(); return table[0][1](); }

// ---------------- landmarks ----------------
const landmarks = [];
function landmark(name, m, x, z, ry = 0, rad = null, s = 1) { landmarks.push({ name, model: m, x, z, ry, s }); occupy(x, z, rad ?? fp(m).r * s); }
const TEMPLE_S = 0.55; landmark('Vadakkunnathan Temple', P.vadak, TH[0], TH[1], 0, 90 * TEMPLE_S * 1.42, TEMPLE_S);
const ringAt = (deg, off) => { const a = deg * Math.PI / 180; return [TH[0] + Math.cos(a) * (ROUND_R + off), TH[1] + Math.sin(a) * (ROUND_R + off)]; };
const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
{ const [x, z] = ringAt(-8, 28); landmark('Paramekkavu Bhagavathi Temple', P.temple, x, z, faceTo(x, z, TH[0], TH[1])); }
{ const r = ROADS.find(r => r.name === 'Shoranur Road'), p = r.pts[Math.floor(r.pts.length * 0.45)]; landmark('Thiruvambady Temple', P.temple, p[0] + 32, p[1], -Math.PI / 2); }
{ const [x, z] = ringAt(100, 45); landmark('Our Lady of Dolours Basilica (Puthenpally)', P.church, x, z, faceTo(x, z, TH[0], TH[1])); }
{ const [x, z] = ringAt(60, 110); landmark('Thrissur Goods Depot (Shakthan area)', P.ware, x, z, faceTo(x, z, TH[0], TH[1])); }
// Kochi
const KW = (ll, dx = 0, dz = 0) => { const [x, z] = W(ll); return [x + dx, z + dz]; };
{ const [x, z] = KW([10.0275, 76.3083], -75, 0); landmark('Mall (Edappally)', P.mall, x, z, Math.PI / 2); }
{ const [x, z] = KW([9.9674, 76.3183], 70, 30); landmark('Vyttila Mobility Hub', P.hub, x, z, -Math.PI / 2); }
{ const [x, z] = KW([9.9545, 76.2700]); landmark('Cochin Port Container Depot (Willingdon Island)', P.ware, x, z, Math.PI);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) landmarks.push({ name: 'container', model: P.cont[(i + j + k) % 5], x: x - 30 + i * 3.2, z: z + 40 + j * 13, y: k * 2.6, ry: 0 });
  occupy(x - 25, z + 52, 22); }
for (let i = 0; i < 5; i++) { const [x, z] = KW([9.9682, 76.2405 + i * 0.0009]); landmark('Chinese Fishing Net ' + (i + 1), P.net, x, z + 6, Math.PI, 6); }
{ const [x, z] = KW([9.9650, 76.2425]); landmark('St. Francis Church, Fort Kochi', P.church, x, z - 45, Math.PI); }
{ const [x, z] = KW([9.9560, 76.2530]); landmark('Mattancherry Mosque', P.mosque, x, z, 0); }
{ const [x, z] = KW([9.9973, 76.2990], 0, -90); landmark('Kaloor Stadium', (() => { const m = new Model('stadium'); m.add(new THREE.CylinderGeometry(95, 85, 18, 32, 1, true), C.concrete, { y: 9, ds: true }); m.add(new THREE.CircleGeometry(80, 32), C.grass, { y: 0.2, rx: -Math.PI / 2 }); m.add(new THREE.CylinderGeometry(98, 98, 1.5, 32, 1, true), C.whitewash, { y: 18.5, ds: true }); return m; })(), x, z, 0, 98); }
// toll plaza at Paliyekkara, aligned with NH
const NH = ROADS[0], NHF = frames(NH.pts);
function nhAt(ll) { const t = W(ll); let bi = 0, bd = 1e9; NH.pts.forEach((p, i) => { const d = Math.hypot(p[0] - t[0], p[1] - t[1]); if (d < bd) { bd = d; bi = i; } }); return bi; }
{ const f = NHF[nhAt([10.391, 76.295])]; landmarks.push({ name: 'Paliyekkara Toll Plaza', model: P.toll, x: f.p[0], z: f.p[1], ry: Math.atan2(f.n[1], -f.n[0]), y: 0.36 }); }

// Kochi Metro viaduct: Aluva -> Edappally -> Kaloor -> MG Road -> SA Road -> Vyttila
const metroPath = [...NH.pts.slice(0, nhAt([10.1076, 76.3516]) + 1).reverse(), ...ROADS[4].pts.slice().reverse(), ...ROADS[3].pts.slice().reverse().slice(0, Math.floor(ROADS[3].pts.length * 0.55)), ...ROADS[5].pts];
{ let acc = 0; for (let i = 1; i < metroPath.length; i++) { const a = metroPath[i - 1], b = metroPath[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += d; if (d > 30) continue; if (acc >= 30) { acc = 0; put(P.metro, b[0], b[1], Math.atan2(b[0] - a[0], b[1] - a[1])); } } }

// ---------------- roadside fill ----------------
const TOWNS = [['Kalamassery', [10.0530, 76.3200]], ['Aluva', [10.1076, 76.3516]], ['Athani', [10.155, 76.377]], ['Angamaly', [10.1960, 76.3860]], ['Karukutty', [10.226, 76.377]], ['Koratty', [10.267, 76.348]], ['Chalakudy', [10.307, 76.333]], ['Kodakara', [10.372, 76.305]], ['Amballur', [10.405, 76.283]], ['Puthukkad', [10.423, 76.268]], ['Thalore', [10.468, 76.261]], ['Mannuthy', [10.532, 76.273]], ['Ollur', [10.4703, 76.2400]]].map(([n, ll]) => ({ name: n, w: W(ll) }));
function zone(x, z) {
  for (const c of CITIES) if (Math.hypot(x - c.w[0], z - c.w[1]) < (c.name === 'Kochi' ? 2600 : 1200)) return 'city';
  if (TOWNS.some(t => Math.hypot(x - t.w[0], z - t.w[1]) < 260)) return 'town';
  return 'rural';
}
const choose = {
  city: () => weighted([[30, () => pick(P.row)], [9, () => pick(P.lodge)], [7, () => pick(P.apt)], [10, () => pick(P.tea)], [12, () => pick(P.mod)], [1, () => P.church], [1, () => P.mosque], [1, () => P.temple], [1, () => P.fuel]]),
  town: () => weighted([[28, () => pick(P.row)], [22, () => pick(P.tea)], [5, () => pick(P.lodge)], [14, () => pick(P.mod)], [5, () => P.trad], [2, () => P.fuel], [1, () => P.temple], [1, () => P.church], [1, () => P.mosque], [3, () => P.shelter]]),
  rural: () => weighted([[14, () => P.trad], [20, () => pick(P.mod)], [1.5, () => P.nalu], [9, () => pick(P.tea)], [4, () => pick(P.row)], [1.2, () => P.fuel], [2, () => P.shelter], [0.6, () => P.temple], [0.4, () => P.church], [0.4, () => P.mosque]]),
};
const GAP = { city: [0.5, 2], town: [1, 8], rural: [12, 70] };   // spacing between frontage buildings (m)
let shopCount = 0;
for (const r of ROADS) {
  const F = frames(r.pts), hw = r.width / 2 + (r.type === 'nh' ? 0 : 1.5);
  for (const side of (r.type === 'round' ? [0] : [-1, 1])) {
    let D = 0, next = 10 + R() * 10;
    for (let i = 1; i < F.length; i++) {
      D += Math.hypot(F[i].p[0] - F[i - 1].p[0], F[i].p[1] - F[i - 1].p[1]); if (D < next) continue;
      const f = F[i]; let s = side;
      if (r.type === 'round') { const out = [f.p[0] - TH[0], f.p[1] - TH[1]]; s = Math.sign(out[0] * f.n[0] + out[1] * f.n[1]); }
      const z = r.type === 'round' ? 'city' : zone(f.p[0], f.p[1]);
      const m = choose[z](), F2 = fp(m), d = hw + 2.5 + F2.depth;
      const x = f.p[0] + f.n[0] * s * d, zz = f.p[1] + f.n[1] * s * d;
      const half = Math.max(F2.depth, F2.back), rad = Math.min(F2.w / 2, half) * 0.95;
      const ok = !isWater([x, zz], half) && free(x, zz, rad) && near(x, zz).every(o => !o.road || segDist([x, zz], o.road.a, o.road.b) > o.road.hw + half + 0.5) && Math.hypot(x - TH[0], zz - TH[1]) > ROUND_R + 5;
      if (!ok) { next = D + 5; continue; }
      put(m, x, zz, faceTo(x, zz, f.p[0], f.p[1])); occupy(x, zz, rad); if (m.extras.kind === 'shop') shopCount++;
      const gap = GAP[z][0] + R() * (GAP[z][1] - GAP[z][0]);
      next = D + F2.w + gap;
      if (z !== 'city') for (let g = 4; g < gap - 2; g += 5 + R() * 4) { // palms / banana in the gaps
        const t = Math.min(F.length - 1, i + Math.round((F2.w / 2 + g) / 8)), fg = F[t], dd = hw + 4 + R() * 14;
        const px = fg.p[0] + fg.n[0] * s * dd, pz = fg.p[1] + fg.n[1] * s * dd;
        if (!isWater([px, pz], 3) && free(px, pz, 1.8)) { put(R() < 0.8 ? pick(P.palm) : P.banana, px, pz, R() * 6.28, 0.85 + R() * 0.3); occupy(px, pz, 1.8); }
      }
    }
  }
}
// coconut groves / back-lots behind frontage (Kerala's continuous green)
for (const r of ROADS.filter(r => r.type === 'nh')) {
  const F = frames(r.pts);
  for (let i = 0; i < F.length; i += 2) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
    const f = F[i], d = r.width / 2 + 30 + R() * 90, x = f.p[0] + f.n[0] * s * d + (R() - 0.5) * 10, z = f.p[1] + f.n[1] * s * d + (R() - 0.5) * 10;
    if (zone(x, z) === 'city' || isWater([x, z], 3) || !free(x, z, 1.5)) continue;
    const v = R(); if (v < 0.7) put(pick(P.palm), x, z, R() * 6.28, 0.8 + R() * 0.4); else if (v < 0.85) put(pick(P.tree), x, z, R() * 6.28, 0.8 + R() * 0.5); else if (v < 0.9) { if (free(x, z, 9)) { put(R() < 0.5 ? P.trad : pick(P.mod), x, z, R() * 6.28); occupy(x, z, 9); continue; } } else put(P.banana, x, z, R() * 6.28);
    occupy(x, z, 1.5);
  }
}
// Thekkinkadu Maidan trees (between temple wall and the Round)
for (let i = 0; i < 45; i++) { const a = R() * 6.28, d = 90 * TEMPLE_S * 1.45 + R() * (ROUND_R - 12 - 90 * TEMPLE_S * 1.45); put(pick(P.tree), TH[0] + Math.cos(a) * d, TH[1] + Math.sin(a) * d, R() * 6.28, 0.9 + R() * 0.4); }
// street lights / poles
for (const r of ROADS) { const F = frames(r.pts); let acc = 0; for (let i = 1; i < F.length; i++) { acc += 8; if (acc < (r.type === 'nh' ? 48 : 36)) continue; acc = 0; const f = F[i];
  if (r.type === 'nh') { if (zone(...f.p) !== 'rural') put(P.light, f.p[0], f.p[1], Math.atan2(f.n[0], f.n[1]) + (i % 2 ? 0 : Math.PI)); else { const d = r.width / 2 + 2.5; put(P.pole, f.p[0] + f.n[0] * d, f.p[1] + f.n[1] * d, Math.atan2(f.n[0], f.n[1])); } }
  else { const d = r.width / 2 + 1.0; put(P.light, f.p[0] + f.n[0] * d, f.p[1] + f.n[1] * d, Math.atan2(-f.n[0], -f.n[1])); } } }

// ---------------- write GLB ----------------
const doc = makeDoc(); const scene = doc.createScene('kochi_thrissur');
const root = doc.createNode('kochi_thrissur_world').setExtras({ scale: { city: CITY_SCALE, highway: HIGHWAY_SCALE }, units: 'metres', up: '+Y', north: '-Z' });
scene.addChild(root);
for (const m of [ground, urban, waterM]) root.addChild(nodeOf(doc, m));
const roadsN = doc.createNode('roads'), marksN = doc.createNode('road_markings'); root.addChild(roadsN); root.addChild(marksN);
for (const [k, m] of chunks) (k.startsWith('mark') ? marksN : roadsN).addChild(nodeOf(doc, m));
const lmN = doc.createNode('landmarks'); root.addChild(lmN);
for (const l of landmarks) { const n = nodeOf(doc, l.model, l.name.replace(/[^\w]+/g, '_')); n.setTranslation([l.x, l.y || 0, l.z]).setScale([l.s || 1, l.s || 1, l.s || 1]).setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), l.ry || 0).toArray()); if (l.name !== 'container') n.setExtras({ name: l.name }); lmN.addChild(n); }
const instN = doc.createNode('instanced'); root.addChild(instN);
let total = 0; for (const [m, items] of inst) { instN.addChild(instancedNode(doc, m, items, 'inst_' + m.name)); total += items.length; }
fs.mkdirSync('out/world', { recursive: true });
const docB = makeDoc(); // (second doc for meshopt variant is rebuilt by re-running with flag)
await writeGLB(doc, 'out/world/kochi_thrissur_world.glb', { compress: process.argv.includes('--meshopt') });

// ---------------- routes / POIs for gameplay ----------------
const r2 = v => Math.round(v * 10) / 10;
const routes = {
  info: 'World coords: x east, z south (north = -Z), y up, metres. Cities 1:2, open highway 1:10. Polylines are road centrelines; NH lanes are offset +/-2.9 m and +/-6.9 m from centre (drive on LEFT in India: use the left carriageway).',
  scale: { city: CITY_SCALE, highway: HIGHWAY_SCALE }, origin_latlon: ORIGIN,
  cities: CITIES.map(c => ({ name: c.name, centre: c.w.map(r2), realRadius_m: c.R })),
  roads: ROADS.map(r => ({ name: r.name, type: r.type, width: r.width, loop: !!r.loop, points: r.pts.filter((_, i) => i % 2 === 0 || i === r.pts.length - 1).map(p => p.map(r2)) })),
  towns: TOWNS.map(t => ({ name: t.name, pos: t.w.map(r2) })),
  pois: landmarks.filter(l => l.name !== 'container').map(l => ({ name: l.name, pos: [r2(l.x), r2(l.z)], type: l.model.extras.kind || 'landmark' })),
  fuel: (inst.get(P.fuel) || []).map(i => [r2(i.x), r2(i.z)]),
  jobs: [{ from: 'Cochin Port Container Depot (Willingdon Island)', to: 'Thrissur Goods Depot (Shakthan area)', cargo: 'container' }],
};
const roadLen = ROADS.reduce((s, r) => s + r.pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - r.pts[i - 1][0], p[1] - r.pts[i - 1][1]) : 0, 0), 0);
fs.writeFileSync('out/world/routes.json', JSON.stringify(routes));
console.log({ instances: total, shopCount, prototypes: inst.size, landmarks: landmarks.length, chunks: chunks.size, roadKm: (roadLen / 1000).toFixed(1), nhKm: (NH.pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - NH.pts[i - 1][0], p[1] - NH.pts[i - 1][1]) : 0, 0) / 1000).toFixed(2), bbox: G.map(Math.round), sizeKB: (fs.statSync('out/world/kochi_thrissur_world.glb').size / 1024).toFixed(0) });
