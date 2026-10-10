import * as T from 'three';
export function inBuilding(point,obstacles){return obstacles.some(o=>Math.abs(point.x-o.x)<o.w&&Math.abs(point.z-o.z)<o.d);}
export function safePosition(point,obstacles,bound=140){
 const clamp=v=>Math.max(-bound,Math.min(bound,v));
 const original={x:clamp(point.x),z:clamp(point.z)};
 if(!inBuilding(original,obstacles))return original;
 for(let r=1;r<=280;r++)for(let i=0;i<24;i++){const a=i*Math.PI/12,p={x:clamp(original.x+Math.cos(a)*r),z:clamp(original.z+Math.sin(a)*r)};if(!inBuilding(p,obstacles))return p;}
 throw new Error('No open spawn position');
}
// Slab intersection catches rays starting INSIDE solid buildings too.
export function segmentIntersectsBuilding(from,to,o){
 let enter=0,exit=1;
 for(const [axis,half] of [['x',o.w],['z',o.d]]){
  const delta=to[axis]-from[axis],min=o[axis]-half,max=o[axis]+half;
  if(Math.abs(delta)<1e-8){if(from[axis]<min||from[axis]>max)return false;continue;}
  let a=(min-from[axis])/delta,b=(max-from[axis])/delta;if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);exit=Math.min(exit,b);if(enter>exit)return false;
 }
 return exit>=0&&enter<=1;
}
export function clearShotSegment(from,to,obstacles,colliders){
 if(obstacles.some(o=>segmentIntersectsBuilding(from,to,o)))return false;
 const distance=from.distanceTo(to);if(distance<1e-6)return true;
 for(const collider of colliders)collider.updateWorldMatrix(true,false);
 const ray=new T.Raycaster(from,to.clone().sub(from).normalize(),0,distance);
 return ray.intersectObjects(colliders,false).length===0;
}
