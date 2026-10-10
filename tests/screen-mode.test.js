import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enterFullscreen, exitFullscreen, viewportSize } from '../src/screen-mode.js';
test('fullscreen starts with a direct request and optional landscape lock',async()=>{
 let requested=false,locked=false;const doc={documentElement:{requestFullscreen:()=>{requested=true;doc.fullscreenElement={};return Promise.resolve();}}};
 const pending=enterFullscreen(doc,{orientation:{lock:async mode=>{assert.equal(mode,'landscape');locked=true;}}},true);
 assert.equal(requested,true);assert.equal((await pending).ok,true);assert.equal(locked,true);
});
test('unsupported/denied fullscreen does not reject or stop gameplay',async()=>{
 assert.equal((await enterFullscreen({documentElement:{}},{},true)).reason,'unsupported');
 assert.equal((await enterFullscreen({documentElement:{requestFullscreen:async()=>{throw Error();}}},{},true)).reason,'denied');
 assert.equal((await enterFullscreen({fullscreenElement:{},documentElement:{}},{orientation:{lock:async()=>{throw Error();}}},true)).ok,true);
});
test('prefixed fullscreen and exit with orientation unlock',async()=>{
 let unlocked=false;const doc={documentElement:{webkitRequestFullscreen:()=>{doc.webkitFullscreenElement={};}},webkitExitFullscreen:()=>{doc.webkitFullscreenElement=null;}};
 assert.equal((await enterFullscreen(doc,{},false)).ok,true);
 assert.equal((await exitFullscreen(doc,{orientation:{unlock:()=>unlocked=true}})).ok,true);assert.equal(unlocked,true);assert.equal(doc.webkitFullscreenElement,null);
});
test('canvas sizing uses layout viewport for touch alignment',()=>{assert.deepEqual(viewportSize({innerWidth:844,innerHeight:390}),{width:844,height:390});});
