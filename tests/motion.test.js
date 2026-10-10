import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stepVelocity,blendWeights,followFactor} from '../src/motion.js';
import {WALK_SPEED,RUN_SPEED} from '../src/animation-state.js';
test('movement accelerates smoothly and stops quickly',()=>{
 let velocity={x:0,z:0};velocity=stepVelocity(velocity,{x:WALK_SPEED,z:0},1/60);
 assert.ok(velocity.x>0&&velocity.x<WALK_SPEED);
 for(let i=0;i<30;i++)velocity=stepVelocity(velocity,{x:WALK_SPEED,z:0},1/60);
 assert.ok(Math.abs(velocity.x-WALK_SPEED)<.01);
 for(let i=0;i<15;i++)velocity=stepVelocity(velocity,{x:0,z:0},1/60);
 assert.ok(velocity.x<.02);assert.ok(RUN_SPEED>WALK_SPEED);
});
test('blend weights stay normalized without jumping to a different clip',()=>{
 let weights={idle:1,walk:0,run:0};weights=blendWeights(weights,'walk',1/60);
 assert.ok(weights.idle>0&&weights.walk>0&&weights.walk<1);
 for(let i=0;i<60;i++){weights=blendWeights(weights,i%2?'run':'walk',1/60);assert.ok(Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-1)<1e-10);}
});
test('camera damping gives the same result at 30 and 60 fps',()=>{
 function simulate(fps){let position=0;for(let i=0;i<fps;i++)position+=(10-position)*followFactor(1/fps);return position;}
 assert.ok(Math.abs(simulate(30)-simulate(60))<1e-10);
});
