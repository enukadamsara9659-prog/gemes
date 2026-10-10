export const damp = (value,target,rate,dt) => target+(value-target)*Math.exp(-rate*Math.max(0,dt));
export function stepVelocity(velocity,target,dt) {
  const rate = Math.hypot(target.x,target.z) > .01 ? 18 : 24;
  return {x:damp(velocity.x,target.x,rate,dt),z:damp(velocity.z,target.z,rate,dt)};
}
export function blendWeights(weights,state,dt) {
  const result={};let sum=0;
  for(const key of ['idle','walk','run']){result[key]=damp(weights[key]??0,key===state?1:0,14,dt);sum+=result[key];}
  for(const key of Object.keys(result))result[key]/=sum||1;
  return result;
}
export function followFactor(dt,rate=18) {return 1-Math.exp(-rate*Math.max(0,dt));}
