import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createHeadgear} from '../src/headgear.js';
test('headgear uses curved surfaces, not flat box accessories',()=>{
 for(const kind of ['helmet','hood','cap']){const g=createHeadgear(kind,0x526044);assert.ok(g.getObjectByName('curved-shell'));g.traverse(o=>{if(o.isMesh){assert.notEqual(o.geometry.type,'BoxGeometry');assert.ok(o.geometry.getAttribute('normal'));}});const bounds=new T.Box3().setFromObject(g);assert.ok(bounds.getSize(new T.Vector3()).length()<1.1);}
});
test('tactical helmet has padding, rim, straps, and a reflective curved visor',()=>{const g=createHeadgear('helmet',0x526044);for(const name of ['inner-liner','rubber-rim','chin-strap','curved-visor','padded-ear-cover'])assert.ok(g.getObjectByName(name));assert.ok(g.getObjectByName('curved-visor').material.roughness<.3);});
