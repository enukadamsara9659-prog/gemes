# DROPZONE — Last Survivor

Lightweight original browser-based 3D survival shooter for desktop and mobile. Single-player prototype with 15 bots; not a Free Fire clone or online multiplayer service.

## Run

```sh
npm install
npm run dev
```

Open the server URL. `npm run build` creates a static site in `dist`. `npm test` checks zone and movement rules. Node 20.19+ or 22.12+ recommended.

## Controls

- Desktop: WASD/arrows move, mouse aim, click fire, Shift sprint, R reload, Esc pause.
- Mobile: left joystick moves, drag the right side of the scene to aim, FIRE and RELOAD buttons.
- Pick up gold crates for ammo and green crates for health. Stay inside the shrinking green zone. Defeat/outlast 15 bots.

## Small assets

Original SVG emblem: 224 bytes. Low-poly buildings, trees, characters and weapons are generated in code, no large model downloads. The ground texture was obtained from the Three.js GitHub repository and converted with ImageMagick from a 2,595,150-byte JPEG to a ~14 KB 256×256 WebP (over 99% smaller). Runtime requires no external CDN or font host. The production JS is ~127 KB gzip.

Source: https://github.com/mrdoob/three.js/blob/dev/examples/textures/terrain/grasslight-big.jpg
Three.js copyright © 2010–2026 Three.js authors, MIT license; see THIRD_PARTY_LICENSE.txt. Original game UI/emblem and procedural geometry created for this project. No proprietary Free Fire assets used.

## Scope and verification

Animated in-engine island lobby serves as the intro. Includes sound effects/mute, health, ammo/reload, loot, mini-map, zone damage, bot patrol/attacks, win/loss screen, pause and replay. Basic low-poly graphics intentionally trade detail for small downloads. Mobile performance depends on WebGL support and device; no native APK, accounts, matchmaking, network multiplayer, or production anti-cheat.

Production build and three rule tests pass. Browser automation could not run because the sandbox cannot download Playwright Chromium from its CDN; real device/browser testing is still needed.

## v1.1 visual update

Replaced block people with a textured, skinned soldier and idle/run animations. Added terrain outskirts, sea plane, gradient sky, warm tone-mapped sunlight, PC soft shadows, textured plaster buildings with roofs/windows/chimneys, fuller trees, rocks, road markings and instanced grass. Closer over-shoulder camera, muzzle flashes, recoil and aim zoom (right mouse / mobile AIM). Lobby now uses a close cinematic soldier view. LOW / BALANCED / HIGH graphics selector: LOW disables shadows/grass and caps resolution for mobile.

Model asset ~775 KB after optimization, production JS ~161 KB gzip. See ASSETS.md for sources and third-party model rights. This is improved stylized 3D, **not photorealistic or a completed multiplayer game**. The v1.1 build and rule tests pass; browser launch attempted using npm-packaged Chromium but blocked by missing sandbox system library libnspr4.so, so visual/device verification remains outstanding.

## v1.2 operator/rig corrections

Four selectable cosmetic kits (Ranger, Ghost, Nomad, Viper), independently tinted materials, head-bone helmet/hood/cap attachments, chest armor/pouches and backpack variations. Bots rotate through these kits. These are **variants of the same base mesh**, not four independently modeled people. Rifle hands use two-bone IK grip targets after skeletal animation, walk/run selected by name with crossfades, bullet tracers originate at the muzzle. Operator-owned materials/accessories are disposed between rounds. Character/IK unit tests added. Browser visual validation is still unavailable in this sandbox; rig placement should be checked in the live preview before treating it as final.

## v1.3 friendly squad

Player + three AI teammates (NOVA, REX, ECHO) against 15 enemies. Friendly characters have blue-tinted outfits, projected TEAM/name/health labels and blue diamond mini-map markers. Squad HUD tracks health, casualties and teammate kills. Friendlies follow a rotating formation, steer around obstacles and engage enemies; enemies target the nearest living squad member. Same-team damage is rejected. Enemy elimination by teammates counts toward squad victory/team kills, not player kills. Zone affects all combatants; player death still ends the round (no spectate/revive).

Ammo reserve is now unlimited (∞), retaining 30-round magazines and 1.6s reload/auto-reload. All loot crates heal since ammo pickups are unnecessary. Added short kill/event feed and mobile SPRINT toggle. Squad is local AI, not online co-op. Squad logic unit tests cover team damage, target selection, repeat reloads and formation rotation; browser/device behavior still needs live-preview verification.

## v1.4 movement and weapon animation

Movement now uses 3.2 m/s walk / 6.4 m/s sprint (2.1 m/s aimed movement) instead of sliding at 8/12 m/s. Animation playback is driven by actual displacement, so blocked characters stop stepping. Backward player movement reverses the gait. AI uses the same movement speed references. Aim/reload disables sprint.

Arm animation tracks are separated from locomotion; IK controls grip positions, wrist alignment, and reload support-hand movement. Added smooth ADS weapon raise, speed-linked bob, damped recoil, animated bolt/muzzle flash, and procedural magazine remove/insert/return over the same 1.6-second gameplay reload timer. Reload progress appears in the ammo HUD. These are procedural overlays on the existing walking/running clips, not new motion-captured combat clips. No new large assets.

Build passes and 13 unit tests pass (including locomotion timing, reload end state, recoil/reset). Preview server responds HTTP 200. Visual/browser validation of rig and wrist placement is not completed: this sandbox lacks the Chromium system libraries noted above. Verify walking, backward movement, wall stop, aim, sustained fire and R reload in the live preview.

## Screenshot-reported T-pose fix

GLTFLoader strips ':' from node names (`mixamorig:RightArm` becomes `mixamorigRightArm`). The previous lookup only split on ':', leaving all IK and accessory bone references undefined. Corrected prefix normalization and the extra 180° visual rotation, which also made the soldier face away from its rifle. Shortened/repositioned support-hand targets to fit the actual arm reach. Added a regression test loading the real GLB (only image decoding stubbed) and checking bone resolution, accessory attachment and grip distances over 120 walking frames. All 14 tests and production build pass. This checks the real rig numerically, not browser-rendered visual quality.

## Reload correction

Reload now uses one authoritative character timer for animation/HUD/ammo refill, ignores repeated R keydown events, clears aim/recoil on start, and cannot restart while active. Support-hand target follows the magazine's actual transform instead of an unrelated inverse-Y formula. Staged smooth reach → remove/insert → return motion uses a centered, raised rifle and shorter magazine travel so the actual rig can reach it. Extended real-GLB regression to 100 reload frames with magazine-hand reach and finished-state checks. All 14 tests/build pass; browser visual verification remains outstanding.

## Movement smoothness adjustment

Walk speed increased 3.2→4.6 m/s, sprint 6.4→8.2 m/s, aimed movement 2.1→2.8 m/s. Added short acceleration/deceleration with blocked-axis velocity clearing. All locomotion loops now remain active with normalized damped blend weights instead of resetting clips on every state change; playback speed and backward direction are smoothed. Reduced weapon bob and smoothed camera follow/FOV and AI turns using time-based damping. Squad/map DOM updates reduced to 10 Hz. Tests cover acceleration, blend continuity and camera damping at 30/60 fps; 17 tests/build pass, preview HTTP 200. Visual/device validation remains outstanding.

## Curved helmet replacement

Replaced box headgear with procedural curved shell/inner liner, rubber edge, padded ear cups, accessory rails/bolts, chin straps and curved reflective visor; cap has a curved bill. Headgear construction uses character axes corrected against the actual head-bone frame, and owned materials are disposed with the operator. No new downloaded asset. Geometry/material tests and existing real-rig tests pass (19 tests); preview responds HTTP 200. This is a more detailed procedural helmet, not a photorealistic scanned asset. Browser visual fit verification remains outstanding.

## Pre-match loadout

Lobby supports independent operator, helmet and primary weapon selections with immediate 3D character updates and localStorage persistence (safe fallback when unavailable). ENTER MATCH deploys the selected player equipment. Three procedural weapon variants: AR–01 (30 rounds / 34 damage), VX–9 SMG (40 / 22), MR–7 marksman (12 / 70), each with distinct barrel/scope geometry, firing interval, recoil and reload duration. Unlimited ammo reserve retained. Match HUD, reload timer and magazine refill use selected weapon values. Headgear remains cosmetic; these are not new independent character assets. Loadout persistence/equipment tests added; build and 21 tests pass. Browser visual/device validation remains outstanding.

## Download ZIP from the game

Use **DOWNLOAD ZIP** under ENTER MATCH in the lobby to download `DROPZONE-source.zip` directly. This is a binary ZIP source archive, not an APK/EXE or a text document. Extract it, install Node 22.12+, then run `npm install` and `npm run dev` inside the extracted DROPZONE folder.

The archive is automatically refreshed by `predev` / `prebuild` (`npm run package:download` manually). Generated downloads are ignored by Git and exclude themselves, node_modules, build output and hidden files; code/assets/package lock/packaging scripts are included. Vite dev/preview serves the ZIP with application/zip and attachment headers; static deployments copy it from public/downloads and use the browser download attribute.
