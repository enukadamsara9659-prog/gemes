import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createPhysics} from '../src/physics.js';
test('crash debris is gravity-driven and rests on collidable ground',()=>{
 const physics=createPhysics(new T.Scene());physics.burst({x:0,z:0},4);const body=physics.pieces[0].body;
 const initial=body.position.y;for(let i=0;i<25;i++)physics.step(1/60);assert.ok(body.position.y>initial);
 for(let i=0;i<600;i++)physics.step(1/60);assert.ok(body.position.y>.1&&body.position.y<1);assert.ok(Math.abs(body.velocity.y)<.2);
 physics.reset();assert.equal(physics.pieces.length,0);assert.equal(physics.world.bodies.length,1);
});
test('static buildings and wreck bodies are added and removed safely',()=>{const p=createPhysics(new T.Scene(),[{x:20,z:0,w:4,d:3}]);const b=p.addBox({x:0,z:0,w:15,d:10});assert.equal(p.world.bodies.length,3);p.removeBox(b);assert.equal(p.world.bodies.length,2);});
