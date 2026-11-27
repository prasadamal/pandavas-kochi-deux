import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {prune,dedup,weld,simplify,quantize,meshopt,textureCompress} from '@gltf-transform/functions';import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';import sharp from 'sharp';
await MeshoptEncoder.ready;await MeshoptSimplifier.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
for(const f of process.argv.slice(2)){const doc=await io.read(f);
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.5,error:.01}),prune(),dedup(),
   textureCompress({encoder:sharp,targetFormat:'jpeg',quality:78,slots:/baseColor/,resize:[512,512]}),textureCompress({encoder:sharp,targetFormat:'png',resize:[256,256],formats:/png/}),
   meshopt({encoder:MeshoptEncoder,level:'medium'}));
 const out=f.replace('av_raw_','rb_');await io.write(out,doc);const v=doc.getRoot().listMeshes().reduce((a,m)=>a+m.listPrimitives().reduce((b,p)=>b+p.getAttribute('POSITION').getCount(),0),0);console.log(out.split('/').pop(),'verts',v);}
