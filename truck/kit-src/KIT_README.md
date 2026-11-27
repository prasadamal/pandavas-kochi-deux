# Kochi – Thrissur game kit (Three.js / glTF)

Low-poly Kerala world and assets for a Euro Truck Simulator–style game.
Units are metres, +Y is up and north is −Z. All files are flat-coloured with no textures, so they stay small.

## Files
| Path | What |
|---|---|
| `world/kochi_thrissur_world.glb` | The whole map: Kochi main roads, NH 544 Edappally → Mannuthy, Thrissur and Swaraj Round, the temple, about 1,300 roadside shops plus houses, palms and lights (1.9 MB) |
| `world/kochi_thrissur_world.meshopt.glb` | The same map compressed with meshopt (1.1 MB). Needs `MeshoptDecoder` |
| `world/routes.json` | Road centrelines, towns, POIs, fuel stations and a delivery job, for AI traffic, GPS and spawns |
| `assets/*.glb` | 46 separate models: buildings, landmarks, props and vehicles |
| `kerala_asset_pack.glb` | All the assets in one file, one named root node each |
| `demo/` | A drivable truck demo: `npx serve demo`, then open it in a browser |
| `src/` | The generators. Change them and rebuild the files |

## Loading in Three.js
```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const world = await loader.loadAsync('world/kochi_thrissur_world.meshopt.glb');
scene.add(world.scene);
const renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true }); // the map is ~14 km long
```
- Trees, shops and houses use `EXT_mesh_gpu_instancing`. Three.js turns them into `InstancedMesh` automatically.
- Road meshes are split into 800 m tiles (`road_x_z`, `mark_x_z`), so frustum culling works.
- Vehicles have separate wheel nodes (`wheel_FL`, `wheel_RR`…) that you can spin. The front of every vehicle points to +Z.
- `truck_tractor_*`: `extras.fifthWheel`. `trailer_container_*`: `extras.kingpin`. Use these to couple a truck and trailer.
- Road surface height: city 0.40, NH 0.45, Round 0.50.

## Scale
Cities are about 1:3.3 and the open highway is about 1:8.3. The ~65 km real drive becomes about 9 km of NH plus city roads. ETS2 uses about 1:19.
To change the scale, edit `HIGHWAY_SCALE` / `CITY_SCALE` at the top of `src/world.mjs` and run `node world.mjs`.

## Accuracy
Road shapes are hand-traced from approximate junction coordinates (Edappally, Aluva, Angamaly, Chalakudy, Paliyekkara, Puthukkad, Mannuthy, Thrissur Round…). The landmarks are stylised, so this is not survey-accurate.
For real geometry, run `src/osm_to_glb.mjs` on your own computer. It downloads OpenStreetMap roads for the same area, plus buildings if you add `--buildings`. It builds a GLB in the same coordinate system, so you can line it up with this world or use it in place of the roads.
If you ship OSM-derived data, credit "© OpenStreetMap contributors".

## Rebuild
```
cd src && npm install
node build_assets.mjs        # assets
node world.mjs               # world (add --meshopt for the compressed version)
node osm_to_glb.mjs --buildings --meshopt   # real OSM version (needs internet)
```
