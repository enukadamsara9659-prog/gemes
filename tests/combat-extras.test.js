import {test} from 'node:test';
import assert from 'node:assert/strict';
import {absorbDamage,shotDamage,accuracy,recordMatch,readRecords} from '../src/combat-extras.js';
test('shield absorbs shots before health and clamps lethal damage',()=>{assert.deepEqual(absorbDamage(100,50,30),{health:100,armor:20});assert.deepEqual(absorbDamage(100,20,30),{health:90,armor:0});assert.deepEqual(absorbDamage(10,0,50),{health:0,armor:0});});
test('headshot bonus and accuracy are predictable',()=>{assert.equal(shotDamage(34,1.7),54);assert.equal(shotDamage(34,1.2),34);assert.equal(accuracy(0,0),0);assert.equal(accuracy(3,4),75);});
test('local records update wins and best without resetting after losses',()=>{let value='{}';const storage={getItem:()=>value,setItem:(k,v)=>value=v};recordMatch(storage,true,5);recordMatch(storage,false,2);assert.deepEqual(readRecords(storage),{matches:2,wins:1,bestKills:5});assert.deepEqual(readRecords({getItem:()=>{throw Error();}}),{matches:0,wins:0,bestKills:0});});
