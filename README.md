# Pandavas of Kochi

A small top-down crime game set in Kochi, Kerala. It runs in the browser as a single HTML file.

## Latest build (Gangs of Mollywood)

`index.html` is the current game, as published on claude.ai. It needs `people/` and `assets/` beside it. Without them it still runs, with simpler bodies and models.

- **Stories:** Sony's Pandavas and Ayyappan's crew, ending at Tatva resort and "Bilal vs Jacky · coming soon".
- **People:** realistic Rocketbox characters with motion-captured moves, including Jacky and Bilal.
- **Weapons:** a weapon wheel and 8 guns with realistic stats; a shop for weapons, clothes and armour.
- **Kochi:** metro, KSRTC bus, water metro and jankar rides with 3D cinematics. Swimming, with drowning.
- **Fort Kochi:** a district built from OpenStreetMap, connected by Thoppumpady Bridge.
- **Kerala assets:** your 107 models as traffic, houses, market stalls, boats, trees and festival props.
- **Roads:** curved ghat roads in Munnar and the valley.
- **Vehicles:** KSRTC buses, Kerala autos and Ambassadors.
- **Music:** film theme or the original theme, switchable in the menu.

Third-party licences are listed in `LICENSES.md`. The conversion tools are in `tools/`.

## Story mode

Pick a crew on the title screen. Progress saves, and **Continue** resumes where you stopped.

| Campaign | You play | Hunted by |
|---|---|---|
| The Pandavas | Sony, Danny, Xavi, Mammu, Pappan | Ayyappan's crew |
| Ayyappan's crew | Ayyappan, Fakeer, Benny, Geevarghese, Tony | Sony and the Pandavas |

Both stories include an armed standoff that turns into a shared meal, and both end the same way: nobody walks out, and every fall is a slow-motion 3D shot, followed by a comic afterlife epilogue. The earlier missions are still available under **Extra missions**.

New in the polish pass: a procedural soundtrack (tanpura drone, chenda and tabla rhythm, plucked melody that gets faster in fights), monsoon rain with lightning and thunder in the city, floating damage numbers, blood, kill combos that pay cash, and on-screen buttons for sprint, grenade, medkit and torch.

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

## Android APK

The game is wrapped with [Capacitor](https://capacitorjs.com). `index.html` stays the single source of truth; `npm run sync` copies it to `www/` and swaps the CDN three.js for the bundled copy so the app works offline.

**Get an APK without installing anything:** push to GitHub, open the **Actions** tab, open the latest *Build Android APK* run and download the `pandavas-kochi-debug-apk` artifact. Unzip it and install `app-debug.apk` on your phone (allow "install unknown apps").

**Build locally** (Node 20+, JDK 17, Android SDK):
```
npm install
npm run sync
cd android && ./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```
The app is locked to landscape, runs full screen, keeps the screen on, and the Android back button pauses the game.

## Latest additions

- **Dr. Driving-style handling:** eased steering wheel, speed-sensitive lock, automatic gears, brake lights, dash with speedo / rpm / gear.
- **5-star police:** rubber-banded cruisers, evade meter (break line of sight or hide in bushes), roadblocks and spike strips, a police helicopter at 4 stars that fires at 5.
- **Bullet time:** X or the SLOW button; the meter refills with kills.
- **Helicopter + parachute:** fly the helipad chopper on Fort Kochi beach (miniguns and rockets), land on the pad or bail out and glide down.
- **3D view:** V cycles 2D / 3D CAR / 3D ALL.
- **The Reunion campaign:** Danny's police-station breakout, Xavi's revenge on Bilal (helicopter finale), the House on the Backwater, and Pappan's cinema resignation.
- **Kochi landmarks:** Edapally junction and Lulu Mall, JLN Stadium (Kaloor), Edapally police station.
