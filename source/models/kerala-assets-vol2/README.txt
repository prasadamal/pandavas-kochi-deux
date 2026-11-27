KERALA GAME ASSETS • VOLUME 2
100 original stylized exterior props. Each numbered model is a standalone binary glTF 2.0 file with embedded materials. All files use metres, Y up, with the lowest point on Y=0. Road vehicles face +Z. Assets import as static meshes. Gameplay collision, wheel animation, scripts and interiors are outside this pack. The JSON catalogue gives relative paths and dimensions for Three.js. Place the models folder in public/ to serve it unchanged.

Example (with a lit Three.js scene):
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const model = await new GLTFLoader().loadAsync("/models/backwaters/023_kettuvallam_houseboat.glb");
scene.add(model.scene);
