import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {setSoldierTemplate,createSoldier,animateSoldier,beginReload,disposeSoldier} from '../src/characters.js';
test('actual GLB resolves sanitized bones and grips weapon during locomotion',async()=>{
 globalThis.self=globalThis;
 // Texture decoding is irrelevant to the rig test; skeleton/geometry are real.
 globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
 const bytes=readFileSync(new URL('../public/assets/soldier.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 setSoldierTemplate(gltf);
 const root=createSoldier(new T.Scene());
 for(const name of ['Head','Spine2','RightArm','RightForeArm','RightHand','LeftArm','LeftForeArm','LeftHand'])assert.ok(root.userData.bones[name],`missing ${name}`);
 assert.equal(root.userData.visual.rotation.y,0,'character faces the same direction as rifle');
 let maximum=0;
 for(let frame=0;frame<120;frame++){
  animateSoldier(root,1/60,true);
  for(const [name,offset] of [['RightHand',[0,-.13,.13]],['LeftHand',[-.09,-.06,-.02]]]){
   const hand=root.userData.bones[name].getWorldPosition(new T.Vector3());
   const grip=root.userData.weapon.localToWorld(new T.Vector3(...offset));
   maximum=Math.max(maximum,hand.distanceTo(grip));
  }
 }
 assert.ok(maximum<.09,`grip error ${maximum} metres`);
 assert.ok(root.userData.attachments.every(a=>a.userData.bone),'accessories attached to real bones');
 beginReload(root);
 assert.equal(beginReload(root),false,'cannot restart an active reload');
 for(let frame=0;frame<100;frame++){
  animateSoldier(root,1/60,true,false,{speed:3.2});
  const d=root.userData,p=d.reloadProgress;
  if(p>.22&&p<.76){
   const hand=d.bones.LeftHand.getWorldPosition(new T.Vector3());
   const magazine=d.mag.localToWorld(new T.Vector3(-.06,.07,0));
   assert.ok(hand.distanceTo(magazine)<.09,`reload grip unreachable at ${p}`);
  }
 }
 assert.equal(root.userData.reloadTime,0);
 assert.ok(Math.abs(root.userData.mag.position.y+.18)<1e-8);
 disposeSoldier(root);
});
