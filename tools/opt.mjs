import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import {prune,dedup,resample,quantize} from '@gltf-transform/functions';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const doc=await io.read(process.argv[2]);const root=doc.getRoot();
const keep=new Set(['Death','Gun_Shoot','HitRecieve','Idle','Idle_Gun_Pointing','Idle_Gun_Shoot','Idle_Neutral','Interact','Kick_Right','Punch_Left','Punch_Right','Roll','Run','Run_Shoot','Walk','Wave']);
for(const a of root.listAnimations()){const n=a.getName().split('|').pop();if(!keep.has(n))a.dispose();else a.setName(n);}
for(const n of root.listNodes())if(n.getName()==='Backpack'){n.dispose();}
await doc.transform(resample({tolerance:0.002}),prune(),dedup(),quantize({quantizePosition:14,quantizeNormal:10}));
await io.write(process.argv[3],doc);
