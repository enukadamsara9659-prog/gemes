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

## Mobile/desktop fullscreen

FULL SCREEN / EXIT FULL SCREEN controls remain available in lobby and match. Mobile ENTER MATCH requests page fullscreen directly from the tap and attempts landscape orientation locking when supported. Canvas resizes on fullscreen, viewport and orientation changes; HUD/touch controls account for notch/home-indicator safe areas and short landscape screens. Portrait play remains possible with a non-blocking rotation hint.

Fullscreen/rotation permissions depend on the browser and embedding iframe. Unsupported/denied requests show a non-blocking message with OPEN IN NEW TAB in the lobby. On iPhones without page fullscreen support, Safari Add to Home Screen can use standalone mode (Apple standalone meta tags included); this is not an offline PWA. Desktop keyboard/mouse and existing mobile controls are retained. API fallback tests pass; real Android/iPhone fullscreen/layout testing remains necessary.

## Tactical extras

Start with 50 armor: enemy bullets drain armor before health, while zone damage bypasses armor. H / HEAL restores 35 HP on a 25-second cooldown. Q / SCAN reveals enemies within 45m of the activation point for 5 seconds (20-second cooldown), with expanding ground pulse. Without scan only enemies within 18m appear on the mini-map. Both abilities have visible mobile/desktop buttons and cooldowns; they pause with the match. Head-height capsule hits award 1.6× damage and hit feedback (approximate headshots, not per-triangle head hitboxes). Results show accuracy, headshots and locally saved wins/best kills; storage unavailable falls back safely. No online leaderboard. Build and 29 tests pass; device visual checks still required.

## Camera-relative mini-map

Mini-map is player-centered and rotates using the actual smoothed camera's horizontal heading, not just mouse yaw. Grid, road axes, zone boundary and squad/enemy markers share the same transform; a centered arrow shows camera-forward and a rotating N marker indicates world north. Drawn each animation frame for smooth turning while other squad HUD stays throttled. Cardinal-heading/centering/compass tests added; 33 tests and build pass. Browser visual verification still required.

## Player hit-detection correction

Player shot queries now explicitly refresh camera/collider world matrices before raycasting and run after movement/animation updates. Replaced the single static root capsule with bone-following head, torso and limb proxies; headshot damage uses the actual head proxy. A camera-centered aim query determines the target point, then a muzzle-to-point query checks physical cover so tracer endpoints and damage agree. Dead actors/friendlies are excluded. Crosshair turns red over enemies; confirmed hits show damage/remaining HP, cover impacts display COVER. Added stale-transform, wall, friendly/dead and real-GLB 90-frame walking/running/turning raycast tests. 37 tests/build pass; real browser gameplay verification remains needed.

## Zone visibility / AI house safety

Zone now uses a tall cyan translucent boundary (24m), bright green ground ring and fog-independent materials, plus HUD distance to edge. Enemy spawn positions are checked against padded building footprints and relocated to open ground; any AI found embedded in a house is recovered outside. AI fire checks the actual muzzle-to-target segment with refreshed collider transforms and conservative solid-building slab tests, including origins inside walls. Friendly AI uses the same cover checks. Buildings remain solid non-enterable shells, not playable interiors. 40 tests/build pass; browser/device checks remain needed.

## Fallen Star arrival intro

ENTER MATCH plays a 15-second in-engine alien carrier arrival: descent → crash/dust → hatch opening → all 19 combatants disembark from two lanes → squad match. Player input, damage/zone/ability timers and firing are gated until the intro finishes; SKIP INTRO immediately finishes placement on PC/mobile. Crash wreck remains solid cover; round cleanup reuses/hides it. Characters use existing run animations. Ship geometry is procedural; downloaded/compressed hull and particle texture assets add ~4 KB (see ASSETS.md), not a downloaded photoreal ship model. This is a scripted cinematic, not physical spacecraft destruction. Timeline tests/build pass; browser visual validation remains needed.

## Two-carrier crash update

Separate blue-lit squad and orange-lit enemy carriers arrive from opposing directions and crash one second apart. Two clear crash sites are chosen outside building footprints. Four friendlies exit their own carrier; fifteen enemies exit theirs. Each impact creates persistent radial ground-crack geometry, rising/falling rock fragments, expanding dust shockwave, particles and brief camera shake. Both wrecks remain solid cover and are cleaned up/reset between rounds. Intro now lasts 16 seconds; skip settles both wrecks and actors. Ground cracking is a visual overlay, not terrain physics deformation. Two-impact lifecycle regression added; 44 tests/build pass; rendered device verification still needed.

## Rigid-body physics / materials upgrade

Added cannon-es rigid-body simulation with gravity, friction, restitution, sleeping bodies and fixed 60Hz steps. Crash debris now bounces, collides with the ground/building boxes and settles; removed the old animated rock-fragment effect. Both wrecks gain static physics bodies after intro; player/AI movement still uses footprint collision, not a physics character controller. Ship descent and ground cracks remain scripted (no terrain deformation, ragdolls or vehicle simulation). Mobile caps debris count. Physics pauses with the match and resets each round.

Downloaded/optimized 512px brick color/bump textures for selected buildings, added simple generated environment reflection lighting and smoother tree/rock geometry. No new character/ship model downloads or photorealistic HDR environment. This remains stylized browser graphics, not full realistic AAA quality. 46 tests/build pass, including debris fall/rest/reset; real mobile/desktop rendered performance testing is still needed.
