import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canDamage,nearestHostile,refillMagazine,formationOffset,SQUAD_NAMES} from '../src/squad-rules.js';
const actor=(team,x,hp=100)=>({team,hp,mesh:{position:{x,z:0}}});
test('friendly fire is disabled in either direction',()=>{assert.equal(canDamage('squad','squad'),false);assert.equal(canDamage('enemy','enemy'),false);assert.equal(canDamage('squad','enemy'),true);assert.equal(canDamage('enemy','squad'),true);});
test('AI selects living enemies, never nearest ally',()=>{const you=actor('squad',0),friend=actor('squad',1),dead=actor('enemy',2,0),enemy=actor('enemy',10);assert.equal(nearestHostile(you,[friend,dead,enemy]),enemy);assert.equal(nearestHostile(you,[friend,dead,enemy],5),null);});
test('unlimited reserve refills indefinitely',()=>{for(let i=0;i<1000;i++)assert.equal(refillMagazine(),30);});
test('three unique teammates have separated rotating formation slots',()=>{assert.equal(new Set(SQUAD_NAMES).size,3);const a=formationOffset(0,0),b=formationOffset(1,0);assert.notEqual(a.x,b.x);const rotated=formationOffset(0,Math.PI/2);assert.ok(Math.abs(rotated.x-a.z)<1e-8);assert.ok(Math.abs(rotated.z+a.x)<1e-8);});
