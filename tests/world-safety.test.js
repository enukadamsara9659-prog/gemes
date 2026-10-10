import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {inBuilding,safePosition,segmentIntersectsBuilding,clearShotSegment} from '../src/world-safety.js';
const buildings=[{x:10,z:5,w:4,d:4}];
test('spawns inside houses relocate outside padded footprint',()=>{const p=safePosition({x:10,z:5},buildings);assert.equal(inBuilding(p,buildings),false);assert.deepEqual(safePosition({x:0,z:0},buildings),{x:0,z:0});});
test('building blocks rays through walls and rays originating inside',()=>{assert.equal(segmentIntersectsBuilding({x:0,z:5},{x:20,z:5},buildings[0]),true);assert.equal(segmentIntersectsBuilding({x:10,z:5},{x:0,z:5},buildings[0]),true);assert.equal(segmentIntersectsBuilding({x:0,z:0},{x:20,z:0},buildings[0]),false);});
test('AI muzzle shots honor building footprints and fresh mesh transforms',()=>{assert.equal(clearShotSegment(new T.Vector3(0,1.3,5),new T.Vector3(20,1.3,5),buildings,[]),false);const wall=new T.Mesh(new T.BoxGeometry(2,3,2),new T.MeshBasicMaterial());wall.position.set(0,1.5,5);assert.equal(clearShotSegment(new T.Vector3(0,1.3,0),new T.Vector3(0,1.3,10),[],[wall]),false);wall.position.x=20;assert.equal(clearShotSegment(new T.Vector3(0,1.3,0),new T.Vector3(0,1.3,10),[],[wall]),true);});
