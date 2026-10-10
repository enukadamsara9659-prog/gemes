# Asset provenance and optimization

## Ground
Source: https://github.com/mrdoob/three.js/blob/dev/examples/textures/terrain/grasslight-big.jpg
Three.js repository, MIT (see THIRD_PARTY_LICENSE.txt). Resized to 256×256 WebP with ImageMagick: 2,595,150 bytes → 13,984 bytes.

## Animated soldier
Source: https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Soldier.glb
Upstream example credits Mixamo: https://github.com/mrdoob/three.js/blob/dev/examples/webgl_animation_skinning_blending.html
This is a third-party Mixamo character included in the Three.js examples, not an original character or an asset owned by this project. Review Mixamo's current asset-use terms before commercial redistribution; do not sell this model as a standalone asset. The repository's MIT software license is not a claim that all third-party model rights are MIT.

Optimized with glTF Transform: textures resized 1024→512, WebP quality 65, animation resampling, accessor deduplication, unused node pruning. GLB 2,160,468 bytes → approximately 775 KB. Skeleton/animations preserved, shared geometry/textures across bots. No external runtime decoder/CDN needed. Removed redundant UV channels from primitives.

## Original procedural assets
Plaster WebP generated with ImageMagick noise (256×256). Building geometry, roof, windows, roads, rocks, trees, instanced grass, weapon geometry, sky shader, logo and interface created in this project. No Free Fire assets used.

## Alien carrier crash intro

Original procedural spacecraft geometry, engines, hatches and wreck collider. Two small textures downloaded via GitHub API from Three.js example assets:
- Hull carbon: https://github.com/mrdoob/three.js/blob/dev/examples/textures/carbon/Carbon.png (blob aa62a94b0191cd4b767f0cae196a3080d6fc04cf), resized/converted to 256px WebP, 764 bytes.
- Crash particle: https://github.com/mrdoob/three.js/blob/dev/examples/textures/sprite2.png (blob 344e41ce21c56d0ae340a0ff890fa1250f9a0a17), resized/converted to 128px WebP, ~3.2 KB.

Converted with ImageMagick. Source repository software license in THIRD_PARTY_LICENSE.txt; upstream third-party texture provenance/rights should be reviewed before commercial release. No externally downloaded spacecraft model is used. Ship is generated in code, while the above textures are real downloaded assets.

## Building material upgrade

Downloaded Three.js example brick textures through GitHub API and converted with ImageMagick to 512px WebP:
- https://github.com/mrdoob/three.js/blob/dev/examples/textures/brick_diffuse.jpg
- https://github.com/mrdoob/three.js/blob/dev/examples/textures/brick_bump.jpg

Used as color and bump maps on selected buildings. Upstream third-party texture rights should be reviewed before commercial redistribution. No claim these are scanned photorealistic environments.
