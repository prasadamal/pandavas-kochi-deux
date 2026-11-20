# Pandavas of Kochi

A small top-down crime game set in Kochi, Kerala. It runs in the browser as a single HTML file.

## Story mode

Pick a crew on the title screen. Progress saves, and **Continue** resumes where you stopped.

| Campaign | You play | Hunted by |
|---|---|---|
| The Pandavas | Sony, Danny, Xavi, Mammu, Pappan | Ayyappan's crew |
| Ayyappan's crew | Ayyappan, Fakeer, Benny, Geevarghese, Tony | Sony and the Pandavas |

Both stories include an armed standoff that turns into a shared meal, and both end the same way: nobody walks out, and every fall is a slow-motion 3D shot, followed by a comic afterlife epilogue. The earlier missions are still available under **Extra missions**.

New controls: **G** grenade, **Q** medkit, **T** torch, **H** horn, **Shift** sprint.

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

Open `index.html` in a browser. On a phone, hold it sideways and use the on-screen joystick and buttons. On a computer:

| Key           | Action           |
|---------------|------------------|
| WASD          | Move / drive     |
| E             | Action / car     |
| Space / click | Shoot            |
| R             | Reload           |
| P             | Pause            |

The 3D moments load three.js from cdnjs. Without network access the game still runs and skips them.
