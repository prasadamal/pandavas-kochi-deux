// Copies index.html into www/ and swaps the CDN three.js for the bundled copy so the app works offline.
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),out=path.join(root,'www');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const cdn='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
if(!html.includes(cdn))throw new Error('three.js CDN tag not found in index.html');
html=html.replace(cdn,'three.min.js');
fs.writeFileSync(path.join(out,'index.html'),html);
fs.copyFileSync(path.join(root,'node_modules/three/build/three.min.js'),path.join(out,'three.min.js'));
console.log('www/ ready');
