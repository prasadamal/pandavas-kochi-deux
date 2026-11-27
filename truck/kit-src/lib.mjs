// Low-poly geometry toolkit + glTF writer (Y up, metres, -Z = north)
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshGPUInstancing, KHRMeshQuantization, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { quantize, dedup, prune, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';

export const C = {
  laterite: '#8e3b22', whitewash: '#efe9dc', cream: '#e8d9b5', tile: '#a5432a', tileDark: '#7c3220',
  wood: '#5b3a22', woodLight: '#8a5a34', teak: '#6e4524', copper: '#4f8a75', brass: '#c9a13a',
  concrete: '#c9c5bc', glass: '#3d5566', asphalt: '#3a3b3d', asphaltLight: '#4a4b4e', line: '#e9e7df',
  yellowLine: '#e0b52a', grass: '#5d8a3a', grassDark: '#3f6b2a', water: '#3b6f86', sand: '#d9c79a',
  trunk: '#7a5f43', palm: '#3f7d2c', palmDark: '#2f6322', banana: '#6aa33a', tyre: '#1b1b1b', rim: '#9a9a9a',
  metal: '#8c9196', darkMetal: '#3c4044', black: '#1d1d1f', red: '#b3261e', yellow: '#e8b923', green: '#2e7d4f',
  blue: '#2a5c9a', orange: '#d9772b', pink: '#d0577a', sky: '#7fb0d6', shutter: '#8f9499', kerb: '#bdbab3', net: '#2a2a2a',
};

const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();

export class Model {
  constructor(name) { this.name = name; this.parts = new Map(); this.children = []; this.extras = {}; }
  add(geo, color, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, ds = false } = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.deleteAttribute('uv');
    tmpQ.setFromEuler(tmpE.set(rx, ry, rz, 'YXZ'));
    g.applyMatrix4(tmpM.compose(new THREE.Vector3(x, y, z), tmpQ, new THREE.Vector3(sx, sy, sz)));
    if (!g.attributes.normal) g.computeVertexNormals();
    const key = color + (ds ? '|ds' : '');
    if (!this.parts.has(key)) this.parts.set(key, []);
    this.parts.get(key).push(g);
    return this;
  }
  child(name, model, pos = [0, 0, 0]) { this.children.push({ name, model, pos }); return model; }
  // shorthand shapes; y = bottom
  box(color, w, h, d, x = 0, y = 0, z = 0, ry = 0) { return this.add(new THREE.BoxGeometry(w, h, d), color, { x, y: y + h / 2, z, ry }); }
  cyl(color, rt, rb, h, x = 0, y = 0, z = 0, seg = 8, o = {}) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), color, { x, y: y + h / 2, z, ...o }); }
  cone(color, r, h, x = 0, y = 0, z = 0, seg = 8) { return this.add(new THREE.ConeGeometry(r, h, seg), color, { x, y: y + h / 2, z }); }
  sphere(color, r, x = 0, y = 0, z = 0, seg = 6, sy = 1) { return this.add(new THREE.SphereGeometry(r, seg, Math.max(3, seg / 2 | 0)), color, { x, y, z, sy }); }
  tris(color, verts, ds = false, o = {}) { // verts: flat array of triangles [x,y,z,...]
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.computeVertexNormals();
    return this.add(g, color, { ...o, ds });
  }
  quad(color, a, b, c, d, ds = false, o) { return this.tris(color, [...a, ...b, ...c, ...a, ...c, ...d], ds, o); }
  // Kerala hip roof with small gable vents at ridge ends
  hipRoof(color, w, d, h, y, { x = 0, z = 0, ry = 0, over = 0.6, gable = true, gableColor = C.wood } = {}) {
    const W = w / 2 + over, D = d / 2 + over, r = Math.max(0, (W - D)), sw = W < D;
    let v;
    if (!sw) {
      const p = [[-W, y, D], [W, y, D], [W, y, -D], [-W, y, -D]], ra = [-r, y + h, 0], rb = [r, y + h, 0];
      v = [...p[0], ...p[1], ...rb, ...p[0], ...rb, ...ra, ...p[2], ...p[3], ...ra, ...p[2], ...ra, ...rb,
        ...p[3], ...p[0], ...ra, ...p[1], ...p[2], ...rb];
    } else {
      const r2 = D - W, p = [[-W, y, D], [W, y, D], [W, y, -D], [-W, y, -D]], ra = [0, y + h, r2], rb = [0, y + h, -r2];
      v = [...p[0], ...p[1], ...ra, ...p[1], ...p[2], ...rb, ...p[1], ...rb, ...ra, ...p[2], ...p[3], ...rb,
        ...p[3], ...p[0], ...ra, ...p[3], ...ra, ...rb];
    }
    this.tris(color, v, true, { x, z, ry });
    if (gable && r > 0.5 && !sw) { // vertical triangle (mukhappu) under each ridge end
      const t = h * 0.35;
      for (const s of [-1, 1]) {
        const ex = s * (r + t * (W - r) / h * 0.98);
        this.tris(gableColor, [s * r, y + h, 0, ex, y + h - t, t * 0.9, ex, y + h - t, -t * 0.9], true, { x, z, ry });
      }
    }
    return this;
  }
  gableRoof(color, w, d, h, y, { x = 0, z = 0, ry = 0, over = 0.4, endColor = null } = {}) {
    const W = w / 2 + over, D = d / 2 + over;
    this.tris(color, [-W, y, D, W, y, D, W, y + h, 0, -W, y, D, W, y + h, 0, -W, y + h, 0,
      W, y, -D, -W, y, -D, -W, y + h, 0, W, y, -D, -W, y + h, 0, W, y + h, 0], true, { x, z, ry });
    if (endColor) for (const s of [-1, 1]) this.tris(endColor, [s * w / 2, y, d / 2, s * w / 2, y, -d / 2, s * w / 2, y + h, 0], true, { x, z, ry });
    return this;
  }
  // window: dark pane slightly proud of wall face (face: 'z+' etc.)
  win(x, y, z, w, h, ry = 0, color = C.glass) { return this.box(color, w, h, 0.08, x, y, z, ry); }
}

// ---- glTF writing ---------------------------------------------------------
export function makeDoc() {
  const doc = new Document(); doc.createBuffer();
  doc.getRoot().getAsset().generator = 'kerala-game-kit';
  doc._mats = new Map(); doc._meshCache = new Map();
  return doc;
}
function material(doc, key) {
  if (doc._mats.has(key)) return doc._mats.get(key);
  const [hex, flag] = key.split('|'); const c = new THREE.Color(hex);
  const lin = [c.r, c.g, c.b].map(v => v); // THREE.Color stores linear already
  const name = hex.replace('#', 'c_');
  const m = doc.createMaterial(name).setBaseColorFactor([...lin, 1]).setRoughnessFactor(flag === 'gl' ? 0.2 : 0.85).setMetallicFactor(0);
  if (flag === 'ds') m.setDoubleSided(true);
  doc._mats.set(key, m); return m;
}
export function meshOf(doc, model) {
  if (doc._meshCache.has(model)) return doc._meshCache.get(model);
  if (!model.parts.size) return null;
  const mesh = doc.createMesh(model.name);
  for (const [key, geos] of model.parts) {
    let g = mergeGeometries(geos, false); g = mergeVertices(g, 1e-4);
    const pos = g.attributes.position.array, nor = g.attributes.normal.array, idx = g.index.array;
    const n = pos.length / 3;
    const prim = doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(n < 65535 ? new Uint16Array(idx) : new Uint32Array(idx)))
      .setMaterial(material(doc, key));
    mesh.addPrimitive(prim);
  }
  doc._meshCache.set(model, mesh); return mesh;
}
export function nodeOf(doc, model, name = model.name) {
  const node = doc.createNode(name); const mesh = meshOf(doc, model); if (mesh) node.setMesh(mesh);
  if (Object.keys(model.extras).length) node.setExtras(model.extras);
  for (const ch of model.children) node.addChild(nodeOf(doc, ch.model, ch.name).setTranslation(ch.pos));
  return node;
}
// instanced node using EXT_mesh_gpu_instancing; items: [{x,y,z,ry,s}]
export function instancedNode(doc, model, items, name) {
  const ext = doc._inst || (doc._inst = doc.createExtension(EXTMeshGPUInstancing).setRequired(true));
  const T = new Float32Array(items.length * 3), R = new Float32Array(items.length * 4), S = new Float32Array(items.length * 3);
  items.forEach((it, i) => {
    T.set([it.x, it.y || 0, it.z], i * 3);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.ry || 0); R.set([q.x, q.y, q.z, q.w], i * 4);
    const s = it.s || 1; S.set([s, s, s], i * 3);
  });
  const batch = ext.createInstancedMesh()
    .setAttribute('TRANSLATION', doc.createAccessor().setType('VEC3').setArray(T))
    .setAttribute('ROTATION', doc.createAccessor().setType('VEC4').setArray(R))
    .setAttribute('SCALE', doc.createAccessor().setType('VEC3').setArray(S));
  const node = doc.createNode(name).setMesh(meshOf(doc, model)).setExtension('EXT_mesh_gpu_instancing', batch);
  node.setExtras({ prototype: model.name, count: items.length });
  return node;
}
export async function writeGLB(doc, path, { compress = false } = {}) {
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  await doc.transform(dedup(), prune(), quantize({ quantizeNormal: 8, quantizePosition: 14 }));
  if (compress) { await MeshoptEncoder.ready; await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' })); }
  const io = new NodeIO().registerExtensions([EXTMeshGPUInstancing, KHRMeshQuantization, EXTMeshoptCompression]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  await io.write(path, doc);
}

// seeded random
export function rng(seed = 1) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
