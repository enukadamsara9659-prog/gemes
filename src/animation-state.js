export const RELOAD_SECONDS = 1.6;
export const WALK_SPEED = 4.6;
export const RUN_SPEED = 8.2;
export function locomotion(speed, sprinting, aiming) {
  const moving = speed > .08;
  const state = moving ? (sprinting && !aiming ? 'run' : 'walk') : 'idle';
  return {state, playback: moving ? Math.max(.15, Math.min(1.7, speed / (state === 'run' ? RUN_SPEED : WALK_SPEED))) : 1};
}
const smooth = (a,b,p) => {const t=Math.max(0,Math.min(1,(p-a)/(b-a)));return t*t*(3-2*t);};
export function reloadPose(progress) {
  const p = Math.max(0, Math.min(1, progress));
  // Reach first, remove/insert while gripping, then release and raise the rifle.
  const lower = smooth(0,.18,p) * (1-smooth(.78,1,p));
  const magazineDrop = smooth(.22,.48,p) * (1-smooth(.52,.76,p));
  const handBlend = smooth(.02,.2,p) * (1-smooth(.78,.96,p));
  return {lower, magazineDrop, handBlend};
}
