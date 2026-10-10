import {Vector3,Quaternion} from 'three';
const position = bone => bone.getWorldPosition(new Vector3());
function pointBone(bone,child,target){
  const start=position(bone),from=position(child).sub(start).normalize(),to=target.clone().sub(start).normalize();
  const delta=new Quaternion().setFromUnitVectors(from,to);
  const world=delta.multiply(bone.getWorldQuaternion(new Quaternion()));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new Quaternion()).invert().multiply(world));
  bone.updateWorldMatrix(false,true);
}
export function solveArm(upper,forearm,hand,target,pole){
  if(!upper||!forearm||!hand)return;
  const s=position(upper),e=position(forearm),w=position(hand);
  const a=e.distanceTo(s),b=w.distanceTo(e),raw=target.clone().sub(s),length=raw.length();
  if(a<1e-7||b<1e-7||length<1e-7)return;
  const d=Math.max(Math.abs(a-b)+1e-5,Math.min(a+b-1e-5,length)),dir=raw.divideScalar(length);
  const bend=pole.clone().sub(s);bend.addScaledVector(dir,-bend.dot(dir));
  if(bend.lengthSq()<1e-8){bend.copy(e).sub(s);bend.addScaledVector(dir,-bend.dot(dir));}
  if(bend.lengthSq()<1e-8){bend.set(0,1,0);if(Math.abs(dir.y)>.99)bend.set(1,0,0);bend.addScaledVector(dir,-bend.dot(dir));}
  bend.normalize();const cos=Math.max(-1,Math.min(1,(a*a+d*d-b*b)/(2*a*d)));
  const elbow=s.clone().addScaledVector(dir,a*cos).addScaledVector(bend,a*Math.sqrt(1-cos*cos));
  const wrist=s.clone().addScaledVector(dir,d);
  pointBone(upper,forearm,elbow);pointBone(forearm,hand,wrist);
}
