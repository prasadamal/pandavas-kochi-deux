// Real OpenStreetMap -> GLB for Kochi, Thrissur and the NH544 corridor.
// Run on your own machine (needs internet):   node osm_to_glb.mjs
// Options:  --buildings        include OSM building footprints in the two city boxes (bigger file)
//           --input file.json  use a saved Overpass response instead of downloading
//           --scale 1          disable the city/highway compression (true 1:1 map)
// Output: out/osm/kochi_thrissur_osm.glb (+ overpass_cache.json, osm_routes.json)
// Map data © OpenStreetMap contributors, ODbL – credit OSM in your game.
import fs from 'fs';
import * as THREE from 'three';
import { Model, C, makeDoc, nodeOf, writeGLB } from './lib.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const WITH_BUILDINGS = process.argv.includes('--buildings');
const ONE_TO_ONE = arg('--scale') === '1';
const KOCHI = [9.90, 76.22, 10.06, 76.36], THRISSUR = [10.49, 76.18, 10.56, 76.25];   // south, west, north, east
const CORRIDOR = [9.90, 76.20, 10.56, 76.42];

const q = `[out:json][timeout:180];
(
  way["highway"~"^(motorway|trunk|primary|secondary|motorway_link|trunk_link)$"](${KOCHI});
  way["highway"~"^(motorway|trunk|primary|secondary|motorway_link|trunk_link)$"](${THRISSUR});
  way["highway"~"^(motorway|trunk)$"](${CORRIDOR});
  way["ref"~"NH ?544|NH ?66"](${CORRIDOR});
  way["natural"="water"](${KOCHI});
  way["waterway"="riverbank"](${CORRIDOR});
  ${WITH_BUILDINGS ? `way["building"](${KOCHI}); way["building"](${THRISSUR});` : ''}
);
out body; >; out skel qt;`;

let data;
fs.mkdirSync('out/osm', { recursive: true });
if (arg('--input')) data = JSON.parse(fs.readFileSync(arg('--input'), 'utf8'));
else {
  console.log('Downloading from Overpass API (can take 1–3 minutes)…');
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) throw new Error('Overpass error ' + res.status + ' ' + (await res.text()).slice(0, 300));
  data = await res.json(); fs.writeFileSync('out/osm/overpass_cache.json', JSON.stringify(data));
}

// ---- projection (same warp as the hand-made world, so both line up) ----
const ORIGIN = [9.975, 76.290], HS = ONE_TO_ONE ? 1 : 0.12, CS = ONE_TO_ONE ? 1 : 0.3;
const CITIES = [{ ll: [9.975, 76.290], R: 7000 }, { ll: [10.5243, 76.2144], R: 4000 }];
const LAT_M = 110574, LON_M = 111320 * Math.cos(ORIGIN[0] * Math.PI / 180);
const toM = (lat, lon) => [(lon - ORIGIN[1]) * LON_M, -(lat - ORIGIN[0]) * LAT_M];
for (const c of CITIES) c.m = toM(...c.ll);
const warp = ([x, z]) => { let wx = x * HS, wz = z * HS; for (const c of CITIES) { const dx = x - c.m[0], dz = z - c.m[1], r = Math.hypot(dx, dz) || 1e-9, k = (CS - HS) * Math.min(r, c.R) / r; wx += dx * k; wz += dz * k; } return [wx, wz]; };
const localScale = ([x, z]) => { for (const c of CITIES) if (Math.hypot(x - c.m[0], z - c.m[1]) < c.R) return CS; return HS; };

const nodes = new Map(); for (const e of data.elements) if (e.type === 'node') nodes.set(e.id, e);
const ways = data.elements.filter(e => e.type === 'way' && e.tags);
const WIDTH = { motorway: 22, trunk: 18, primary: 12, secondary: 9, motorway_link: 7, trunk_link: 7 };
const Y = { motorway: 0.46, trunk: 0.45, primary: 0.42, secondary: 0.40, motorway_link: 0.44, trunk_link: 0.44 };

const TILE = 800, chunks = new Map();
const chunk = (layer, x, z) => { const k = `${layer}_${Math.floor(x / TILE)}_${Math.floor(z / TILE)}`; if (!chunks.has(k)) chunks.set(k, new Model(k)); return chunks.get(k); };
const routes = []; let stats = { roads: 0, buildings: 0, water: 0 };

for (const w of ways) {
  const pts = w.nodes.map(id => nodes.get(id)).filter(Boolean).map(n => toM(n.lat, n.lon));
  if (pts.length < 2) continue;
  const hw = w.tags.highway;
  if (hw && WIDTH[hw]) {
    stats.roads++;
    const wp = pts.map(warp), width = (WIDTH[hw] * (w.tags.lanes ? Math.min(1.4, Math.max(0.6, +w.tags.lanes / 2)) : 1)), y = Y[hw];
    routes.push({ id: w.id, name: w.tags.name || w.tags.ref || hw, type: hw, oneway: w.tags.oneway === 'yes', points: wp.map(p => p.map(v => Math.round(v * 10) / 10)) });
    for (let i = 1; i < wp.length; i++) {
      const a = wp[i - 1], b = wp[i]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz); if (l < 0.01) continue; tx /= l; tz /= l;
      const nx = -tz * width / 2, nz = tx * width / 2, m = chunk('road', a[0], a[1]);
      m.quad(C.asphalt, [a[0] + nx, y, a[1] + nz], [b[0] + nx, y, b[1] + nz], [b[0] - nx, y, b[1] - nz], [a[0] - nx, y, a[1] - nz], true);
      m.add(new THREE.CircleGeometry(width / 2, 8), C.asphalt, { x: b[0], y: y - 0.005, z: b[1], rx: -Math.PI / 2 });  // round joint
      if (l > 6) { const k = 0.07 / (width / 2); const mk = chunk('mark', a[0], a[1]); // centre line
        mk.quad(C.line, [a[0] + nx * k, y + 0.03, a[1] + nz * k], [b[0] + nx * k, y + 0.03, b[1] + nz * k], [b[0] - nx * k, y + 0.03, b[1] - nz * k], [a[0] - nx * k, y + 0.03, a[1] - nz * k], true); }
    }
  } else if (w.tags.natural === 'water' || w.tags.waterway === 'riverbank') {
    stats.water++; const wp = pts.map(warp);
    const g = new THREE.ShapeGeometry(new THREE.Shape(wp.map(([x, z]) => new THREE.Vector2(x, -z)))); g.rotateX(-Math.PI / 2);
    chunk('water', wp[0][0], wp[0][1]).add(g, C.water, { y: 0.15, ds: true });
  } else if (w.tags.building) {
    stats.buildings++; const s = localScale(pts[0]); const wp = pts.map(warp);
    const c = wp.reduce((a, p) => [a[0] + p[0] / wp.length, a[1] + p[1] / wp.length], [0, 0]);
    // footprint shrunk by the map scale would be tiny: keep real size, centred on the warped centroid
    const real = pts.map(p => [p[0] - pts.reduce((a, q) => a + q[0], 0) / pts.length, p[1] - pts.reduce((a, q) => a + q[1], 0) / pts.length]);
    const shrink = Math.max(s, 0.6), fp = real.map(([x, z]) => [c[0] + x * shrink, c[1] + z * shrink]);
    const levels = +(w.tags['building:levels'] || (w.tags.height ? +w.tags.height / 3.2 : 0)) || 1 + ((w.id % 3) === 0 ? 1 : 0);
    const h = levels * 3.2;
    const shape = new THREE.Shape(fp.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
    const area = Math.abs(THREE.ShapeUtils.area(shape.getPoints()));
    const col = ['#efe9dc', '#f3e3a6', '#bfe0d0', '#f1c6a8', '#d8d3ee'][w.id % 5];
    const m = chunk('bld', c[0], c[1]); m.add(g, col);
    if (area < 220 && levels <= 2) { // Kerala tiled hip roof on small houses
      const b = new THREE.Box2().setFromPoints(fp.map(([x, z]) => new THREE.Vector2(x, z)));
      const sz = b.getSize(new THREE.Vector2()), cc = b.getCenter(new THREE.Vector2());
      m.hipRoof(C.tile, sz.x, sz.y, Math.min(sz.x, sz.y) * 0.4, h, { x: cc.x, z: cc.y, over: 0.5, gable: false });
    }
  }
}
// ground
const all = routes.flatMap(r => r.points); const bb = all.reduce((b, [x, z]) => [Math.min(b[0], x), Math.min(b[1], z), Math.max(b[2], x), Math.max(b[3], z)], [1e9, 1e9, -1e9, -1e9]);
const ground = new Model('ground'); const P = 800;
for (let x = bb[0] - P; x < bb[2] + P; x += 1000) for (let z = bb[1] - P; z < bb[3] + P; z += 1000) ground.quad(C.grass, [x, 0, z + 1000], [x + 1000, 0, z + 1000], [x + 1000, 0, z], [x, 0, z]);

const doc = makeDoc(); const scene = doc.createScene('kochi_thrissur_osm');
const root = doc.createNode('kochi_thrissur_osm').setExtras({ attribution: '© OpenStreetMap contributors (ODbL)', scale: { city: CS, highway: HS } });
scene.addChild(root); root.addChild(nodeOf(doc, ground));
for (const m of chunks.values()) root.addChild(nodeOf(doc, m));
await writeGLB(doc, 'out/osm/kochi_thrissur_osm.glb', { compress: process.argv.includes('--meshopt') });
fs.writeFileSync('out/osm/osm_routes.json', JSON.stringify({ attribution: '© OpenStreetMap contributors (ODbL)', roads: routes }));
console.log(stats, 'size', (fs.statSync('out/osm/kochi_thrissur_osm.glb').size / 1024).toFixed(0) + ' KB');
