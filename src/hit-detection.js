import * as T from 'three';

const up = new T.Vector3(0, 1, 0);
// Invisible, low-cost proxies follow the animated skeleton, not last frame's root.
export function createHitboxes(root, bones, scale = 1) {
  const material = new T.MeshBasicMaterial({ visible: false, side: T.DoubleSide });
  const specs = bones.Head ? [
    { part: 'head', bone: 'Head', radius: .29 * scale },
    { part: 'body', from: 'Hips', to: 'Neck', radius: .26 * scale },
    ...['Left', 'Right'].flatMap(side => [
      { part: 'body', from: `${side}Arm`, to: `${side}ForeArm`, radius: .13 * scale },
      { part: 'body', from: `${side}ForeArm`, to: `${side}Hand`, radius: .11 * scale },
      { part: 'body', from: `${side}UpLeg`, to: `${side}Leg`, radius: .15 * scale },
      { part: 'body', from: `${side}Leg`, to: `${side}Foot`, radius: .13 * scale },
    ]),
  ] : [{ part: 'body', radius: .42, fallback: true }];
  return specs.filter(s => s.fallback || (s.bone ? bones[s.bone] : bones[s.from] && bones[s.to])).map(spec => {
    const geometry = spec.bone ? new T.SphereGeometry(1, 12, 8) : new T.CapsuleGeometry(1, 1, 4, 8);
    const mesh = new T.Mesh(geometry, material);
    mesh.name = `hit-${spec.part}`;
    mesh.userData = { owner: root, part: spec.part, spec };
    root.add(mesh);
    return mesh;
  });
}
export function syncHitboxes(root, bones, boxes) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const rootRotation = root.getWorldQuaternion(new T.Quaternion()).invert();
  for (const box of boxes) {
    const s = box.userData.spec;
    if (s.fallback) { box.position.set(0, 1.05, 0); box.scale.set(.42, .7, .42); }
    else if (s.bone) {
      const p = bones[s.bone].getWorldPosition(new T.Vector3()).addScaledVector(up, .1);
      box.position.copy(p.applyMatrix4(inverse));
      box.scale.setScalar(s.radius);
    } else {
      const a = bones[s.from].getWorldPosition(new T.Vector3());
      const b = bones[s.to].getWorldPosition(new T.Vector3());
      const direction = b.clone().sub(a), length = direction.length();
      box.position.copy(a.add(b).multiplyScalar(.5).applyMatrix4(inverse));
      box.quaternion.copy(rootRotation).multiply(new T.Quaternion().setFromUnitVectors(up, direction.normalize()));
      box.scale.set(s.radius, (length + 2 * s.radius) / 3, s.radius);
    }
    box.updateWorldMatrix(false, false);
  }
}
function candidates(targets, colliders) {
  const boxes = targets.filter(t => t.hp > 0 && t.team === 'enemy').flatMap(t => t.mesh.userData.hitboxes);
  const objects = [...boxes, ...colliders];
  for (const object of objects) object.updateWorldMatrix(true, false);
  return objects;
}
function result(hit) {
  return hit ? { hit, owner: hit.object.userData.owner || null, part: hit.object.userData.part || 'cover', point: hit.point } : null;
}
export function castCameraAim(camera, targets, colliders, range = 180) {
  camera.updateWorldMatrix(true, false);
  const ray = new T.Raycaster(); ray.far = range;
  ray.setFromCamera(new T.Vector2(0, 0), camera);
  const hit = ray.intersectObjects(candidates(targets, colliders), false)[0];
  return { ...result(hit), point: hit ? hit.point : ray.ray.at(range, new T.Vector3()) };
}
export function castPlayerShot(camera, muzzle, targets, colliders, range = 180) {
  const aim = castCameraAim(camera, targets, colliders, range);
  muzzle.updateWorldMatrix(true, false);
  const from = muzzle.getWorldPosition(new T.Vector3());
  const direction = aim.point.clone().sub(from), distance = direction.length();
  // Third-person camera can see around cover; the actual muzzle must be clear too.
  const ray = new T.Raycaster(from, direction.normalize(), 0, Math.min(range, distance + .02));
  const hit = ray.intersectObjects(candidates(targets, colliders), false)[0];
  const impact = result(hit);
  return { ...impact, from, point: impact?.point || aim.point, blocked: impact?.part === 'cover' };
}
