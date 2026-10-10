import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {locomotion,reloadPose,RELOAD_SECONDS,WALK_SPEED,RUN_SPEED} from '../src/animation-state.js';
import {setSoldierTemplate,createSoldier,animateSoldier,beginReload,flashSoldier,resetSoldierAnimation,disposeSoldier} from '../src/characters.js';
test('locomotion matches actual speed and stops against walls',()=>{assert.equal(locomotion(0,true,false).state,'idle');assert.equal(locomotion(WALK_SPEED,false,false).playback,1);assert.equal(locomotion(RUN_SPEED,true,false).playback,1);assert.equal(locomotion(2.1,true,true).state,'walk');});
test('reload has magazine travel and settles back to its original pose',()=>{assert.equal(reloadPose(0).magazineDrop,0);assert.ok(reloadPose(.48).magazineDrop>.9);assert.equal(reloadPose(1).magazineDrop,0);assert.ok(Math.abs(reloadPose(1).lower)<1e-8);});
test('procedural reload, recoil and reset finish cleanly',()=>{
 setSoldierTemplate({scene:new T.Group(),animations:['Idle','Walk','Run'].map(name=>new T.AnimationClip(name,1,[]))});const root=createSoldier(new T.Scene());
 beginReload(root);animateSoldier(root,.6,false);assert.ok(root.userData.mag.position.y<-.18);assert.ok(root.userData.reloadProgress>0);
 animateSoldier(root,RELOAD_SECONDS,false);assert.equal(root.userData.reloadTime,0);assert.ok(Math.abs(root.userData.mag.position.y+.18)<1e-8);
 flashSoldier(root);animateSoldier(root,.01,false);assert.equal(root.userData.muzzle.visible,true);assert.ok(root.userData.recoil>0);
 animateSoldier(root,.5,false);assert.equal(root.userData.muzzle.visible,false);assert.ok(root.userData.recoil<.001);
 beginReload(root);resetSoldierAnimation(root);assert.equal(root.userData.reloadTime,0);assert.equal(root.userData.muzzle.visible,false);disposeSoldier(root);
});
