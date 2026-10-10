import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {blendWeights,damp} from './motion.js';
import {getWeapon} from './loadout.js';
import {createHeadgear} from './headgear.js';
import {solveArm} from './arm-ik.js';
import {locomotion,reloadPose,WALK_SPEED,RUN_SPEED} from './animation-state.js';
export const OPERATORS=[
 {id:'ranger',name:'RANGER',role:'WOODLAND / PATROL',color:0x6e9151,accent:0x253a23,helmet:'helmet',pack:true,scale:1.14},
 {id:'ghost',name:'GHOST',role:'URBAN / RECON',color:0x89a4b6,accent:0x202a35,helmet:'hood',pack:false,scale:1.1},
 {id:'nomad',name:'NOMAD',role:'DESERT / SCOUT',color:0xcc9860,accent:0x5c3528,helmet:'cap',pack:true,scale:1.17},
 {id:'viper',name:'VIPER',role:'ASSAULT / RESPONSE',color:0xbb5b4c,accent:0x382a2c,helmet:'helmet',pack:false,scale:1.12}
];
let template;
const kitMaterials=new Map();
export function setSoldierTemplate(gltf){template=gltf;}
export async function loadSoldier(){setSoldierTemplate(await new GLTFLoader().loadAsync('/assets/soldier.glb'));}
function material(color,metalness=0){const key=`${color}/${metalness}`;if(!kitMaterials.has(key))kitMaterials.set(key,new T.MeshStandardMaterial({color,roughness:metalness?.4:.85,metalness}));return kitMaterials.get(key);}
function part(parent,geometry,color,position,scale){const m=new T.Mesh(geometry,material(color));m.position.fromArray(position);if(scale)m.scale.fromArray(scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function attachment(root,bone){
 const anchor=new T.Group();root.add(anchor);anchor.userData.bone=bone;return anchor;
}
function syncAttachments(root){
 const d=root.userData;root.updateWorldMatrix(true,true);
 const inverse=root.matrixWorld.clone().invert();
 for(const a of d.attachments){if(!a.userData.bone)continue;a.matrixAutoUpdate=false;a.matrix.multiplyMatrices(inverse,a.userData.bone.matrixWorld);a.matrix.decompose(a.position,a.quaternion,new T.Vector3());a.scale.set(1,1,1);a.matrix.compose(a.position,a.quaternion,a.scale);a.updateWorldMatrix(false,true);}
}
export function createSoldier(scene,operator='ranger',team='enemy',loadout={}){
 if(!template)throw new Error('Load the soldier before creating operators');
 const kit=OPERATORS.find(k=>k.id===operator)||OPERATORS[0];
 const gun=getWeapon(loadout.weapon),helmet=loadout.helmet||kit.helmet;
 const root=new T.Group();scene.add(root);
 const visual=clone(template.scene);visual.rotation.y=0;visual.scale.setScalar(kit.scale);root.add(visual);
 const ownedMaterials=[];
 visual.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const tint=m=>{const c=m.clone();c.color.setHex(team==='squad'?0x5caaca:kit.color);ownedMaterials.push(c);return c;};o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);}});
 const mixer=new T.AnimationMixer(visual),actions={};
 for(const source of template.animations){
  const clip=source.clone();
  // IK owns arm chains; stop animation tracks resetting fingers/arms every frame.
  clip.tracks=clip.tracks.filter(t=>!/(Arm|Hand|Shoulder)/i.test(t.name));
  actions[clip.name.toLowerCase()]=mixer.clipAction(clip);
 }
 const idle=actions.idle,run=actions.run,walk=actions.walk;
 for(const [name,action] of Object.entries({idle,walk,run}))action?.setEffectiveWeight(name==='idle'?1:0).play();mixer.update(0);root.updateMatrixWorld(true);
 const bones={};visual.traverse(o=>{if(o.isBone)bones[o.name.replace(/^mixamorig:?/, '')]=o;});
 const bindPose=new Map();for(const bone of Object.values(bones))bindPose.set(bone,bone.quaternion.clone());
 const attachments=[];
 const head=attachment(root,bones.Head);attachments.push(head);
 // Convert the head bone frame back into character axes for helmet construction.
 const headgear=createHeadgear(helmet,team==='squad'?0x385969:kit.accent);
 const headFrame=root.getWorldQuaternion(new T.Quaternion()).invert().multiply(bones.Head?bones.Head.getWorldQuaternion(new T.Quaternion()):new T.Quaternion());
 headgear.quaternion.copy(headFrame.invert());headgear.scale.setScalar(kit.scale/1.14);head.add(headgear);
 ownedMaterials.push(...headgear.userData.materials);
 const chest=attachment(root,bones.Spine2);attachments.push(chest);
 part(chest,new T.BoxGeometry(.57,.46,.14),kit.accent,[0,-.05,.18]);
 for(let i=-1;i<=1;i++)part(chest,new T.BoxGeometry(.14,.18,.1),kit.color,[i*.18,-.14,.29]);
 if(kit.pack){part(chest,new T.BoxGeometry(.48,.62,.25),kit.accent,[0,-.12,-.25]);part(chest,new T.BoxGeometry(.3,.24,.1),kit.color,[0,-.17,-.43]);}
 else part(chest,new T.CylinderGeometry(.04,.04,.36,6),kit.accent,[-.27,0,-.18]);
 const weapon=new T.Group();root.add(weapon);weapon.position.set(.23,1.37,-.18);
 const metal=0x242928;
 part(weapon,new T.BoxGeometry(.12,.18,.43),metal,[0,0,0]);
 const barrel=part(weapon,new T.CylinderGeometry(.026,.026,gun.barrel,8),metal,[0,.02,-.15-gun.barrel/2]);barrel.rotation.x=Math.PI/2;
 part(weapon,new T.BoxGeometry(.13,.12,.26),kit.accent,[0,0,-.24]);
 const mag=part(weapon,new T.BoxGeometry(.09,.23,.12),metal,[0,-.18,-.04]);mag.rotation.x=-.16;
 const grip=part(weapon,new T.BoxGeometry(.07,.16,.085),metal,[0,-.15,.13]);grip.rotation.x=.2;
 part(weapon,new T.BoxGeometry(.12,.16,.27),kit.accent,[0,-.01,.31]);
 part(weapon,new T.CylinderGeometry(.035,.035,.16,8),metal,[0,.15,-.05]).rotation.x=Math.PI/2;
 if(gun.id==='marksman'){const scope=part(weapon,new T.CylinderGeometry(.055,.055,.28,12),0x334244,[0,.22,-.05]);scope.rotation.x=Math.PI/2;}
 if(gun.id==='smg'){mag.scale.set(.8,1.25,.8);}
 for(let i=0;i<5;i++)part(weapon,new T.BoxGeometry(.14,.025,.035),0x484e47,[0,.1,-.15-i*.045]);
 const bolt=part(weapon,new T.BoxGeometry(.04,.045,.09),0x88918b,[.075,.04,.02]);
 const muzzle=new T.Mesh(new T.ConeGeometry(.1,.28,6),new T.MeshBasicMaterial({color:0xffd787}));muzzle.rotation.x=-Math.PI/2;muzzle.position.set(0,.02,gun.muzzle);muzzle.visible=false;weapon.add(muzzle);
 const hitbox=new T.Mesh(new T.CapsuleGeometry(.42,1.2,4,8),new T.MeshBasicMaterial({visible:false}));hitbox.position.y=1.05;root.add(hitbox);
 root.userData={character:true,team,kit,gun,helmet,mixer,idle,run,walk,visual,bones,bindPose,attachments,weapon,mag,bolt,muzzle,hitbox,state:'idle',weights:{idle:1,walk:0,run:0},smoothSpeed:0,direction:1,flash:0,recoil:0,reloadTime:0,reloadProgress:0,time:0,gait:0,aim:0,ownedMaterials};
 animateSoldier(root,0,false);return root;
}
function poseArms(root,handBlend=0){
 const d=root.userData,b=d.bones;
 for(const name of ['RightShoulder','RightArm','RightForeArm','RightHand','LeftShoulder','LeftArm','LeftForeArm','LeftHand']){
  if(b[name])b[name].quaternion.copy(d.bindPose.get(b[name]));
 }
 root.updateWorldMatrix(true,true);
 const local=v=>root.localToWorld(new T.Vector3(...v));
 const right=d.weapon.localToWorld(new T.Vector3(0,-.13,.13));
 const left=d.weapon.localToWorld(new T.Vector3(-.09,-.06,-.02));
 const magazine=d.mag.localToWorld(new T.Vector3(-.06,.07,0));
 left.lerp(magazine,handBlend);
 solveArm(b.RightArm,b.RightForeArm,b.RightHand,right,local([.7,1.05,.06]));
 solveArm(b.LeftArm,b.LeftForeArm,b.LeftHand,left,local([-.65,1.1,-.08]));
 // Keep palms aligned to the weapon rather than letting the running clip twist them.
 for(const [name,angle] of [['RightHand',-.25],['LeftHand',.35]]){
  const hand=b[name];if(!hand)continue;
  const world=d.weapon.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().setFromEuler(new T.Euler(Math.PI/2,0,angle)));
  hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(world));
  hand.updateWorldMatrix(false,true);
 }
}
export function animateSoldier(root,dt,moving,sprinting=false,options={}){
 const d=root.userData;
 const speed=options.speed??(moving?(sprinting?RUN_SPEED:WALK_SPEED):0),aiming=!!options.aiming&&d.reloadTime<=0;
 // Keep all loops running: restarting clips at each threshold caused visible snaps.
 d.smoothSpeed=damp(d.smoothSpeed,speed,18,dt);
 const {state}=locomotion(speed,sprinting,aiming);
 d.state=state;d.weights=blendWeights(d.weights,state,dt);
 d.direction=damp(d.direction,options.backward?-1:1,18,dt);
 for(const name of ['idle','walk','run']){
  const action=d[name];if(!action)continue;
  action.setEffectiveWeight(d.weights[name]);
  const base=name==='run'?RUN_SPEED:WALK_SPEED;
  action.setEffectiveTimeScale(name==='idle'?1:d.direction*Math.max(.15,Math.min(1.7,d.smoothSpeed/base)));
 }
 const playback=d.smoothSpeed/(state==='run'?RUN_SPEED:WALK_SPEED);
 d.time+=dt;d.gait+=dt*Math.abs(playback)*(state==='run'?12:8);
 d.mixer.update(dt);d.flash=Math.max(0,d.flash-dt);d.recoil*=Math.exp(-dt*24);
 d.aim=T.MathUtils.damp(d.aim,aiming?1:0,12,dt);
 if(d.reloadTime>0){d.reloadTime=Math.max(0,d.reloadTime-dt);d.reloadProgress=1-d.reloadTime/d.gun.reload;}else d.reloadProgress=0;
 const reload=reloadPose(d.reloadProgress),travel=1-d.weights.idle;
 const bob=Math.sin(d.gait)*.004*travel*(1-d.aim*.8);
 d.weapon.position.set(.23-d.aim*.035-reload.lower*.18,1.37+d.aim*.13+bob+reload.lower*.09,-.18-d.aim*.04+d.recoil*.035);
 d.weapon.rotation.set((options.pitch??0)*.55-d.recoil*.055+reload.lower*.18,0,-reload.lower*.12);
 d.mag.position.y=-.18-reload.magazineDrop*.08;d.mag.rotation.x=-.16-reload.magazineDrop*.2;
 d.bolt.position.z=.02+d.recoil*.055;d.muzzle.visible=d.flash>0;d.muzzle.scale.setScalar(.85+d.recoil*.25);
 poseArms(root,reload.handBlend);syncAttachments(root);
}
export function flashSoldier(root){root.userData.flash=.065;root.userData.recoil=Math.min(1.5,root.userData.recoil+root.userData.gun.recoil);}
export function beginReload(root){if(root.userData.reloadTime>0)return false;root.userData.reloadTime=root.userData.gun.reload;root.userData.reloadProgress=0;root.userData.flash=0;root.userData.recoil=0;return true;}
export function resetSoldierAnimation(root){const d=root.userData;d.smoothSpeed=0;d.direction=1;d.weights={idle:1,walk:0,run:0};d.state='idle';d.flash=0;d.recoil=0;d.reloadTime=0;d.reloadProgress=0;d.aim=0;d.mag.position.y=-.18;d.muzzle.visible=false;animateSoldier(root,0,false);}
export function disposeSoldier(root){
 const d=root.userData;d.mixer.stopAllAction();d.mixer.uncacheRoot(d.visual);
 for(const m of d.ownedMaterials)m.dispose();
 for(const a of [...d.attachments,d.weapon,d.hitbox])a.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o===d.muzzle||o===d.hitbox)o.material.dispose();}});
 root.removeFromParent();
}
