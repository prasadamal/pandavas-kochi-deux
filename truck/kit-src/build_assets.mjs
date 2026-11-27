import fs from 'fs';
import { makeDoc, nodeOf, writeGLB } from './lib.mjs';
import { ALL } from './assets.mjs';

fs.mkdirSync('out/assets', { recursive: true });
const models = ALL();
const report = [];
for (const m of models) {
  const doc = makeDoc(); const scene = doc.createScene(m.name); scene.addChild(nodeOf(doc, m));
  const p = `out/assets/${m.name}.glb`; await writeGLB(doc, p); report.push([m.name, fs.statSync(p).size]);
}
// single pack: every asset as a named root node, laid out in a row for preview
const doc = makeDoc(); const scene = doc.createScene('kerala_asset_pack'); let x = 0;
for (const m of models) { const n = nodeOf(doc, m); n.setTranslation([x, 0, 0]); scene.addChild(n); x += 40; }
await writeGLB(doc, 'out/kerala_asset_pack.glb');
console.log(report.map(r => r[0].padEnd(30) + (r[1] / 1024).toFixed(1) + ' KB').join('\n'));
console.log('pack', (fs.statSync('out/kerala_asset_pack.glb').size / 1024).toFixed(1), 'KB');
