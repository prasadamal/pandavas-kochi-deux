# Asset pipeline

These scripts produced the files the game loads next to `index.html`.

| Script | What it does |
|---|---|
| `pipe.html`, `run.js` | Headless-Chromium runner (Playwright) for three.js conversion scripts |
| `build_av.js` | Rocketbox FBX avatar → GLB (hi-poly mesh, 512 px textures, re-dyed outfits, Kerala skin tones) |
| `build_anims.js` | Rocketbox clips plus Quaternius fight/gun clips transferred onto the Rocketbox skeleton |
| `avopt.mjs`, `animopt.mjs`, `opt.mjs` | gltf-transform: simplify, quantize, meshopt-compress, JPEG textures |
| `kalib.mjs` | Packs the 107 Kerala asset models into one compressed library |
| `fk_rasterise.py`, `fk_tiles.py` | Fort Kochi OSM GLB → game tile map, roof blocks and street polygons |
| `ground_textures.py` | Seamless asphalt, laterite, grass, sand, concrete and paver textures |
| `compose_original_theme.py` | Synthesises the original "Gangs of Mollywood" theme cues |

The game reads `people/*.txt` and `assets/kerala_lib.txt`: GLB files stored as base64 text, because the artifact host only serves text and media types. Serve them from the same folder as `index.html`.
