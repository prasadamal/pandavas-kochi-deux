import {NodeIO,Document} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {prune,dedup,quantize,meshopt,mergeDocuments,unpartition} from '@gltf-transform/functions';import {MeshoptEncoder} from 'meshoptimizer';import fs from 'fs';import path from 'path';
await MeshoptEncoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const S='/tmp/claude-0/-home-user/04cdebb8-22c4-5445-85fc-1bc16463998b/scratchpad/';
const files=[...fs.readdirSync(S+'ka1/models').map(f=>S+'ka1/models/'+f)];
for(const d of fs.readdirSync(S+'ka2/models'))for(const f of fs.readdirSync(S+'ka2/models/'+d))files.push(S+'ka2/models/'+d+'/'+f);
const doc=new Document();doc.createBuffer();const keys=[];
for(const f of files.sort()){const key=path.basename(f,'.glb').replace(/^\d+_/,'').toLowerCase();const src=await io.read(f);
  const before=new Set(doc.getRoot().listScenes());const map=mergeDocuments(doc,src);
  for(const sc of doc.getRoot().listScenes())if(!before.has(sc)){sc.setName(key);}keys.push(key);}
await doc.transform(unpartition(),dedup(),prune({keepLeaves:false}),quantize(),meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write(S+'site/kerala_lib.glb',doc);console.log('scenes',doc.getRoot().listScenes().length,'keys',keys.length);
