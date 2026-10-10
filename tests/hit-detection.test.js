import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {castPlayerShot,castCameraAim,createHitboxes,syncHitboxes} from '../src/hit-detection.js';
import {setSoldierTemplate,createSoldier,animateSoldier,disposeSoldier} from '../src/characters.js';
function fixture(){
 const scene=new T.Scene(),mesh=new T.Group();scene.add(mesh);mesh.position.z=-12;
 const hitboxes=createHitboxes(mesh,{});mesh.userData.hitboxes=hitboxes;syncHitboxes(mesh,{},hitboxes);
 const target={mesh,hp:100,team:'enemy'},muzzle=new T.Object3D();muzzle.position.set(.23,1.37,-.18);scene.add(muzzle);
 const camera=new T.PerspectiveCamera(58,1,.1,300);camera.position.set(.65,2.65,4.4);camera.lookAt(0,1.2,-12);
 return {scene,target,muzzle,camera};
}
test('crosshair and muzzle hit moved targets without needing a render',()=>{
 const {scene,target,muzzle,camera}=fixture();
 assert.equal(castPlayerShot(camera,muzzle,[target],[]).owner,target.mesh);
 target.mesh.position.x=6;camera.position.x=3;camera.lookAt(6,1.2,-12);
 assert.equal(castCameraAim(camera,[target],[]).owner,target.mesh);
 assert.equal(castPlayerShot(camera,muzzle,[target],[]).owner,target.mesh);
 scene.clear();
});
test('wall between shooter and target blocks damage and tracer',()=>{
 const {scene,target,muzzle,camera}=fixture();const wall=new T.Mesh(new T.BoxGeometry(4,4,.5),new T.MeshBasicMaterial());wall.position.set(0,2,-6);scene.add(wall);
 const shot=castPlayerShot(camera,muzzle,[target],[wall]);assert.equal(shot.owner,null);assert.equal(shot.blocked,true);assert.ok(shot.point.z>-7);
});
test('dead and friendly targets are never damaged',()=>{
 const {target,muzzle,camera}=fixture();target.hp=0;assert.equal(castPlayerShot(camera,muzzle,[target],[]).owner,undefined);
 target.hp=100;target.team='squad';assert.equal(castPlayerShot(camera,muzzle,[target],[]).owner,undefined);
});
test('actual animated GLB body/head hitboxes follow walking, running and turning',async()=>{
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
 const b=readFileSync(new URL('../public/assets/soldier.glb',import.meta.url));setSoldierTemplate(await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''));
 const scene=new T.Scene(),mesh=createSoldier(scene),target={mesh,hp:100,team:'enemy'};mesh.position.set(3,0,-20);
 const camera=new T.PerspectiveCamera(58,1,.1,300),muzzle=new T.Object3D();scene.add(muzzle);
 for(let i=0;i<90;i++){
  mesh.position.x+=.01;mesh.rotation.y=i*.03;animateSoldier(mesh,1/60,true,i>45);
  for(const part of ['head','body']){
   const box=mesh.userData.hitboxes.find(b=>b.userData.part===part);const center=box.getWorldPosition(new T.Vector3());
   camera.position.copy(center).add(new T.Vector3(.6,.5,12));camera.lookAt(center);muzzle.position.copy(center).add(new T.Vector3(.1,-.05,10));
   const aim=castCameraAim(camera,[target],[]);assert.equal(aim.owner,mesh,`missed ${part} frame ${i}`);
   assert.equal(castPlayerShot(camera,muzzle,[target],[]).owner,mesh);
  }
 }
 disposeSoldier(mesh);
});
