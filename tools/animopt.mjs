import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS,EXTMeshoptCompression} from '@gltf-transform/extensions';import {resample,prune,dedup,meshopt} from '@gltf-transform/functions';import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
await MeshoptEncoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const doc=await io.read(process.argv[2]);await doc.transform(resample({tolerance:0.0015}),prune(),dedup(),meshopt({encoder:MeshoptEncoder,level:'medium'}));await io.write(process.argv[3],doc);
