import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cameraHeading,mapPoint,compassPoint} from '../src/minimap.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
test('player is centered regardless of location or heading',()=>{const p={x:40,z:-30};assert.deepEqual(mapPoint(p,p,2),{x:75,y:75});});
test('camera-forward points stay above player for cardinal camera directions',()=>{
 for(const direction of [{x:0,z:-1},{x:1,z:0},{x:0,z:1},{x:-1,z:0}]){const center={x:20,z:30};const p=mapPoint({x:center.x+direction.x*10,z:center.z+direction.z*10},center,cameraHeading(direction));close(p.x,75);close(p.y,68.5);}
});
test('north marker rotates with the map and maintains compass radius',()=>{const north=compassPoint(-Math.PI/2);close(north.x,13);close(north.y,75);const p=compassPoint(2.3);close(Math.hypot(p.x-75,p.y-75),62);});
test('near vertical camera uses last heading instead of spinning',()=>{assert.equal(cameraHeading({x:0,z:0},1.2),1.2);});
