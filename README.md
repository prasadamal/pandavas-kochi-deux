# Pandavas of Kochi

A small top-down crime game set in Kochi, Kerala. It runs in the browser as a single HTML file.

## Missions

1. **1996 · Escape from Mercy Home** (Fort Kochi, night). Young Sony wakes the other four kids, steals the warden's revolver, gets past the gate guard and runs through the forest to the goods train.
2. **2026 · Kamath's Daughter** (Kochi city). Steal a car, pick up the gang at the Mattancherry godown, take Meera from Kamath's bungalow and escape the police to Fort Kochi beach.
3. **Open road · Lorry Driver** (`truck/`, 3D). Back a Tata tractor under an 18-tonne container trailer at Cochin Port, drive NH 544 through Edappally, Aluva, Angamaly, Chalakudy and the Paliyekkara toll to Mannuthy, and park in the bay at the Thrissur goods depot (about 82 km of compressed route, 10 to 15 minutes of driving).

### Lorry Driver controls

| Key / touch | Action |
|---|---|
| `W` / `↑` / GAS pedal | Accelerate |
| `S` / `↓` / BRAKE pedal | Brake; hold at a stop to reverse |
| `A` `D` / `←` `→` / steering wheel | Steer (drag the wheel on a phone) |
| `C` / CAM | Chase, far, cab (right-hand drive) and top cameras |
| `M`, `Q` / `E`, A/M − + | Automatic or manual gears, shift down / up |
| `H` / HORN | Horn |
| `R` / RECOVER | Put the lorry back on the road |
| `P` / `Esc` | Pause |

The world comes from the Kochi–Thrissur kit in `truck/assets` (glTF, see `truck/kit-src/KIT_README.md`). Only the roads, trees and buildings within about 1.2 km of the lorry are drawn; traffic and NH milestones are created ahead of you and removed behind. Open `truck/index.html?dev` to get `window.__lorry.autopilot(true)` and `jump(s)` for testing.

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

Open `index.html` in a browser. On a phone, hold it sideways and use the on-screen joystick and buttons. On a computer:

| Key           | Action           |
|---------------|------------------|
| WASD          | Move / drive     |
| E             | Action / car     |
| Space / click | Shoot            |
| R             | Reload           |
| P             | Pause            |

The 3D moments load three.js from cdnjs. Without network access the game still runs and skips them.
