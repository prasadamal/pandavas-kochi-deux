# Pandavas of Kochi

A small top-down crime game set in Kochi, Kerala. It runs in the browser as a single HTML file.

## Missions

1. **1996 · Escape from Mercy Home** (Fort Kochi, night). Young Sony wakes the other four kids, steals the warden's revolver, gets past the gate guard and runs through the forest to the goods train.
2. **2026 · Kamath's Daughter** (Kochi city). Steal a car, pick up the gang at the Mattancherry godown, take Meera from Kamath's bungalow and escape the police to Fort Kochi beach.

## Features

- Major story moments cut to a short 3D shot (three.js r128) and return to the 2D view.
- Each member of the gang has their own role, weapon and movement:

  | Member  | Weapon   | Role                                 |
  |---------|----------|--------------------------------------|
  | Bheeman | Shotgun  | Charges in close                     |
  | Kuttan  | SMG      | Flanks to the side                   |
  | Tintu   | Rifle    | Hangs back and picks targets off     |
  | Shibu   | Revolver | Stays near Sony; fastest at reviving |

- Health and revives:
  - Anyone who goes down bleeds out unless a teammate helps them up.
  - Sony can revive a teammate by walking up and pressing ACTION.
  - If Sony goes down, the gang comes to pick him up.
- Traffic drives on the left and includes autos, buses, scooters and jeeps. You can steal any vehicle, and the police chase you with wanted stars.

## Run

Play it online at **https://prasadamal.github.io/pandavas-kochi-deux/**, or open `index.html` in a browser. On a phone, hold it sideways and use the on-screen joystick and buttons. On a computer:

| Key           | Action           |
|---------------|------------------|
| WASD          | Move / drive     |
| E             | Action / car     |
| Space / click | Shoot            |
| R             | Reload           |
| P             | Pause            |

The 3D moments load three.js from cdnjs. Without network access the game still runs and skips them.

## Tests

Browser tests in `tests/` play both missions from start to finish, load every checkpoint, check that downed gang members and Sony get helped up, that traffic stays on the road, that the 3D moments run, and that the touch controls appear on a phone.

```sh
npm install
npx playwright install chromium
npm test
```

The tests jump the player straight to each objective, so they check that the missions work, not how hard they are.

## Deploy

On every push to `main`, GitHub Actions runs the tests and, if they pass, publishes `index.html` to GitHub Pages. Pull requests run the tests only.
