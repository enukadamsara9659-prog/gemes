import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zoneRadius,outsideZone,clamp} from '../src/rules.js';
test('zone shrinks and stops at minimum',()=>{assert.equal(zoneRadius(0),105);assert.equal(zoneRadius(100),60);assert.equal(zoneRadius(1000),12);});
test('zone detection uses radial distance',()=>{assert.equal(outsideZone(3,4,5),false);assert.equal(outsideZone(4,4,5),true);});
test('movement bounds',()=>{assert.equal(clamp(200,-145,145),145);assert.equal(clamp(-200,-145,145),-145);});
