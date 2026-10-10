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
