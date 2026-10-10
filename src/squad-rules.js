export const MAGAZINE_SIZE = 30;
export const SQUAD_NAMES = ['NOVA', 'REX', 'ECHO'];
export function canDamage(attackerTeam, targetTeam) {
  return attackerTeam !== targetTeam;
}
export function refillMagazine() { return MAGAZINE_SIZE; }
export function nearestHostile(actor, candidates, maxRange = Infinity) {
  let result = null, best = maxRange * maxRange;
  for (const candidate of candidates) {
    if (candidate.hp <= 0 || !canDamage(actor.team, candidate.team)) continue;
    const a = actor.mesh.position, b = candidate.mesh.position;
    const distance = (a.x-b.x)**2 + (a.z-b.z)**2;
    if (distance < best) { result = candidate; best = distance; }
  }
  return result;
}
export function formationOffset(index, yaw) {
  const offsets = [[-3,3],[3,3],[0,6]];
  const [x,z] = offsets[index % offsets.length];
  return {x:Math.cos(yaw)*x+Math.sin(yaw)*z,z:-Math.sin(yaw)*x+Math.cos(yaw)*z};
}
