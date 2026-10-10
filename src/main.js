import * as T from 'three';
import './style.css';
import {createEnvironment} from './environment.js';
import {loadSoldier,createSoldier,animateSoldier,flashSoldier,disposeSoldier,beginReload,resetSoldierAnimation,OPERATORS} from './characters.js';
import {SQUAD_NAMES,canDamage,nearestHostile,formationOffset} from './squad-rules.js';
import {WALK_SPEED,RUN_SPEED} from './animation-state.js';
import {stepVelocity,followFactor} from './motion.js';
import {HELMETS,WEAPONS,getWeapon,loadSavedLoadout,saveLoadout} from './loadout.js';
import {enterFullscreen,exitFullscreen,fullscreenElement,viewportSize} from './screen-mode.js';
import {absorbDamage,shotDamage,accuracy,recordMatch,SCAN_COOLDOWN,SCAN_DURATION,SCAN_RANGE,HEAL_COOLDOWN} from './combat-extras.js';
import {cameraHeading,mapPoint,compassPoint} from './minimap.js';
import {castPlayerShot,castCameraAim} from './hit-detection.js';
import {safePosition,inBuilding,clearShotSegment} from './world-safety.js';
import {createArrival} from './arrival.js';
import {createPhysics} from './physics.js';
import {zoneRadius,outsideZone,clamp} from './rules.js';
const app=document.querySelector('#app'), canvas=document.querySelector('#world');
const mobile=matchMedia('(pointer:coarse)').matches;
const screenTools=document.createElement('div');screenTools.className='screen-tools';
screenTools.innerHTML='<button id="fullscreen-toggle" type="button" aria-label="Enter fullscreen" aria-pressed="false">⛶ FULL SCREEN</button><a id="open-game" target="_blank" rel="noopener">OPEN IN NEW TAB ↗</a><span id="screen-message" role="status" aria-live="polite"></span>';
document.body.append(screenTools);document.querySelector('#open-game').href=location.href;
const rotateHint=document.createElement('div');rotateHint.className='rotate-hint';rotateHint.textContent='↻ Rotate your phone for a wider view';document.body.append(rotateHint);
function syncScreen(){const active=!!fullscreenElement(document);document.querySelector('#fullscreen-toggle').textContent=active?'⛶ EXIT FULL SCREEN':'⛶ FULL SCREEN';document.querySelector('#fullscreen-toggle').setAttribute('aria-pressed',String(active));document.querySelector('#fullscreen-toggle').setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');}
let noticeTimer;
function screenNotice(text){const message=document.querySelector('#screen-message');message.textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>message.textContent='',9000);}
async function requestGameFullscreen(){const result=await enterFullscreen(document,window.screen,mobile);syncScreen();if(!result.ok)screenNotice('Fullscreen unavailable here. Open in new tab, or use your browser’s Add to Home Screen. You can still play.');return result;}
document.querySelector('#fullscreen-toggle').onclick=async()=>{if(fullscreenElement(document)){await exitFullscreen(document,window.screen);syncScreen();}else await requestGameFullscreen();};

let renderer;
try {renderer=new T.WebGLRenderer({canvas,antialias:!mobile});} catch {app.innerHTML='<h1>WebGL is required</h1><p>Please enable hardware acceleration or try a newer browser.</p>';throw new Error('WebGL unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.3:1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#adc6d1');scene.fog=new T.Fog('#adc6d1',100,320);
const camera=new T.PerspectiveCamera(58,innerWidth/innerHeight,.1,1600);
scene.add(new T.HemisphereLight(0xc8e0ff,0x777044,1.8));const sun=new T.DirectionalLight(0xffdfad,3.4);sun.position.set(-45,85,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:1,far:220});sun.shadow.bias=-.0008;sun.shadow.normalBias=.04;scene.add(sun);
const sky=new T.Mesh(new T.SphereGeometry(700,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#5283a5')},bottom:{value:new T.Color('#efd6ad')}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 v;void main(){float h=clamp(normalize(v).y*.9+.15,0.,1.);gl_FragColor=vec4(mix(bottom,top,h),1.);}'}));scene.add(sky);
const pmrem=new T.PMREMGenerator(renderer);const studio=new T.Scene();studio.background=new T.Color(0xa9c2cf);const envLight=new T.Mesh(new T.SphereGeometry(50,16,8),new T.MeshBasicMaterial({color:0xb6ced3,side:T.BackSide}));studio.add(envLight);scene.environment=pmrem.fromScene(studio,.04).texture;pmrem.dispose();envLight.geometry.dispose();envLight.material.dispose();
const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.8});
function box(x,y,z,w,h,d,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
const tex=new T.TextureLoader().load('/assets/ground.webp');tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;
const {floor,obstacles,colliders,grass}=createEnvironment(scene,tex);
const crashSites=[];for(const side of [-1,1]){let found;for(let z=-75;z<=75&&!found;z+=5)for(let x=side<0?-75:35;x<=(side<0?-35:75);x+=5){if(!obstacles.some(o=>Math.abs(x-o.x)<o.w+17&&Math.abs(z-o.z)<o.d+12)){found={x,z};break;}}crashSites.push(found||{x:side*60,z:-90});}
const physics=createPhysics(scene,obstacles);let wreckBodies=[];
const arrival=createArrival(scene,crashSites);let introActive=false;
app.innerHTML='<div class="loading"><img src="/assets/logo.svg"><h2>DROPZONE</h2><p id="load-state">PREPARING THE ISLAND…</p></div>';
try{await loadSoldier();}catch(error){document.querySelector('#load-state').textContent='Character loading failed. Refresh to retry.';throw error;}
let selection;try{selection=loadSavedLoadout(localStorage);}catch{selection={operator:'ranger',helmet:'none',weapon:'rifle'};}
let selectedOperator=selection.operator;const selectedGun=()=>getWeapon(selection.weapon);
const person=(id,team='enemy',loadout={})=>createSoldier(scene,id,team,loadout);
let player=person(selectedOperator,'squad',selection);player.position.set(8,0,8);let allies=[],teamKills=0,feed=[],touchSprint=false,velocity={x:0,z:0},cameraReady=false,hudTick=0;
let armor=50,shots=0,hits=0,headshots=0,scanCooldown=0,scanRemaining=0,healCooldown=0,scanOrigin=new T.Vector3();
let bots=[],loot=[],traces=[],playing=false,paused=false,health=100,ammo=30,kills=0,elapsed=0,yaw=0,pitch=.15,lastShot=0,reloading=0,muted=false,audio,ads=false,quality=mobile?'low':'high';
function applyQuality(value){quality=value;renderer.shadowMap.enabled=value!=='low';renderer.setPixelRatio(Math.min(devicePixelRatio,value==='high'?1.7:value==='medium'?1.2:1));grass.visible=value!=='low';}
applyQuality(quality);
function clearRound(){physics.reset();wreckBodies.forEach(physics.removeBox);wreckBodies=[];introActive=false;document.body.classList.remove('arrival-active');arrival.clear();for(const wreck of arrival.wrecks){const wi=obstacles.indexOf(wreck);if(wi>=0)obstacles.splice(wi,1);}for(const collider of arrival.colliders){collider.visible=false;const ci=colliders.indexOf(collider);if(ci>=0)colliders.splice(ci,1);}document.querySelector('#arrival-overlay')?.remove();for(const b of [...bots,...allies])disposeSoldier(b.mesh);for(const l of loot){scene.remove(l.mesh);l.mesh.geometry.dispose();l.mesh.material.dispose();}bots=[];allies=[];loot=[];feed=[];for(const t of traces){scene.remove(t.line);t.line.geometry.dispose();t.line.material.dispose();}traces=[];}
const zone=new T.Mesh(new T.CylinderGeometry(1,1,24,128,1,true),new T.MeshBasicMaterial({color:0x65f6ff,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false,fog:false}));zone.position.y=12;scene.add(zone);
const zoneEdge=new T.Mesh(new T.RingGeometry(.993,1.007,128),new T.MeshBasicMaterial({color:0xbaff66,side:T.DoubleSide,depthWrite:false,fog:false}));zoneEdge.rotation.x=-Math.PI/2;zoneEdge.position.y=.1;scene.add(zoneEdge);
function updateZone(radius){zone.visible=zoneEdge.visible=playing;zone.scale.set(radius,1,radius);zoneEdge.scale.setScalar(radius);zone.material.opacity=.26+Math.sin(elapsed*2)*.04;}
const scanRing=new T.Mesh(new T.RingGeometry(.97,1,64),new T.MeshBasicMaterial({color:0x65d8ff,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));scanRing.rotation.x=-Math.PI/2;scanRing.visible=false;scene.add(scanRing);
function useHeal(){if(introActive||!playing||paused||healCooldown>0||health>=100)return;health=Math.min(100,health+35);healCooldown=HEAL_COOLDOWN;addFeed('FIELD MEDKIT · +35 HP');sound(720);updateAbilityHUD();}
function useScan(){if(introActive||!playing||paused||scanCooldown>0)return;scanCooldown=SCAN_COOLDOWN;scanRemaining=SCAN_DURATION;scanOrigin.copy(player.position);addFeed('RECON PULSE · HOSTILES REVEALED WITHIN 45m');sound(900);updateAbilityHUD();}
function updateScanRing(){scanRing.visible=scanRemaining>0;if(!scanRing.visible)return;const progress=1-scanRemaining/SCAN_DURATION;scanRing.position.set(scanOrigin.x,.08,scanOrigin.z);scanRing.scale.setScalar(Math.max(.1,SCAN_RANGE*progress));scanRing.material.opacity=.65*(1-progress);}
function updateAbilityHUD(){const heal=document.querySelector('#heal-ability'),scan=document.querySelector('#scan-ability');if(!heal||!scan)return;heal.textContent=healCooldown>0?`✚ HEAL · ${Math.ceil(healCooldown)}s`:'✚ HEAL [H]';heal.disabled=healCooldown>0||health>=100;scan.textContent=scanCooldown>0?`◎ SCAN · ${Math.ceil(scanCooldown)}s`:'◎ SCAN [Q]';scan.disabled=scanCooldown>0;document.querySelector('#armor-status').textContent=`SHIELD ${Math.ceil(armor)}`;}

function sound(freq=.1){if(muted)return;try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='sawtooth';o.frequency.setValueAtTime(freq===.1?100:freq,audio.currentTime);g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.12);}catch{}}
function setupLoadout(){
 const refresh=()=>{
  document.querySelectorAll('[data-operator]').forEach(b=>b.classList.toggle('active',b.dataset.operator===selection.operator));
  document.querySelectorAll('[data-helmet]').forEach(b=>b.classList.toggle('active',b.dataset.helmet===selection.helmet));
  document.querySelectorAll('[data-weapon]').forEach(b=>b.classList.toggle('active',b.dataset.weapon===selection.weapon));
  const gun=selectedGun();document.querySelector('#loadout-stats').textContent=`${gun.damage} DAMAGE · ${Math.round(60/gun.interval)} RPM · ${gun.magazine} ROUNDS · ${gun.reload}s RELOAD · AMMO ∞`;
  document.querySelector('#operator-role').textContent=OPERATORS.find(o=>o.id===selectedOperator).role+' · '+HELMETS.find(h=>h.id===selection.helmet).description;
 };
 for(const field of ['operator','helmet','weapon'])document.querySelectorAll(`[data-${field}]`).forEach(button=>button.onclick=()=>{
  selection[field]=button.dataset[field];selectedOperator=selection.operator;try{saveLoadout(localStorage,selection);}catch{}
  disposeSoldier(player);player=person(selectedOperator,'squad',selection);player.position.set(8,0,8);refresh();
 });
 refresh();
}

function lobby(){zone.visible=zoneEdge.visible=false;scanRing.visible=false;document.body.classList.remove('in-match');playing=false;clearRound();player.position.set(8,0,8);app.innerHTML=`<div class="lobby"><header><a class="brand"><img src="/assets/logo.svg"> DROPZONE<span>LAST SURVIVOR</span></a><nav><b class="selected">PLAY</b><button id="guide">FIELD GUIDE</button></nav><div class="status"><i></i> SYSTEM ONLINE <span>v1.6 / TACTICAL</span></div></header><main><div class="eyebrow">01 / OPERATION VERDANT</div><h1>GEAR UP.<br>DROP <em>IN.</em></h1><p class="description">Choose your operator and weapon.<br>Your blue squad is ready to deploy.</p><div class="tags"><span>3D SURVIVAL</span><span>SQUAD VS BOTS</span><span>FREE TO PLAY</span></div><div class="operators"><span class="tiny">CHOOSE YOUR OPERATOR</span><div>${OPERATORS.map(o=>`<button class="operator ${o.id===selectedOperator?'active':''}" data-operator="${o.id}" style="--kit:#${o.color.toString(16).padStart(6,'0')}"><i></i>${o.name}</button>`).join('')}</div><p id="operator-role">${OPERATORS.find(o=>o.id===selectedOperator).role} · COSMETIC LOADOUT</p></div><div class="loadout-equipment"><div><label>02 / PRIMARY WEAPON</label><div class="loadout-options">${WEAPONS.map(w=>`<button data-weapon="${w.id}" class="equipment ${selection.weapon===w.id?'active':''}"><b>${w.name}</b><small>${w.type}</small></button>`).join('')}</div></div><p id="loadout-stats"></p></div><button class="deploy" id="deploy">ENTER MATCH <span>↗</span></button><a class="download-game" href="/downloads/DROPZONE-source.zip" download="DROPZONE-source.zip">↓ DOWNLOAD ZIP <span>SOURCE CODE · NOT APK / EXE</span></a><div class="quality"><label for="quality">GRAPHICS</label><select id="quality"><option value="low">LOW · MOBILE</option><option value="medium">BALANCED</option><option value="high">HIGH · SHADOWS</option></select></div><div class="hint">${mobile?'TOUCH CONTROLS':'WASD TO MOVE · MOUSE TO AIM'} <span>•</span> NO DOWNLOAD NEEDED</div></main><div class="side-label">VERDANT ISLAND <span>07° N / 81° E</span></div><div class="mission"><span class="tiny">ACTIVE PLAYLIST</span><h3><i></i> LAST SURVIVOR</h3><p>4-person squad <span>19 combatants</span></p><div class="mission-bottom">UNLIMITED AMMO <span>◷ ~4 MIN</span></div></div><footer><span>BUILT FOR THE LAST ONE STANDING.</span><span>PC + MOBILE <b>↗</b></span></footer></div>`;setupLoadout();document.querySelector('#quality').value=quality;document.querySelector('#quality').onchange=e=>applyQuality(e.target.value);document.querySelector('#deploy').onclick=start;document.querySelector('#guide').onclick=()=>{const d=document.createElement('div');d.className='modal';d.innerHTML=`<section><span class="tiny">FIELD GUIDE</span><h2>Survive the drop.</h2><p>Move with WASD / arrow keys. Aim with the mouse. Click to fire, right click to aim, R to reload, Shift to sprint, Esc to pause. On mobile use the left joystick, drag the right side to aim, and tap FIRE. Use AIM to zoom.</p><p>You + NOVA, REX and ECHO form the blue squad. TEAM labels and blue map diamonds identify allies; friendly fire is disabled. Squadmates follow and attack enemies. Ammo reserve is unlimited; reload each 30-round magazine. Green crates heal. H / HEAL restores 35 HP (25s cooldown). Q / SCAN reveals nearby enemies for 5s (20s cooldown). Start with 50 shield; zone damage bypasses it. Headshots deal 1.6× damage. Tap SPRINT on mobile. Defeat all 15 enemies as a squad to win. This is a local single-player prototype, not online multiplayer.</p><button class="deploy">GOT IT →</button></section>`;app.append(d);d.querySelector('button').onclick=()=>d.remove();};}
function beginArrival(){
 introActive=true;document.body.classList.add('arrival-active');document.exitPointerLock?.();
 obstacles.push(...arrival.wrecks);colliders.push(...arrival.colliders);
 const actors=[{mesh:player},...allies,...bots];
 actors.forEach((actor,i)=>{const site=arrival.sites[i<4?0:1],index=i<4?i:i-4;const p=safePosition({x:site.x+(index%4-1.5)*3,z:site.z+16+Math.floor(index/4)*3},obstacles);actor.mesh.position.set(p.x,0,p.z);});
 const overlay=document.createElement('div');overlay.id='arrival-overlay';overlay.innerHTML='<div class="arrival-title"><span>OPERATION / FALLEN STAR</span><h2 id="arrival-phase">INCOMING</h2><p>Two carriers. Two impacts. Survive the fallout.</p></div><button id="skip-arrival">SKIP INTRO →</button>';document.body.append(overlay);
 overlay.querySelector('button').onclick=finishArrival;
 arrival.start(actors,site=>{physics.burst(site,mobile?10:18);sound(55);});
}
function finishArrival(){
 if(!introActive)return;arrival.finish();introActive=false;wreckBodies=arrival.wrecks.map(w=>physics.addBox(w));for(const collider of arrival.colliders){collider.visible=true;collider.updateWorldMatrix(true,false);}
 document.body.classList.remove('arrival-active');document.querySelector('#arrival-overlay')?.remove();
 firing=false;ads=false;velocity={x:0,z:0};stick={x:0,y:0};Object.keys(keys).forEach(k=>keys[k]=false);cameraReady=false;elapsed=0;
 updateSquadHUD();addFeed('CRASH SURVIVED · MATCH LIVE');
}

function start(){armor=50;shots=0;hits=0;headshots=0;scanCooldown=0;scanRemaining=0;healCooldown=0;if(mobile&&!fullscreenElement(document))void requestGameFullscreen();document.body.classList.add('in-match');clearRound();velocity={x:0,z:0};cameraReady=false;hudTick=0;health=100;ammo=selectedGun().magazine;resetSoldierAnimation(player);Object.keys(keys).forEach(k=>keys[k]=false);lastShot=0;teamKills=0;touchSprint=false;kills=0;elapsed=0;reloading=0;yaw=0;pitch=.15;player.position.set(8,0,8);for(let i=0;i<15;i++){const a=i*2.4;const mesh=person(OPERATORS[(i+1)%OPERATORS.length].id);const spawn=safePosition({x:Math.cos(a)*(35+i*3),z:Math.sin(a)*(35+i*3)},obstacles);mesh.position.set(spawn.x,0,spawn.z);bots.push({mesh,hp:100,team:'enemy',name:`HOSTILE ${i+1}`,cd:1+Math.random()*3});}for(let i=0;i<3;i++){const mesh=person(OPERATORS[i].id,'squad');const offset=formationOffset(i,0);mesh.position.set(8+offset.x,0,8+offset.z);allies.push({mesh,hp:100,team:'squad',name:SQUAD_NAMES[i],cd:.5+i*.3,kills:0,index:i,detour:0});}for(let i=0;i<14;i++){const a=i*2.4,mesh=box(Math.sin(a)*(12+i*4),.5,Math.cos(a)*(12+i*4),.8,1,.8,0x72edb5);loot.push({mesh,med:true});}firing=false;ads=false;stick={x:0,y:0};playing=true;paused=false;app.innerHTML=`<div class="hud"><div class="hud-top"><a class="brand"><img src="/assets/logo.svg">DROPZONE</a><div class="counters"><span>ENEMIES <b id="alive">15</b></span><span>KILLS <b id="kills">0</b></span><button id="pause">Ⅱ</button><button id="mute">♫</button></div></div><div id="zone-info"></div><canvas id="map" width="150" height="150"></canvas><div id="squad-panel"></div><div id="team-labels">${allies.map((a,i)=>`<div class="team-label" id="team-label-${i}">◆ TEAM · ${a.name}<small>100 HP</small></div>`).join('')}</div><div id="kill-feed"></div><div class="map-key">◆ TEAM <span>■ ENEMY</span></div><div class="crosshair">+</div><div id="hit"></div><div class="bottom-hud"><div class="health"><span>VITALS <b id="hp">100</b></span><div><i id="hpbar"></i></div></div><div class="weapon"><span>${selectedGun().name} / ${selectedGun().type}</span><strong id="ammo">${selectedGun().magazine} <small>/ ∞</small></strong><button id="reload">RELOAD [R]</button></div></div><div class="touch"><div id="stick"><i></i></div><button id="fire">FIRE</button><button id="aim">AIM</button><button id="sprint">SPRINT</button></div><div class="abilities"><button id="heal-ability">✚ HEAL [H]</button><button id="scan-ability">◎ SCAN [Q]</button><span id="armor-status">SHIELD 50</span></div><div id="damage-number"></div><div id="message"></div></div>`;document.querySelector('#pause').onclick=togglePause;document.querySelector('#mute').onclick=()=>{muted=!muted;document.querySelector('#mute').style.opacity=muted?.4:1;};document.querySelector('#reload').onclick=reload;document.querySelector('#heal-ability').onclick=useHeal;document.querySelector('#scan-ability').onclick=useScan;setupTouch();beginArrival();updateSquadHUD();addFeed('BLUE SQUAD DEPLOYED · FRIENDLY FIRE OFF');sound(420);}
function togglePause(){if(introActive||!playing)return;paused=!paused;velocity={x:0,z:0};firing=false;ads=false;touchSprint=false;stick={x:0,y:0};Object.keys(keys).forEach(k=>keys[k]=false);if(paused){document.exitPointerLock?.();const d=document.createElement('div');d.className='modal';d.id='pause-modal';d.innerHTML='<section><span class="tiny">OPERATION ON HOLD</span><h2>Paused.</h2><button class="deploy" id="resume">RESUME →</button><button class="secondary" id="leave">RETURN TO LOBBY</button></section>';app.append(d);d.querySelector('#resume').onclick=togglePause;d.querySelector('#leave').onclick=()=>{document.exitPointerLock?.();lobby();};}else{document.querySelector('#pause-modal')?.remove();if(!mobile)lockPointer();}}
function end(win){zone.visible=zoneEdge.visible=false;scanRing.visible=false;let records;try{records=recordMatch(localStorage,win,kills);}catch{records={bestKills:kills,wins:win?1:0};}document.body.classList.remove('in-match');playing=false;document.exitPointerLock?.();app.innerHTML=`<div class="modal"><section><span class="tiny">OPERATION COMPLETE</span><h2>${win?'SQUAD VICTORY.':'ELIMINATED.'}</h2><p>${win?'Blue squad secured the island.':'Every drop is a new chance.'}</p><div class="results">${kills} YOUR KILLS · ${teamKills} TEAM <span>${Math.floor(elapsed)}s SURVIVED</span></div><div class="match-stats"><span>ACCURACY <b>${accuracy(hits,shots)}%</b></span><span>HEADSHOTS <b>${headshots}</b></span><span>BEST KILLS <b>${records.bestKills}</b></span><span>WINS <b>${records.wins}</b></span></div><button class="deploy" id="again">DROP AGAIN ↗</button><button class="secondary" id="home">RETURN TO LOBBY</button></section></div>`;document.querySelector('#again').onclick=start;document.querySelector('#home').onclick=lobby;}
function lockPointer(){try{const pending=canvas.requestPointerLock?.();pending?.catch?.(()=>{});}catch{}}
const keys={};let firing=false,stick={x:0,y:0};addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='KeyR'&&!e.repeat)reload();if(e.code==='KeyH'&&!e.repeat)useHeal();if(e.code==='KeyQ'&&!e.repeat)useScan();if(e.code==='Escape'&&playing)togglePause();});addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);firing=false;if(playing&&!paused)togglePause();});canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('mousedown',e=>{if(e.button===2){ads=true;return;}if(playing&&!paused&&!introActive){firing=true;lockPointer();}});addEventListener('mouseup',e=>{if(e.button===2)ads=false;else firing=false;});addEventListener('mousemove',e=>{if(playing&&!paused&&document.pointerLockElement===canvas){yaw-=e.movementX*.003;pitch=clamp(pitch+e.movementY*.002,-.35,.65);}});
function setupTouch(){const s=document.querySelector('#stick');let sid=null,aimid=null,prev; s.onpointerdown=e=>{sid=e.pointerId;s.setPointerCapture(sid);};s.onpointermove=e=>{if(e.pointerId!==sid)return;const r=s.getBoundingClientRect();stick.x=clamp((e.clientX-r.left-r.width/2)/40,-1,1);stick.y=clamp((e.clientY-r.top-r.height/2)/40,-1,1);s.firstChild.style.transform=`translate(${stick.x*30}px,${stick.y*30}px)`;};s.onpointerup=s.onpointercancel=()=>{sid=null;stick={x:0,y:0};s.firstChild.style.transform='';};document.querySelector('#aim').onclick=()=>{ads=!ads;document.querySelector('#aim').classList.toggle('active',ads);};document.querySelector('#sprint').onclick=()=>{touchSprint=!touchSprint;document.querySelector('#sprint').classList.toggle('active',touchSprint);};const f=document.querySelector('#fire');f.onpointerdown=e=>{e.preventDefault();f.setPointerCapture(e.pointerId);firing=true;};f.onpointerup=f.onpointercancel=()=>firing=false;canvas.onpointerdown=e=>{if(e.pointerType==='touch'&&e.clientX>innerWidth*.4){aimid=e.pointerId;prev={x:e.clientX,y:e.clientY};canvas.setPointerCapture(aimid);}};canvas.onpointermove=e=>{if(e.pointerId===aimid){yaw-=(e.clientX-prev.x)*.006;pitch=clamp(pitch+(e.clientY-prev.y)*.004,-.35,.65);prev={x:e.clientX,y:e.clientY};}};canvas.onpointerup=canvas.onpointercancel=()=>aimid=null;}
function reload(){if(introActive||!playing||paused||reloading||ammo===selectedGun().magazine)return;if(!beginReload(player))return;reloading=player.userData.reloadTime;ads=false;document.querySelector('#aim')?.classList.remove('active');sound(220);}
function move(mesh,dx,dz){const x=clamp(mesh.position.x+dx,-145,145),z=clamp(mesh.position.z+dz,-145,145);if(!obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(mesh.position.z-o.z)<o.d))mesh.position.x=x;if(!obstacles.some(o=>Math.abs(mesh.position.x-o.x)<o.w&&Math.abs(z-o.z)<o.d))mesh.position.z=z;}
const ray=new T.Raycaster();
function shoot(){
 if(ammo<=0){reload();return;}
 const shot=castPlayerShot(camera,player.userData.muzzle,bots,colliders);
 ammo--;shots++;lastShot=selectedGun().interval;flashSoldier(player);pitch=clamp(pitch-.012*selectedGun().recoil,-.35,.65);sound();
 const bot=shot.owner?bots.find(b=>b.mesh===shot.owner&&b.hp>0):null;
 if(bot){
  const headshot=shot.part==='head',amount=shotDamage(selectedGun().damage,headshot?2:1);
  hits++;if(headshot)headshots++;damageActor(bot,amount,{team:'squad',name:'YOU'});
  const number=document.querySelector('#damage-number');number.textContent=headshot?`HEADSHOT · ${amount}`:`${amount} · ${Math.ceil(bot.hp)} HP`;number.classList.toggle('headshot',headshot);
  setTimeout(()=>{if(number.isConnected)number.textContent='';},450);
  document.querySelector('#hit').textContent='×';setTimeout(()=>{const h=document.querySelector('#hit');if(h)h.textContent='';},120);
 }else if(shot.blocked){const number=document.querySelector('#damage-number');number.classList.remove('headshot');number.textContent='COVER';setTimeout(()=>{if(number.isConnected)number.textContent='';},350);}
 const line=new T.Line(new T.BufferGeometry().setFromPoints([shot.from,shot.point]),new T.LineBasicMaterial({color:0xffed9a}));scene.add(line);traces.push({line,t:.07});
}
function updateAimFeedback(){const crosshair=document.querySelector('.crosshair');if(!crosshair)return;const aim=castCameraAim(camera,bots,colliders);crosshair.classList.toggle('on-enemy',!!aim.owner);}
function addFeed(text){feed.unshift({text,expires:elapsed+7});feed=feed.slice(0,4);}
function damageActor(target,amount,attacker){
 if(target.hp<=0||!canDamage(attacker.team,target.team))return;
 if(target.player){const result=absorbDamage(health,armor,amount);armor=result.armor;target.hp=result.health;}else target.hp=Math.max(0,target.hp-amount);
 if(target.player){health=target.hp;document.querySelector('.hud')?.classList.add('damage');setTimeout(()=>document.querySelector('.hud')?.classList.remove('damage'),150);}
 if(target.hp===0&&!target.player){scene.remove(target.mesh);if(target.team==='enemy'&&attacker.team==='squad'){teamKills++;if(attacker.name==='YOU')kills++;else attacker.kills++;}addFeed(`${attacker.name} → ${target.name}${target.team==='squad'?' · TEAMMATE LOST':''}`);}
}
function clearSight(actor,target){
 actor.mesh.updateWorldMatrix(true,true);
 const muzzle=actor.mesh.userData.muzzle.getWorldPosition(new T.Vector3());
 const torso=target.mesh.position.clone().add(new T.Vector3(0,1.3,0));
 return !inBuilding(actor.mesh.position,obstacles)&&!inBuilding(target.mesh.position,obstacles)&&clearShotSegment(muzzle,torso,obstacles,colliders);
}
function tracer(actor,target){flashSoldier(actor.mesh);actor.mesh.updateWorldMatrix(true,true);const from=actor.mesh.userData.muzzle.getWorldPosition(new T.Vector3()),to=target.mesh.position.clone().add(new T.Vector3(0,1.3,0));const line=new T.Line(new T.BufferGeometry().setFromPoints([from,to]),new T.LineBasicMaterial({color:actor.team==='squad'?0x65d8ff:0xffa46d}));scene.add(line);traces.push({line,t:.09});}
function steer(actor,target,dt,speed){
 const delta=target.clone().sub(actor.mesh.position);delta.y=0;if(delta.length()<.5)return false;delta.normalize();
 const old=actor.mesh.position.clone();move(actor.mesh,delta.x*dt*speed,delta.z*dt*speed);
 if(old.distanceToSquared(actor.mesh.position)<.00001){actor.detour=(actor.detour||0)+dt;const sign=Math.floor(actor.detour/1.5)%2?1:-1;move(actor.mesh,-delta.z*sign*dt*speed,delta.x*sign*dt*speed);}else actor.detour=0;
 return old.distanceToSquared(actor.mesh.position)>.00001;
}
function updateSquadAI(dt,r){
 const you={mesh:player,hp:health,team:'squad',name:'YOU',player:true};
 for(const actor of [...allies,...bots]){
  if(actor.hp<=0)continue;
  if(inBuilding(actor.mesh.position,obstacles)){const safe=safePosition(actor.mesh.position,obstacles);actor.mesh.position.set(safe.x,0,safe.z);}
  if(outsideZone(actor.mesh.position.x,actor.mesh.position.z,r)){actor.hp=Math.max(0,actor.hp-7*dt);if(actor.hp===0){scene.remove(actor.mesh);addFeed(`${actor.name} LOST TO THE ZONE`);continue;}}
  const targets=actor.team==='squad'?bots:[you,...allies];
  const target=nearestHostile(actor,targets,actor.team==='squad'?40:45);
  const p=actor.mesh.position;let destination;
  if(outsideZone(p.x,p.z,r-4))destination=new T.Vector3();
  else if(target&&p.distanceTo(target.mesh.position)>14)destination=target.mesh.position;
  else if(actor.team==='squad'){const offset=formationOffset(actor.index,yaw);destination=player.position.clone().add(new T.Vector3(offset.x,0,offset.z));}
  else if(!target)destination=new T.Vector3(p.x+Math.sin(elapsed*.35+actor.mesh.id)*5,0,p.z+Math.cos(elapsed*.35+actor.mesh.id)*5);
  const previousPosition=p.clone();const walking=destination?steer(actor,destination,dt,actor.team==='squad'?RUN_SPEED:WALK_SPEED):false;
  const facing=(target?.mesh.position||destination)?.clone().sub(p);if(facing&&facing.lengthSq()>.01)actor.mesh.rotation.y+=Math.atan2(Math.sin(Math.atan2(-facing.x,-facing.z)-actor.mesh.rotation.y),Math.cos(Math.atan2(-facing.x,-facing.z)-actor.mesh.rotation.y))*followFactor(dt,14);
  animateSoldier(actor.mesh,dt,walking,actor.team==='squad'&&walking,{speed:p.distanceTo(previousPosition)/dt,aiming:!!target&&!walking});actor.cd-=dt;
  if(target&&actor.cd<=0&&p.distanceTo(target.mesh.position)<38&&clearSight(actor,target)){
   actor.cd=actor.team==='squad'?.9+Math.random()*.6:1.4+Math.random()*1.2;
   tracer(actor,target);damageActor(target,actor.team==='squad'?18:7,actor);
  }
 }
}
function updateSquadHUD(){
 const panel=document.querySelector('#squad-panel');if(!panel)return;updateAbilityHUD();
 panel.innerHTML=`<div class="squad-heading">◆ BLUE SQUAD <span>${1+allies.filter(a=>a.hp>0).length}/4</span></div>${allies.map(a=>`<div class="squad-row ${a.hp<=0?'lost':''}"><b>${a.name}</b><span>${a.hp<=0?'ELIMINATED':`${Math.ceil(a.hp)} HP · ${a.kills} K`}</span><div><i style="width:${Math.max(0,a.hp)}%"></i></div></div>`).join('')}<small>FRIENDLY FIRE OFF · AMMO ∞</small>`;
 feed=feed.filter(f=>f.expires>elapsed);const f=document.querySelector('#kill-feed');if(f)f.innerHTML=feed.map(f=>`<div>${f.text}</div>`).join('');
 for(const a of allies){const label=document.querySelector(`#team-label-${a.index}`);if(!label)continue;
  const world=a.mesh.position.clone().add(new T.Vector3(0,2.8,0));const ahead=world.clone().sub(camera.position).dot(camera.getWorldDirection(new T.Vector3()))>0;const point=world.project(camera);
  const visible=a.hp>0&&ahead&&point.z>=-1&&point.z<=1&&Math.abs(point.x)<.95&&Math.abs(point.y)<.94;
  label.style.display=visible?'block':'none';if(visible){label.style.left=`${(point.x*.5+.5)*innerWidth}px`;label.style.top=`${(-point.y*.5+.5)*innerHeight}px`;label.querySelector('small').textContent=`${Math.ceil(a.hp)} HP · ${Math.round(a.mesh.position.distanceTo(player.position))}m`;}
 }
}

function update(dt){scanCooldown=Math.max(0,scanCooldown-dt);healCooldown=Math.max(0,healCooldown-dt);scanRemaining=Math.max(0,scanRemaining-dt);updateScanRing();elapsed+=dt;lastShot-=dt;const r=zoneRadius(elapsed);updateZone(r);const wasReloading=reloading>0;let x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+stick.x,z=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-stick.y;const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}const sprinting=(keys.ShiftLeft||touchSprint)&&!ads&&reloading<=0;const speed=ads?2.8:sprinting?RUN_SPEED:WALK_SPEED;const oldPosition=player.position.clone();const targetVelocity={x:(Math.cos(yaw)*x-Math.sin(yaw)*z)*speed,z:(-Math.sin(yaw)*x-Math.cos(yaw)*z)*speed};velocity=stepVelocity(velocity,targetVelocity,dt);move(player,velocity.x*dt,velocity.z*dt);if(Math.abs(player.position.x-oldPosition.x)<1e-7)velocity.x=0;if(Math.abs(player.position.z-oldPosition.z)<1e-7)velocity.z=0;player.rotation.y=yaw;const actualSpeed=player.position.distanceTo(oldPosition)/dt;animateSoldier(player,dt,actualSpeed>.08,!!sprinting,{speed:actualSpeed,aiming:ads,pitch,backward:z<-.1});reloading=player.userData.reloadTime;if(wasReloading&&reloading===0)ammo=selectedGun().magazine;if(outsideZone(player.position.x,player.position.z,r))health-=7*dt;for(const l of loot){if(l.mesh.visible&&l.mesh.position.distanceTo(player.position)<2.3){l.mesh.visible=false;health=Math.min(100,health+35);addFeed('MEDKIT PICKED UP · +35 HP');sound(650);}l.mesh.rotation.y+=dt;}
updateSquadAI(dt,r);
const alive=bots.filter(b=>b.hp>0).length;document.querySelector('#alive').textContent=alive;document.querySelector('#kills').textContent=kills;document.querySelector('#hp').textContent=Math.ceil(Math.max(0,health));document.querySelector('#hpbar').style.width=health+'%';document.querySelector('#ammo').innerHTML=reloading>0?`RELOADING <small>${Math.round((1-reloading/selectedGun().reload)*100)}%</small>`:`${ammo} <small>/ ∞</small>`;document.querySelector('#zone-info').innerHTML=`<i></i> ${outsideZone(player.position.x,player.position.z,r)?'OUTSIDE ZONE — MOVE IN':'SAFE ZONE CLOSING'} <b>${Math.round(r)}m ZONE · ${Math.ceil(Math.abs(r-Math.hypot(player.position.x,player.position.z)))}m TO EDGE</b>`;hudTick-=dt;if(hudTick<=0){updateSquadHUD();hudTick=.1;}if(health<=0)end(false);else if(alive===0)end(true);}
const mapDirection=new T.Vector3();
function drawMap(r){
 const map=document.querySelector('#map');if(!map)return;
 const c=map.getContext('2d'),heading=cameraHeading(camera.getWorldDirection(mapDirection),yaw),scale=.65;
 const point=p=>mapPoint(p,player.position,heading,scale);
 c.clearRect(0,0,150,150);c.fillStyle='#17251fe8';c.fillRect(0,0,150,150);
 // Draw all world geometry with the same camera-relative projection.
 c.strokeStyle='#364b3c';c.lineWidth=1;
 for(let i=-150;i<=150;i+=25){for(const [a,b] of [[{x:i,z:-150},{x:i,z:150}],[{x:-150,z:i},{x:150,z:i}]]){const p=point(a),q=point(b);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}}
 c.strokeStyle='#697567';c.lineWidth=3;
 for(const [a,b] of [[{x:0,z:-145},{x:0,z:145}],[{x:-145,z:0},{x:145,z:0}]]){const p=point(a),q=point(b);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}
 const zoneCenter=point({x:0,z:0});c.strokeStyle='#c7ff5c';c.lineWidth=1.5;c.beginPath();c.arc(zoneCenter.x,zoneCenter.y,r*scale,0,Math.PI*2);c.stroke();
 for(const bot of bots){if(bot.hp<=0||!(bot.mesh.position.distanceTo(player.position)<18||(scanRemaining>0&&bot.mesh.position.distanceTo(scanOrigin)<=SCAN_RANGE)))continue;const p=point(bot.mesh.position);c.fillStyle=scanRemaining>0?'#ffc55b':'#ed9278';c.fillRect(p.x-2,p.y-2,4,4);}
 for(const ally of allies){if(ally.hp<=0)continue;const p=point(ally.mesh.position);c.fillStyle='#65d8ff';c.beginPath();c.moveTo(p.x,p.y-4);c.lineTo(p.x+4,p.y);c.lineTo(p.x,p.y+4);c.lineTo(p.x-4,p.y);c.closePath();c.fill();}
 // Player remains centered; arrow points along the actual camera heading.
 c.fillStyle='#c7ff5c';c.strokeStyle='#14251c';c.lineWidth=1;c.beginPath();c.moveTo(75,67);c.lineTo(81,81);c.lineTo(75,78);c.lineTo(69,81);c.closePath();c.fill();c.stroke();
 const north=compassPoint(heading);c.fillStyle='#17251f';c.beginPath();c.arc(north.x,north.y,8,0,Math.PI*2);c.fill();c.fillStyle='#e9f4dc';c.font='bold 11px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('N',north.x,north.y);
}
let previous=performance.now();const cameraTarget=new T.Vector3();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.05);previous=now;if(!document.hidden&&(introActive||(playing&&!paused)))physics.step(dt);if(introActive){const state=arrival.tick(document.hidden?0:dt,camera);const label=document.querySelector('#arrival-phase');if(label)label.textContent=state.phase;if(state.done)finishArrival();}else if(playing){camera.fov=T.MathUtils.lerp(camera.fov,ads?42:58,followFactor(dt,12));camera.updateProjectionMatrix();const distance=ads?2.4:4.4;const offset=new T.Vector3(Math.sin(yaw)*distance+Math.cos(yaw)*.65,2.65+pitch*3,Math.cos(yaw)*distance-Math.sin(yaw)*.65);const desired=player.position.clone().add(offset),look=player.position.clone().add(new T.Vector3(-Math.sin(yaw)*18,1.4-pitch*8,-Math.cos(yaw)*18));if(!cameraReady){camera.position.copy(desired);cameraTarget.copy(look);cameraReady=true;}else{camera.position.lerp(desired,followFactor(dt,22));cameraTarget.lerp(look,followFactor(dt,22));}camera.lookAt(cameraTarget);if(!paused)update(dt);}else{animateSoldier(player,dt,false);const t=now*.00007;camera.fov=58;camera.updateProjectionMatrix();player.rotation.y=0;camera.position.set(10+Math.sin(t)*.5,2.1,3);camera.lookAt(6.7,1.2,8);}for(let i=traces.length-1;i>=0;i--){traces[i].t-=dt;if(traces[i].t<=0){scene.remove(traces[i].line);traces[i].line.geometry.dispose();traces[i].line.material.dispose();traces.splice(i,1);}}if(playing&&!introActive)drawMap(zoneRadius(elapsed));scene.updateMatrixWorld(true);if(playing&&!paused&&!introActive){if(firing&&lastShot<=0&&reloading<=0)shoot();updateAimFeedback();}renderer.render(scene,camera);}
function resizeGame(){const {width,height}=viewportSize(window);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);cameraReady=false;}
addEventListener('resize',resizeGame);window.visualViewport?.addEventListener('resize',resizeGame);addEventListener('orientationchange',resizeGame);
for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{syncScreen();resizeGame();});
syncScreen();lobby();requestAnimationFrame(frame);
