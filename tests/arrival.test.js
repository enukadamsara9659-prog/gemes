import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arrivalPhase,shipPose,exitProgress,ARRIVAL_DURATION} from '../src/arrival-rules.js';
test('arrival progresses through flight crash hatch exit and match',()=>{assert.equal(arrivalPhase(0),'INCOMING');assert.equal(arrivalPhase(5),'CRASH');assert.equal(arrivalPhase(7),'HATCH OPENING');assert.equal(arrivalPhase(9),'DISEMBARK');assert.equal(arrivalPhase(ARRIVAL_DURATION),'READY');});
test('ship descends to fixed wreck position without going underground',()=>{const start=shipPose(0),end=shipPose(5);assert.ok(start.y>end.y);assert.equal(end.x,0);assert.equal(end.z,0);assert.equal(end.y,2.4);assert.deepEqual(shipPose(100),end);});
test('all 19 characters complete staggered exit before match starts',()=>{assert.equal(exitProgress(8,0),0);for(let i=0;i<19;i++)assert.equal(exitProgress(ARRIVAL_DURATION,i),1);assert.ok(exitProgress(10,0)>exitProgress(10,10));});

import * as T from 'three';
import {createArrival} from '../src/arrival.js';
test('two carriers produce separate impacts and persistent wreck/crack groups',()=>{
 const original=T.TextureLoader.prototype.load;T.TextureLoader.prototype.load=()=>new T.Texture();
 try{
  const scene=new T.Scene(),arrival=createArrival(scene,[{x:-60,z:0},{x:60,z:0}]),camera=new T.PerspectiveCamera();let impacts=0;
  arrival.start([],()=>impacts++);let state;
  for(let i=0;i<32;i++)state=arrival.tick(.5,camera);
  assert.equal(state.done,true);assert.equal(impacts,2);assert.equal(arrival.wrecks.length,2);assert.equal(arrival.colliders.length,2);
  assert.notEqual(arrival.wrecks[0].x,arrival.wrecks[1].x);
  assert.equal(scene.getObjectByName('squad-carrier').visible,true);assert.equal(scene.getObjectByName('enemy-carrier').visible,true);
  arrival.clear();assert.equal(scene.getObjectByName('squad-carrier').visible,false);assert.equal(scene.getObjectByName('enemy-carrier').visible,false);
 }finally{T.TextureLoader.prototype.load=original;}
});
