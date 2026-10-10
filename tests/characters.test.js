import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {solveArm} from '../src/arm-ik.js';
import {OPERATORS,setSoldierTemplate,createSoldier,animateSoldier,disposeSoldier} from '../src/characters.js';
test('two bone IK reaches grip and preserves bone lengths',()=>{
 const parent=new T.Group(),upper=new T.Bone(),fore=new T.Bone(),hand=new T.Bone();parent.add(upper);upper.add(fore);fore.add(hand);fore.position.y=1;hand.position.y=1;parent.updateMatrixWorld(true);
 const target=new T.Vector3(.7,1.3,.2);solveArm(upper,fore,hand,target,new T.Vector3(1,0,0));
 assert.ok(hand.getWorldPosition(new T.Vector3()).distanceTo(target)<1e-5);assert.equal(fore.position.length(),1);assert.equal(hand.position.length(),1);
});
test('operator kits have distinct appearance configurations',()=>{
 assert.equal(new Set(OPERATORS.map(o=>o.color)).size,4);assert.equal(new Set(OPERATORS.map(o=>o.id)).size,4);assert.equal(new Set(OPERATORS.map(o=>o.helmet)).size,3);
});
test('clones own their tint material; walk/run selected explicitly; cleanup removes operator',()=>{
 const template=new T.Group();template.add(new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial()));
 setSoldierTemplate({scene:template,animations:['Idle','Run','Walk'].map(n=>new T.AnimationClip(n,1,[]))});
 const scene=new T.Scene(),a=createSoldier(scene,'ranger'),b=createSoldier(scene,'ghost');
 assert.notEqual(a.userData.visual.children[0].material,b.userData.visual.children[0].material);
 assert.notEqual(a.userData.visual.children[0].material.color.getHex(),b.userData.visual.children[0].material.color.getHex());
 animateSoldier(a,.1,true);assert.equal(a.userData.state,'walk');animateSoldier(a,.1,true,true);assert.equal(a.userData.state,'run');
 disposeSoldier(a);disposeSoldier(b);assert.equal(scene.children.length,0);
});
