// Kerala-style building, prop and vehicle prototypes. Each fn returns a Model.
// Convention: origin at ground centre, building fronts face +Z (towards the road).
import * as THREE from 'three';
import { Model, C } from './lib.mjs';

const PAINTS = ['#f3e3a6', '#bfe0d0', '#f1c6a8', '#d8d3ee', '#f6f1e6', '#a9d0e6', '#e9b9c4', '#cfe3a3'];
const SIGNS = [C.red, C.blue, C.green, C.yellow, C.orange, '#6b3fa0', '#0f8a8a', C.pink];

// ---------- traditional & residential ----------
export function keralaHouseTraditional() {
  const m = new Model('kerala_house_traditional');
  m.box(C.laterite, 12, 0.7, 9, 0, 0, 0);                    // laterite plinth
  m.box(C.whitewash, 10, 3, 6.5, 0, 0.7, -0.8);               // main walls
  m.box(C.laterite, 10, 0.25, 2.2, 0, 0.7, 3.3);              // poomukham veranda floor
  for (const x of [-4.7, -2.3, 0, 2.3, 4.7]) m.box(C.wood, 0.22, 2.9, 0.22, x, 0.95, 4.2);
  m.box(C.wood, 1.2, 2.2, 0.1, 0, 0.7, 2.47);                 // door
  for (const x of [-3.5, 3.5]) { m.win(x, 1.8, 2.47, 1.2, 1.1); }
  for (const x of [-2.5, 2.5]) m.win(x, 1.8, -4.07, 1, 1);
  m.hipRoof(C.tile, 10, 8.4, 3.4, 3.7, { z: 0.15, over: 1.0 });
  m.box(C.wood, 0.3, 0.6, 2, 0, 0.0, 5.0);                    // steps
  m.extras = { kind: 'house', style: 'traditional Kerala, hip-and-gable tiled roof' };
  return m;
}
export function nalukettu() {
  const m = new Model('nalukettu');
  m.box(C.laterite, 22, 0.8, 22, 0, 0, 0);
  const wing = (x, z, w, d, ry) => { m.box(C.whitewash, w, 3.2, d, x, 0.8, z, ry); };
  wing(0, 7.5, 20, 5, 0); wing(0, -7.5, 20, 5, 0); wing(7.5, 0, 5, 10, 0); wing(-7.5, 0, 5, 10, 0);
  m.box(C.grass, 9.8, 0.05, 9.8, 0, 0.8, 0);                  // nadumuttam courtyard
  m.box(C.laterite, 1.2, 0.9, 1.2, 0, 0.82, 0); m.cyl(C.green, 0.25, 0.3, 0.8, 0, 1.7, 0, 6); // tulasi thara
  // roofs: four hip roofs sloping in/out
  m.hipRoof(C.tile, 20, 5, 3, 4.0, { z: 7.5, over: 1 }); m.hipRoof(C.tile, 20, 5, 3, 4.0, { z: -7.5, over: 1 });
  m.hipRoof(C.tile, 5, 10, 3, 4.0, { x: 7.5, over: 0.8, gable: false }); m.hipRoof(C.tile, 5, 10, 3, 4.0, { x: -7.5, over: 0.8, gable: false });
  for (const x of [-8, -4, 0, 4, 8]) m.box(C.wood, 0.25, 3.2, 0.25, x, 0.8, 10.6);
  m.box(C.wood, 1.4, 2.4, 0.1, 0, 0.8, 10.05);
  m.box(C.laterite, 30, 1.4, 0.5, 0, 0, 15); m.box(C.tile, 3.6, 0.5, 1.6, 0, 1.4, 15); // padippura gate wall
  m.extras = { kind: 'house', style: 'nalukettu courtyard house' };
  return m;
}
export function keralaHouseModern(v = 0) {
  const m = new Model('kerala_house_modern_' + v);
  const paint = PAINTS[v % PAINTS.length];
  m.box(C.concrete, 11, 0.5, 10, 0, 0, 0);
  m.box(paint, 9, 3.2, 8, 0, 0.5, -0.5);
  m.box(paint, 6, 3, 6, -1.5, 3.7, -1.5);                     // upper floor
  m.box(C.concrete, 9.6, 0.2, 8.6, 0, 3.7, -0.5);             // slab
  m.box(C.concrete, 3, 0.15, 3, 3, 3.7, 3.4);                 // sunshade
  for (const x of [1.8, 4.2]) m.box(C.whitewash, 0.3, 3.2, 0.3, x, 0.5, 4.6);
  m.win(-2.5, 1.6, 3.54, 1.4, 1.2); m.win(2.5, 1.6, 3.54, 1.4, 1.2); m.win(-1.5, 4.6, 1.54, 2, 1.1);
  m.box(C.wood, 1.1, 2.2, 0.1, 0.3, 0.5, 3.54);
  m.hipRoof(C.tile, 6, 6, 2.2, 6.7, { x: -1.5, z: -1.5, over: 0.7, gable: false });
  m.gableRoof(C.tileDark, 3.6, 3, 1.2, 3.9, { x: 3, z: 3.4, ry: Math.PI / 2, over: 0.2, endColor: C.whitewash });
  m.box(C.laterite, 14, 1.1, 0.3, 0, 0, 7); m.box(C.metal, 3, 1.3, 0.1, 3, 0, 7.05);  // compound wall + gate
  m.extras = { kind: 'house', style: 'modern Kerala two-storey' };
  return m;
}
export function apartmentTower(v = 0) {
  const m = new Model('apartment_tower_' + v); const floors = 10 + (v * 4) % 9, fh = 3.1;
  const paint = ['#e9e4da', '#d7dde3', '#efe0c8'][v % 3];
  m.box(C.concrete, 22, 1, 18, 0, 0, 0);
  m.box(paint, 18, floors * fh, 14, 0, 1, 0);
  for (let f = 1; f < floors; f++) { m.box(C.concrete, 18.6, 0.18, 14.6, 0, 1 + f * fh, 0); for (const x of [-6, 0, 6]) { m.win(x, 1 + f * fh + 0.9, 7.04, 3.2, 1.5); m.win(x, 1 + f * fh + 0.9, -7.04, 3.2, 1.5); } }
  for (let f = 1; f < floors; f++) for (const x of [-6, 6]) m.box(C.whitewash, 3.6, 1.0, 1.4, x, 1 + f * fh, 7.6);
  m.box(C.darkMetal, 4, 2.5, 4, 3, 1 + floors * fh, 0); m.cyl(C.blue, 1, 1, 1.6, -4, 1 + floors * fh, 2, 8); // lift room & tank
  m.extras = { kind: 'apartment', floors };
  return m;
}

// ---------- commercial ----------
export function teaShop(v = 0) { // chaayakkada
  const m = new Model('tea_shop_' + v);
  m.box(C.concrete, 6, 0.4, 6, 0, 0, 0);
  m.box(PAINTS[(v + 3) % 8], 5, 2.8, 4, 0, 0.4, -0.8);
  m.box(C.black, 3.6, 2.1, 0.06, 0, 0.6, 1.23);                // open front (dark interior)
  m.box(C.wood, 3.4, 1, 0.6, 0, 0.4, 1.6);                    // counter
  for (let i = 0; i < 4; i++) m.cyl(C.glass, 0.13, 0.13, 0.35, -1.2 + i * 0.8, 1.4, 1.6, 6);  // snack jars
  m.cyl(C.brass, 0.25, 0.3, 0.5, 1.4, 1.4, 1.5, 8);           // samovar
  m.box(C.wood, 3, 0.45, 0.4, 0, 0.4, 2.7);                   // bench
  m.gableRoof(C.tile, 5, 4, 1.4, 3.2, { z: -0.8, over: 0.3 });
  m.quad(C.tileDark, [-2.8, 3.0, 1.2], [2.8, 3.0, 1.2], [2.8, 2.3, 3.2], [-2.8, 2.3, 3.2], true); // sloping awning
  for (const x of [-2.6, 2.6]) m.box(C.wood, 0.12, 2.3, 0.12, x, 0, 3.1);
  m.box(SIGNS[v % 8], 3.8, 0.7, 0.1, 0, 3.25, 1.3);           // board
  m.extras = { kind: 'shop', type: 'chaayakkada / tea shop' };
  return m;
}
export function shopRow(v = 0) {
  const m = new Model('shop_row_' + v); const n = 4, w = 4.2;
  m.box(C.concrete, n * w + 1, 0.35, 10, 0, 0, 0);
  m.box(PAINTS[v % 8], n * w, 3.6, 8, 0, 0.35, -0.8);
  m.box(PAINTS[(v + 2) % 8], n * w, 3.2, 8, 0, 3.95, -0.8);
  m.box(C.concrete, n * w + 0.6, 0.2, 9.6, 0, 3.95, 0);       // first-floor slab / sunshade
  for (let i = 0; i < n; i++) {
    const x = -n * w / 2 + w / 2 + i * w;
    m.box(i % 2 ? C.shutter : C.black, w - 0.6, 2.8, 0.06, x, 0.35, 3.23); // shutter or open shop
    m.box(SIGNS[(v + i) % 8], w - 0.3, 0.75, 0.12, x, 3.1, 3.35);           // signboard
    m.win(x, 5.0, 3.23, 1.6, 1.3);
  }
  m.box(C.concrete, n * w, 0.9, 0.2, 0, 7.15, 3.1);           // parapet
  m.extras = { kind: 'shop', type: 'roadside shop row (4 units)' };
  return m;
}
export function lodge(v = 0) {
  const m = new Model('lodge_hotel_' + v); const fl = 4;
  m.box(C.concrete, 14, 0.4, 13, 0, 0, 0);
  m.box(PAINTS[(v + 5) % 8], 12, fl * 3.2, 10, 0, 0.4, -1);
  m.box(C.glass, 10, 2.6, 0.06, 0, 0.5, 4.03);
  for (let f = 1; f < fl; f++) { m.box(C.whitewash, 12.4, 1, 1.4, 0, 0.4 + f * 3.2, 4.6); for (const x of [-4, 0, 4]) m.win(x, 1.4 + f * 3.2, 4.03, 2.2, 1.4); }
  m.box(SIGNS[(v + 1) % 8], 6, 1.2, 0.2, 0, fl * 3.2 + 0.4, 4.1);
  m.hipRoof(C.tile, 12, 10, 2.4, fl * 3.2 + 0.4, { z: -1, over: 0.6, gable: false });
  m.extras = { kind: 'hotel', type: 'lodge / hotel' };
  return m;
}
export function mall() {
  const m = new Model('shopping_mall');
  m.box(C.concrete, 140, 0.5, 90, 0, 0, 0);
  m.box('#e4e1da', 120, 22, 70, 0, 0.5, -5);
  m.box(C.glass, 40, 18, 0.2, 0, 2.5, 30.1);
  m.box(C.whitewash, 46, 2, 6, 0, 20.5, 31);
  m.box(C.blue, 24, 3.5, 0.4, 0, 23, 34);
  for (let i = 0; i < 6; i++) m.box(C.concrete, 1.2, 18, 1.2, -18 + i * 7.2, 2.5, 33.6);
  m.extras = { kind: 'landmark', note: 'generic large mall (Edappally area)' };
  return m;
}
export function petrolPump() {
  const m = new Model('petrol_pump');
  m.box(C.concrete, 30, 0.2, 22, 0, 0, 0);
  for (const x of [-7, 7]) for (const z of [-4, 4]) m.box(C.whitewash, 0.5, 5.2, 0.5, x, 0.2, z);
  m.box(C.yellow, 20, 1, 13, 0, 5.4, 0); m.box(C.red, 20.2, 0.35, 13.2, 0, 5.4, 0);
  for (const x of [-4, 4]) { m.box(C.concrete, 1.2, 0.3, 4, x, 0.2, 0); m.box(C.red, 0.8, 1.7, 0.6, x, 0.5, 0); }
  m.box(C.whitewash, 8, 3.5, 5, 0, 0.2, -8.5); m.box(C.red, 1, 6, 1, 12, 0.2, 8); m.box(C.yellow, 2.4, 2.4, 0.3, 12, 6.2, 8);
  m.extras = { kind: 'service', type: 'fuel station' };
  return m;
}
export function warehouse() {
  const m = new Model('warehouse');
  m.box(C.concrete, 60, 0.3, 50, 0, 0, 0);
  m.box('#a9b4ba', 44, 9, 28, 0, 0.3, -8);
  m.gableRoof('#8c979d', 44, 28, 3, 9.3, { z: -8, over: 0.6, endColor: '#a9b4ba' });
  for (let i = 0; i < 4; i++) m.box(C.shutter, 5, 5, 0.1, -15 + i * 10, 0.3, 6.03);
  m.box(C.concrete, 44, 1.2, 3, 0, 0.3, 7.5);                 // loading dock
  m.extras = { kind: 'depot', type: 'goods warehouse with loading dock' };
  return m;
}
export function shippingContainer(v = 0) {
  const m = new Model('shipping_container_' + v);
  const col = [C.blue, C.red, C.orange, C.green, '#7d7d7d'][v % 5];
  m.box(col, 2.44, 2.59, 12.19, 0, 0, 0);
  for (let i = -5; i <= 5; i++) m.box(col, 2.5, 2.4, 0.12, 0, 0.1, i * 1.08);
  m.extras = { kind: 'prop', type: '40ft container' };
  return m;
}

// ---------- religious & landmarks ----------
export function keralaTempleSmall() {
  const m = new Model('kerala_temple_small');
  m.box(C.laterite, 30, 0.3, 30, 0, 0, 0);
  m.box(C.laterite, 30, 1.6, 0.5, 0, 0, 14.75); m.box(C.laterite, 30, 1.6, 0.5, 0, 0, -14.75);
  m.box(C.laterite, 0.5, 1.6, 30, 14.75, 0, 0); m.box(C.laterite, 0.5, 1.6, 30, -14.75, 0, 0);
  m.box(C.laterite, 7, 1, 7, 0, 0.3, -3); m.box(C.whitewash, 5, 3, 5, 0, 1.3, -3);   // sreekovil
  m.hipRoof(C.copper, 5, 5, 1.6, 4.3, { z: -3, over: 1.1, gable: false });
  m.hipRoof(C.copper, 3, 3, 1.6, 5.6, { z: -3, over: 0.5, gable: false });          // 2nd tier
  m.cyl(C.brass, 0.05, 0.25, 1.2, 0, 7.1, -3, 8);                                     // thazhikakudam finial
  m.box(C.wood, 6, 0.4, 6, 0, 0.3, 6); for (const [x, z] of [[-2.6, 3.4], [2.6, 3.4], [-2.6, 8.6], [2.6, 8.6]]) m.box(C.wood, 0.25, 2.6, 0.25, x, 0.7, z);
  m.hipRoof(C.tile, 6, 6, 1.4, 3.3, { z: 6, over: 0.6 });                            // namaskara mandapam
  m.cyl(C.brass, 0.18, 0.35, 5, 0, 0.3, 12, 8);                                       // deepastambham
  for (let i = 0; i < 8; i++) m.cyl(C.brass, 0.6 - i * 0.05, 0.6 - i * 0.05, 0.06, 0, 1 + i * 0.5, 12, 10);
  m.box(C.tile, 4, 0.6, 1.8, 0, 1.6, 14.75);                                          // entrance hood
  m.extras = { kind: 'temple', style: 'Kerala temple: square sreekovil, copper roof, deepastambham' };
  return m;
}
export function gopuram(color = C.tile) { // Kerala gopuram: laterite base, multi-tier tiled roof
  const m = new Model('kerala_gopuram');
  m.box(C.laterite, 12, 4, 8, 0, 0, 0); m.box(C.black, 3, 3, 8.2, 0, 0, 0);
  m.box(C.whitewash, 10, 3, 7, 0, 4, 0);
  for (let x = -4; x <= 4; x += 2) m.box(C.wood, 0.2, 3, 0.2, x, 4, 3.6);
  m.hipRoof(color, 10, 7, 2.6, 7, { over: 1.2 });
  m.box(C.wood, 6, 1.6, 4, 0, 8.6, 0); m.hipRoof(color, 6, 4, 2.2, 10.2, { over: 0.9 });
  m.cyl(C.brass, 0.05, 0.3, 1, -1, 12.4, 0, 8); m.cyl(C.brass, 0.05, 0.3, 1, 1, 12.4, 0, 8);
  m.extras = { kind: 'landmark-part', style: 'Kerala gopuram' };
  return m;
}
export function vadakkunnathanTemple() { // stylised; ~ real proportions (compound ~ 180 m)
  const m = new Model('vadakkunnathan_temple');
  const S = 90; // half-size of walled compound
  m.box(C.sand, S * 2, 0.7, S * 2, 0, 0, 0);
  for (const [x, z, w, d] of [[0, S, S * 2, 1.2], [0, -S, S * 2, 1.2], [S, 0, 1.2, S * 2], [-S, 0, 1.2, S * 2]]) m.box(C.laterite, w, 4, d, x, 0, z);
  const g = gopuram();
  m.child('gopuram_west', g, [-S, 0, 0]); m.child('gopuram_east', g, [S, 0, 0]);
  m.child('gopuram_north', g, [0, 0, -S]); m.child('gopuram_south', g, [0, 0, S]);
  // rotate copies via separate models (gopurams face outward): simpler — build rotated N/S versions
  m.children = m.children.filter(c => c.name.match(/west|east/));
  const gr = new Model('kerala_gopuram_ns'); for (const [k, geos] of g.parts) for (const geo of geos) gr.add(geo, k.split('|')[0], { ry: Math.PI / 2, ds: k.includes('ds') });
  m.child('gopuram_north', gr, [0, 0, -S]); m.child('gopuram_south', gr, [0, 0, S]);
  // inner nalambalam ring
  m.box(C.whitewash, 60, 3.5, 6, 0, 0, 27); m.box(C.whitewash, 60, 3.5, 6, 0, 0, -27);
  m.box(C.whitewash, 6, 3.5, 48, 27, 0, 0); m.box(C.whitewash, 6, 3.5, 48, -27, 0, 0);
  m.hipRoof(C.copper, 60, 6, 2.2, 3.5, { z: 27, over: 1, gable: false }); m.hipRoof(C.copper, 60, 6, 2.2, 3.5, { z: -27, over: 1, gable: false });
  m.hipRoof(C.copper, 6, 48, 2.2, 3.5, { x: 27, over: 1, gable: false }); m.hipRoof(C.copper, 6, 48, 2.2, 3.5, { x: -27, over: 1, gable: false });
  // three sreekovils (Shiva circular, Sankaranarayana, Rama)
  for (const [x, z, r] of [[-8, -6, 6], [8, -6, 5], [0, 10, 4.5]]) {
    m.cyl(C.laterite, r + 1, r + 1.4, 1.2, x, 0, z, 16); m.cyl(C.whitewash, r, r, 4, x, 1.2, z, 16);
    m.add(new THREE.ConeGeometry(r + 2, r * 0.9, 16), C.copper, { x, y: 5.2 + r * 0.45, z, ds: true });
    m.cyl(C.brass, 0.05, 0.4, 1.6, x, 5.2 + r * 0.9, z, 8);
  }
  // koothambalam (theatre hall)
  m.box(C.laterite, 22, 1.2, 14, -55, 0, 40); m.box(C.wood, 20, 4, 12, -55, 1.2, 40);
  m.hipRoof(C.copper, 20, 12, 5, 5.2, { x: -55, z: 40, over: 1.5 });
  m.cyl(C.brass, 0.2, 0.4, 8, 0, 0, 60, 8);                                         // deepastambham (south)
  // trees inside
  m.extras = { kind: 'landmark', name: 'Vadakkunnathan Temple, Thrissur (stylised)', compoundSize_m: S * 2 };
  return m;
}
export function church() {
  const m = new Model('kerala_church');
  m.box(C.concrete, 24, 0.5, 36, 0, 0, 0);
  m.box(C.whitewash, 14, 9, 28, 0, 0.5, -2);
  m.gableRoof(C.tile, 14, 28, 4.5, 9.5, { z: -2, ry: Math.PI / 2, over: 0.6 });
  m.box(C.whitewash, 16, 15, 1.5, 0, 0.5, 12.6);                       // facade
  m.tris(C.whitewash, [-8, 15.5, 12.6, 8, 15.5, 12.6, 0, 20, 12.6, -8, 15.5, 13.35, 0, 20, 13.35, 8, 15.5, 13.35], true);
  m.box(C.whitewash, 0.4, 3, 0.4, 0, 20, 12.6); m.box(C.whitewash, 1.8, 0.4, 0.4, 0, 21.6, 12.6);
  m.box(C.wood, 2.4, 4, 0.2, 0, 0.5, 13.4); for (const x of [-5, 5]) m.win(x, 6, 13.4, 1.4, 3);
  for (const x of [-7.6, 7.6]) m.box(C.whitewash, 2, 17, 2, x, 0.5, 12.6);
  m.box(C.laterite, 1.2, 0.3, 1.2, 0, 0.5, 18); m.box(C.whitewash, 0.5, 6, 0.5, 0, 0.8, 18); // flagstaff cross base
  m.extras = { kind: 'church', style: 'Kerala church with white facade' };
  return m;
}
export function mosque() {
  const m = new Model('kerala_mosque');
  m.box(C.concrete, 26, 0.5, 26, 0, 0, 0);
  m.box(C.whitewash, 18, 7, 16, 0, 0.5, -2);
  m.box(C.green, 18.4, 0.4, 16.4, 0, 7.5, -2);
  m.sphere(C.green, 5, 0, 7.9, -2, 14, 1); m.cyl(C.brass, 0.05, 0.15, 1.6, 0, 12.8, -2, 6);
  for (const x of [-8.5, 8.5]) { m.cyl(C.whitewash, 0.9, 1, 18, x, 0.5, 6.5, 10); m.cone(C.green, 1.1, 2.4, x, 18.5, 6.5, 10); }
  for (const x of [-5, 0, 5]) m.box(C.green, 2.6, 4, 0.1, x, 0.5, 6.03);
  m.extras = { kind: 'mosque' };
  return m;
}
export function chineseFishingNet() {
  const m = new Model('chinese_fishing_net');
  m.box(C.wood, 4, 1, 4, 0, 0, 0);                                     // platform
  const pole = (a, b, r = 0.18, col = C.teak) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
    const g = new THREE.CylinderGeometry(r * 0.7, r, len, 6); g.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    g.applyQuaternion(q); g.translate(A.x, A.y, A.z); m.add(g, col);
  };
  const tip = [0, 5, 18];                                              // cantilever reaching over water (+Z)
  pole([-1.2, 1, 0], tip); pole([1.2, 1, 0], tip); pole([0, 1, -1.5], [0, 9, -4]); pole([-1.2, 1, 0], [0, 9, -4]); pole([1.2, 1, 0], [0, 9, -4]);
  const n = [[-6, 1, 18], [6, 1, 18], [6, 1, 30], [-6, 1, 30]]; const top = [0, 6, 24];
  for (const c of n) pole(tip, c, 0.07, C.teak);
  m.tris(C.net, [...n[0], ...n[1], ...top, ...n[1], ...n[2], ...top, ...n[2], ...n[3], ...top, ...n[3], ...n[0], ...top].map((v, i) => i % 3 === 1 ? (v === 6 ? 0.2 : 1.6) : v), true);
  for (let i = 0; i < 6; i++) m.sphere(C.laterite, 0.35, 0, 8.6 - i * 0.6, -3.8 + i * 0.4, 5);   // counterweight stones
  m.extras = { kind: 'landmark', name: 'Chinese fishing net (Fort Kochi)', note: 'net faces +Z, place platform at shore' };
  return m;
}
export function tollPlaza(lanes = 8) {
  const m = new Model('toll_plaza'); const lw = 4.2, W = lanes * lw + 4;
  m.box(C.concrete, W + 10, 0.08, 40, 0, 0, 0);
  for (let i = 0; i <= lanes; i++) { const x = -lanes * lw / 2 + i * lw; m.box(C.yellow, 1.2, 0.3, 10, x, 0.08, 0); if (i < lanes) {} m.box(C.whitewash, 1.1, 2.4, 2, x, 0.38, 0); m.box(C.glass, 1.15, 0.9, 1.6, x, 1.6, 0); }
  for (let i = 0; i < lanes; i++) m.box(C.red, 0.08, 0.08, 3.2, -lanes * lw / 2 + i * lw + 0.7, 1.1, 2.4); // barriers
  for (const x of [-W / 2, -W / 4, 0, W / 4, W / 2]) m.box(C.concrete, 0.8, 6.5, 0.8, x, 0, -4), m.box(C.concrete, 0.8, 6.5, 0.8, x, 0, 4);
  m.box(C.whitewash, W + 2, 1.2, 12, 0, 6.5, 0); m.box(C.blue, W, 1.25, 0.1, 0, 6.5, 6.06);
  m.extras = { kind: 'toll', note: 'lanes run along Z; inspired by Paliyekkara toll plaza' };
  return m;
}
export function busShelter() {
  const m = new Model('bus_shelter');
  m.box(C.concrete, 7, 0.25, 3, 0, 0, 0);
  for (const x of [-3, 3]) m.box(C.laterite, 0.35, 2.6, 0.35, x, 0.25, -0.9), m.box(C.wood, 0.25, 2.6, 0.25, x, 0.25, 1.1);
  m.box(C.laterite, 6.4, 1.1, 0.2, 0, 0.25, -1.2); m.box(C.wood, 5.5, 0.12, 0.6, 0, 0.7, -0.7);
  m.hipRoof(C.tile, 6.4, 2.6, 1.2, 2.85, { over: 0.5 });
  m.extras = { kind: 'prop', type: 'bus shelter (tiled roof)' };
  return m;
}
export function busTerminal() {
  const m = new Model('bus_terminal');
  m.box(C.concrete, 90, 0.2, 60, 0, 0, 0);
  for (let i = 0; i < 6; i++) { const z = -22 + i * 9; m.box(C.concrete, 60, 0.3, 2, 0, 0.2, z); for (const x of [-27, -9, 9, 27]) m.box(C.whitewash, 0.6, 5, 0.6, x, 0.5, z); m.gableRoof('#8c979d', 64, 5, 1.2, 5.5, { z, over: 0.3 }); }
  m.box('#ddd6c8', 30, 8, 10, 0, 0.2, 26); m.box(C.red, 20, 1.6, 0.2, 0, 6, 31.1);
  m.extras = { kind: 'landmark', type: 'bus terminal / mobility hub' };
  return m;
}
export function metroPier() { // Kochi Metro style viaduct segment, 30 m long along Z, centred on median
  const m = new Model('metro_viaduct_30m');
  m.cyl(C.concrete, 1.0, 1.1, 10, 0, 0, 0, 10); m.box(C.concrete, 7, 1.4, 2.4, 0, 10, 0);
  m.box('#d4d1ca', 9, 1.8, 30, 0, 11.4, 0); m.box(C.concrete, 0.3, 1.1, 30, -4.35, 13.2, 0); m.box(C.concrete, 0.3, 1.1, 30, 4.35, 13.2, 0);
  m.extras = { kind: 'infrastructure', type: 'elevated metro viaduct' };
  return m;
}
export function electricPole() {
  const m = new Model('electric_pole');
  m.box(C.concrete, 0.25, 9, 0.18, 0, 0, 0); m.box(C.darkMetal, 2.2, 0.12, 0.12, 0, 8.4, 0);
  for (const x of [-0.9, 0, 0.9]) m.box(C.whitewash, 0.1, 0.25, 0.1, x, 8.52, 0);
  return m;
}
export function streetLight() {
  const m = new Model('street_light');
  m.cyl(C.metal, 0.08, 0.14, 10, 0, 0, 0, 6); m.box(C.metal, 0.12, 0.12, 2.5, 0, 9.9, 1.2); m.box(C.whitewash, 0.4, 0.15, 0.8, 0, 9.8, 2.3);
  return m;
}
export function kmStone() {
  const m = new Model('milestone'); m.box(C.whitewash, 0.5, 0.7, 0.2, 0, 0, 0); m.cyl(C.yellow, 0.25, 0.25, 0.2, 0, 0.6, 0, 10, { rx: Math.PI / 2 }); return m;
}

// ---------- vegetation ----------
export function coconutPalm(v = 0) {
  const m = new Model('coconut_palm_' + v); const r = (n) => Math.sin(v * 12.9898 + n * 78.233) * 0.5 + 0.5;
  const segs = 6, H = 11 + v * 2.5, lean = 0.12 + r(1) * 0.15; let x = 0, y = 0;
  for (let i = 0; i < segs; i++) { const h = H / segs; const nx = x + lean * h * (i / segs) * 1.6; m.add(new THREE.CylinderGeometry(0.17, 0.2, h, 6), C.trunk, { x: (x + nx) / 2, y: y + h / 2, rz: -Math.atan2(nx - x, h) }); x = nx; y += h; }
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2, L = 4.2, droop = -1.6 - r(i) * 1.2, w = 0.9;
    const dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx;
    const mid = [x + dx * L * 0.5, y + 0.6, dz * L * 0.5], end = [x + dx * L, y + droop, dz * L];
    m.tris(i % 2 ? C.palm : C.palmDark, [x, y, 0, ...[mid[0] + px * w, mid[1], mid[2] + pz * w], ...mid, x, y, 0, ...mid, ...[mid[0] - px * w, mid[1], mid[2] - pz * w],
      ...[mid[0] + px * w, mid[1], mid[2] + pz * w], ...end, ...mid, ...mid, ...end, ...[mid[0] - px * w, mid[1], mid[2] - pz * w]], true);
  }
  for (let i = 0; i < 4; i++) m.sphere('#6b7a2a', 0.28, x + Math.cos(i * 1.6) * 0.35, y - 0.4, Math.sin(i * 1.6) * 0.35, 5);
  m.extras = { kind: 'tree', type: 'coconut palm', height_m: +H.toFixed(1) };
  return m;
}
export function bananaPlant() {
  const m = new Model('banana_plant');
  m.cyl('#7c8f3a', 0.14, 0.2, 2.2, 0, 0, 0, 6);
  for (let i = 0; i < 6; i++) { const a = i * 1.05, dx = Math.cos(a), dz = Math.sin(a);
    m.tris(C.banana, [0, 2.1, 0, dx * 1.8 - dz * 0.45, 2.6, dz * 1.8 + dx * 0.45, dx * 2.4, 1.8, dz * 2.4, 0, 2.1, 0, dx * 2.4, 1.8, dz * 2.4, dx * 1.8 + dz * 0.45, 2.6, dz * 1.8 - dx * 0.45], true); }
  return m;
}
export function shadeTree(v = 0) { // mango / jackfruit / rain tree
  const m = new Model('shade_tree_' + v);
  m.cyl(C.trunk, 0.35, 0.5, 4, 0, 0, 0, 6);
  const g = ['#3f6f2e', '#4c7d33', '#35612a'][v % 3];
  m.sphere(g, 3.6 + v * 0.6, 0, 6, 0, 7, 0.75); m.sphere(g, 2.6, 1.8, 5.2, 1, 6, 0.8); m.sphere(g, 2.4, -1.8, 5.6, -1, 6, 0.8);
  return m;
}

// ---------- vehicles (wheels are separate child nodes named wheel_*) ----------
function wheel(name, r, w, dual = false) {
  const m = new Model(name);
  m.add(new THREE.CylinderGeometry(r, r, w, 12), C.tyre, { rz: Math.PI / 2 });
  m.add(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 8), C.rim, { rz: Math.PI / 2 });
  if (dual) m.add(new THREE.CylinderGeometry(r, r, w, 12), C.tyre, { x: w + 0.04, rz: Math.PI / 2 });
  return m;
}
function addWheels(m, list, r, w) { // list: [name, x, z, dual]
  const cache = {};
  for (const [n, x, z, dual] of list) {
    const key = dual ? 'd' : 's'; cache[key] ??= wheel(`${m.name}_wheel${dual ? '_dual' : ''}`, r, w, dual);
    m.child(n, cache[key], [x, r, z]);
  }
}
export function lorryIndian(v = 0) { // classic rigid lorry with painted cab and wooden-look body
  const m = new Model('lorry_rigid_' + v); const cab = [C.orange, C.yellow, C.blue, C.red][v % 4];
  m.box(C.darkMetal, 1.0, 0.3, 8.4, 0, 0.75, -0.4);                   // chassis
  m.box(cab, 2.4, 1.9, 2.0, 0, 1.0, 2.9); m.box(cab, 2.4, 0.5, 0.6, 0, 1.0, 4.1);
  m.box(C.glass, 2.1, 0.8, 0.06, 0, 1.95, 3.92); m.box(C.glass, 0.06, 0.6, 1.0, 1.22, 2.0, 3.0); m.box(C.glass, 0.06, 0.6, 1.0, -1.22, 2.0, 3.0);
  m.box(C.metal, 2.0, 0.35, 0.15, 0, 0.75, 4.42);                     // bumper
  m.box(C.whitewash, 0.3, 0.2, 0.05, -0.85, 1.25, 4.42); m.box(C.whitewash, 0.3, 0.2, 0.05, 0.85, 1.25, 4.42);
  m.box(cab, 2.5, 0.25, 0.6, 0, 2.9, 3.4);                            // painted visor ("crown")
  m.box(C.woodLight, 2.5, 0.2, 6.0, 0, 1.05, -1.6);                   // deck
  for (const s of [-1, 1]) m.box(C.woodLight, 0.08, 1.4, 6.0, s * 1.21, 1.25, -1.6);
  m.box(C.woodLight, 2.5, 1.4, 0.08, 0, 1.25, -4.58); m.box(C.woodLight, 2.5, 1.9, 0.1, 0, 1.25, 1.35);
  for (let i = 0; i < 6; i++) m.box(SIGNS[(i + v) % 8], 0.1, 0.2, 0.9, 1.26, 2.2, -4.0 + i * 1.0);  // painted side band
  m.box(C.green, 2.5, 0.8, 6.0, 0, 2.65, -1.6);                       // tarpaulin load
  addWheels(m, [['wheel_FL', -1.05, 3.1], ['wheel_FR', 1.05, 3.1], ['wheel_RL', -1.18, -2.6, true], ['wheel_RR', 0.82, -2.6, true]], 0.5, 0.3);
  m.extras = { kind: 'vehicle', type: 'rigid lorry', length_m: 9.2, frontAxis: '+Z', wheelRadius: 0.5 };
  return m;
}
export function tractorUnit(v = 0) { // modern prime mover for semi-trailers
  const m = new Model('truck_tractor_' + v); const col = [C.whitewash, C.red, C.blue][v % 3];
  m.box(C.darkMetal, 1.0, 0.35, 6.2, 0, 0.7, -0.3);
  m.box(col, 2.5, 2.7, 2.3, 0, 1.0, 1.65); m.box(col, 2.5, 0.6, 2.3, 0, 3.7, 1.55);
  m.box(C.glass, 2.3, 1.0, 0.06, 0, 2.5, 2.82); m.box(C.glass, 0.06, 0.8, 1.0, 1.26, 2.6, 2.1); m.box(C.glass, 0.06, 0.8, 1.0, -1.26, 2.6, 2.1);
  m.box(C.darkMetal, 2.3, 0.5, 0.1, 0, 1.2, 2.82); m.box(C.metal, 2.5, 0.4, 0.2, 0, 0.6, 2.9);
  m.box(C.metal, 1.6, 0.12, 1.6, 0, 1.06, -2.4);                      // fifth wheel
  m.cyl(C.metal, 0.3, 0.3, 1.2, 1.15, 0.6, 0.0, 8, { rx: Math.PI / 2 }); // tank
  addWheels(m, [['wheel_FL', -1.05, 1.6], ['wheel_FR', 1.05, 1.6], ['wheel_RL', -1.2, -2.4, true], ['wheel_RR', 0.84, -2.4, true]], 0.52, 0.3);
  m.extras = { kind: 'vehicle', type: 'tractor unit', fifthWheel: [0, 1.18, -2.4], frontAxis: '+Z' };
  return m;
}
export function trailerContainer(v = 0) {
  const m = new Model('trailer_container_' + v); const col = [C.blue, C.red, C.orange, C.green][v % 4];
  m.box(C.darkMetal, 2.5, 0.25, 12.4, 0, 1.0, 0);
  m.box(col, 2.44, 2.59, 12.19, 0, 1.25, 0);
  for (let i = -5; i <= 5; i++) m.box(col, 2.5, 2.4, 0.12, 0, 1.35, i * 1.08);
  m.box(C.metal, 0.15, 1.0, 0.15, -1, 0, 4.5); m.box(C.metal, 0.15, 1.0, 0.15, 1, 0, 4.5); // landing gear
  addWheels(m, [['wheel_1L', -1.2, -3.9, true], ['wheel_1R', 0.84, -3.9, true], ['wheel_2L', -1.2, -5.2, true], ['wheel_2R', 0.84, -5.2, true]], 0.52, 0.3);
  m.extras = { kind: 'trailer', kingpin: [0, 1.18, 5.4], length_m: 12.4 };
  return m;
}
export function tankerTruck() {
  const m = lorryIndian(2); m.name = 'tanker_truck';
  // replace deck items: rebuild quickly
  const t = new Model('tanker_truck'); t.box(C.darkMetal, 1.0, 0.3, 8.4, 0, 0.75, -0.4);
  t.box(C.red, 2.4, 1.9, 2.0, 0, 1.0, 2.9); t.box(C.glass, 2.1, 0.8, 0.06, 0, 1.95, 3.92); t.box(C.metal, 2.0, 0.35, 0.15, 0, 0.75, 4.42);
  t.cyl(C.whitewash, 1.15, 1.15, 5.8, 0, 2.2, -1.6, 14, { rx: Math.PI / 2, y: 2.25 });
  addWheels(t, [['wheel_FL', -1.05, 3.1], ['wheel_FR', 1.05, 3.1], ['wheel_RL', -1.18, -2.6, true], ['wheel_RR', 0.82, -2.6, true]], 0.5, 0.3);
  t.extras = { kind: 'vehicle', type: 'fuel tanker' }; return t;
}
export function bus(kind = 'state') { // 'state' red/yellow, 'private' colourful
  const m = new Model(kind === 'state' ? 'bus_state_transport' : 'bus_private');
  const body = kind === 'state' ? '#c0281d' : '#1f8fb3', band = kind === 'state' ? '#f0c230' : '#f2f2f2', top = kind === 'state' ? '#e8e2d3' : '#f3b51f';
  m.box(body, 2.5, 1.3, 11, 0, 0.45, 0); m.box(band, 2.52, 0.3, 11.02, 0, 1.75, 0);
  m.box(C.glass, 2.52, 0.95, 10.4, 0, 2.05, -0.1); for (let i = -4; i <= 4; i++) m.box(body, 2.54, 0.95, 0.12, 0, 2.05, i * 1.15);
  m.box(top, 2.5, 0.35, 11, 0, 3.0, 0); m.box(C.glass, 2.3, 1.0, 0.06, 0, 1.95, 5.51);
  m.box(C.black, 2.2, 0.35, 0.06, 0, 2.95, 5.52); m.box(C.metal, 2.5, 0.3, 0.2, 0, 0.45, 5.55);
  if (kind === 'private') for (let i = 0; i < 5; i++) m.box(SIGNS[i], 0.04, 0.5, 1.8, 1.27, 0.7, -4 + i * 2);
  addWheels(m, [['wheel_FL', -1.05, 3.6], ['wheel_FR', 1.05, 3.6], ['wheel_RL', -1.15, -2.8, true], ['wheel_RR', 0.82, -2.8, true]], 0.5, 0.28);
  m.extras = { kind: 'vehicle', type: kind + ' bus', length_m: 11 };
  return m;
}
export function autoRickshaw() {
  const m = new Model('auto_rickshaw');
  m.box(C.black, 1.3, 0.55, 1.6, 0, 0.25, -0.45);                     // rear body
  m.box('#e3c21e', 1.3, 0.7, 0.3, 0, 0.25, 0.9);                     // front cowl
  m.box('#e3c21e', 0.9, 0.5, 0.6, 0, 0.25, 0.55);
  m.box(C.glass, 1.1, 0.6, 0.05, 0, 1.0, 0.95);
  m.box(C.black, 1.4, 0.1, 2.3, 0, 1.75, -0.15);                     // canopy
  m.add(new THREE.CylinderGeometry(0.7, 0.7, 2.2, 10, 1, true, 0, Math.PI), C.black, { y: 1.1, z: -0.2, rx: Math.PI / 2, sx: 1, sy: 1, ds: true, sz: 0.85 });
  m.box('#e3c21e', 1.3, 0.3, 1.6, 0, 0.8, -0.45);
  m.box(C.wood, 1.1, 0.12, 0.6, 0, 0.75, -0.6);                      // seat
  const w = wheel('auto_rickshaw_wheel', 0.22, 0.14);
  m.child('wheel_F', w, [0, 0.22, 1.0]); m.child('wheel_RL', w, [-0.6, 0.22, -0.8]); m.child('wheel_RR', w, [0.6, 0.22, -0.8]);
  m.extras = { kind: 'vehicle', type: 'auto rickshaw' };
  return m;
}
export function car(v = 0) {
  const m = new Model('car_' + v); const col = ['#e6e6e6', '#9a1b1b', '#2b2f36', '#c3c7cc', '#1d4e89'][v % 5];
  m.box(col, 1.75, 0.7, 4.2, 0, 0.35, 0);
  m.box(col, 1.6, 0.6, 2.2, 0, 1.05, -0.3); m.box(C.glass, 1.62, 0.45, 2.0, 0, 1.1, -0.3);
  m.box(C.glass, 1.4, 0.48, 0.06, 0, 1.08, 0.82); m.box(C.whitewash, 0.3, 0.12, 0.04, -0.6, 0.8, 2.1); m.box(C.whitewash, 0.3, 0.12, 0.04, 0.6, 0.8, 2.1);
  addWheels(m, [['wheel_FL', -0.82, 1.3], ['wheel_FR', 0.82, 1.3], ['wheel_RL', -0.82, -1.3], ['wheel_RR', 0.82, -1.3]], 0.32, 0.2);
  m.extras = { kind: 'vehicle', type: 'car' };
  return m;
}
export function scooter() {
  const m = new Model('scooter');
  m.box(C.blue, 0.4, 0.5, 1.2, 0, 0.3, -0.1); m.box(C.black, 0.35, 0.12, 0.6, 0, 0.8, -0.25);
  m.box(C.blue, 0.35, 0.8, 0.15, 0, 0.35, 0.55); m.box(C.metal, 0.7, 0.05, 0.05, 0, 1.15, 0.55);
  const w = wheel('scooter_wheel', 0.22, 0.1); m.child('wheel_F', w, [0, 0.22, 0.6]); m.child('wheel_R', w, [0, 0.22, -0.55]);
  m.extras = { kind: 'vehicle', type: 'scooter' }; return m;
}

export const ALL = () => [
  keralaHouseTraditional(), nalukettu(), keralaHouseModern(0), keralaHouseModern(1), keralaHouseModern(2), apartmentTower(0), apartmentTower(1),
  teaShop(0), teaShop(1), shopRow(0), shopRow(1), shopRow(2), lodge(0), mall(), petrolPump(), warehouse(), shippingContainer(0),
  keralaTempleSmall(), gopuram(), vadakkunnathanTemple(), church(), mosque(), chineseFishingNet(), tollPlaza(), busShelter(), busTerminal(), metroPier(),
  electricPole(), streetLight(), kmStone(), coconutPalm(0), coconutPalm(1), bananaPlant(), shadeTree(0), shadeTree(1),
  lorryIndian(0), lorryIndian(1), tractorUnit(0), trailerContainer(0), tankerTruck(), bus('state'), bus('private'), autoRickshaw(), car(0), car(1), scooter(),
];
