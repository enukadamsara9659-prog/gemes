import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {WEAPONS,normalizeLoadout,loadSavedLoadout,saveLoadout} from '../src/loadout.js';
import {setSoldierTemplate,createSoldier,beginReload,animateSoldier,disposeSoldier} from '../src/characters.js';
test('invalid saved choices normalize and valid loadout persists',()=>{
 let saved='broken';const storage={getItem:()=>saved,setItem:(key,value)=>saved=value};
 assert.equal(loadSavedLoadout(storage).weapon,'rifle');
 saveLoadout(storage,{operator:'ghost',helmet:'cap',weapon:'smg'});
 assert.deepEqual(loadSavedLoadout(storage),{operator:'ghost',helmet:'cap',weapon:'smg'});
 assert.equal(normalizeLoadout({weapon:'unknown'}).weapon,'rifle');
});
test('selected equipment creates correct helmet, barrel and reload duration',()=>{
 setSoldierTemplate({scene:new T.Group(),animations:['Idle','Walk','Run'].map(name=>new T.AnimationClip(name,1,[]))});
 for(const gun of WEAPONS){const root=createSoldier(new T.Scene(),'ranger','squad',{helmet:'cap',weapon:gun.id});assert.equal(root.userData.helmet,'cap');assert.ok(root.getObjectByName('headgear-cap'));assert.equal(root.userData.muzzle.position.z,gun.muzzle);beginReload(root);assert.equal(root.userData.reloadTime,gun.reload);animateSoldier(root,gun.reload,false);assert.equal(root.userData.reloadTime,0);disposeSoldier(root);}
 assert.equal(new Set(WEAPONS.map(w=>w.magazine)).size,3);
});
