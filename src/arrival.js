import * as T from 'three';
import {arrivalPhase,shipPose,exitProgress,CRASH_TIME,ARRIVAL_DURATION} from './arrival-rules.js';
import {animateSoldier} from './characters.js';
function createCarrier(scene,site,team){
 const ship=new T.Group();ship.name=`${team}-carrier`;ship.visible=false;scene.add(ship);
 const hullTexture=new T.TextureLoader().load('/assets/ship-carbon.webp');hullTexture.wrapS=hullTexture.wrapT=T.RepeatWrapping;hullTexture.repeat.set(12,12);hullTexture.colorSpace=T.SRGBColorSpace;
 const hull=new T.MeshStandardMaterial({color:0x647379,map:hullTexture,metalness:.7,roughness:.48});
 const dark=new T.MeshStandardMaterial({color:0x172b31,metalness:.7,roughness:.4});
 const glow=new T.MeshBasicMaterial({color:team==='squad'?0x70efff:0xff6547});
 function add(geo,mat,pos,scale){const m=new T.Mesh(geo,mat);m.position.fromArray(pos);if(scale)m.scale.fromArray(scale);m.castShadow=true;ship.add(m);return m;}
 add(new T.SphereGeometry(1,40,20),hull,[0,0,0],[15,3,10]);
 add(new T.SphereGeometry(1,28,14,0,Math.PI*2,0,Math.PI/2),dark,[0,1.8,-1],[5,3,4]);
 for(const x of [-11,11]){add(new T.CylinderGeometry(2.2,2.8,2,20),dark,[x,-1,0]);const engine=add(new T.CylinderGeometry(1.8,1.8,.15,20),glow,[x,-2,0]);engine.userData.engine=true;}
 const rim=add(new T.TorusGeometry(1,.035,8,64),glow,[0,0,0],[15,10,1]);rim.rotation.x=Math.PI/2;
 for(let i=0;i<12;i++){const a=i*Math.PI/6;add(new T.SphereGeometry(.17,8,6),glow,[Math.cos(a)*14,0,Math.sin(a)*9]);}
 // Two exits separate friendly and enemy disembarkation lanes.
 const hatches=[];
 for(const x of [-5,5]){const hinge=new T.Group();hinge.position.set(x,-1,9);ship.add(hinge);const door=new T.Mesh(new T.BoxGeometry(3,.18,5),dark);door.position.z=2.5;hinge.add(door);hatches.push(hinge);}
 const effects=new T.Group();effects.visible=false;scene.add(effects);
 const particle=new T.TextureLoader().load('/assets/crash-particle.webp');
 const particles=[];for(let i=0;i<28;i++){const sprite=new T.Sprite(new T.SpriteMaterial({map:particle,color:i%3?0x8b887d:0xffb45b,transparent:true,depthWrite:false,opacity:.65}));sprite.userData.seed=i;effects.add(sprite);particles.push(sprite);}
 let time=0,active=false,entries=[],crashPlayed=false,impactCallback;
 function start(actors,onImpact){time=0;active=true;crashPlayed=false;impactCallback=onImpact;ship.visible=true;effects.visible=false;entries=actors.map((a,i)=>({actor:a,target:a.mesh.position.clone(),index:i,start:new T.Vector3(site.x,0,site.z+12)}));for(const e of entries)e.actor.mesh.visible=false;}
 function tick(dt,camera){if(!active)return {done:true};time+=dt;const pose=shipPose(time);ship.position.set(site.x+pose.x*(team==='squad'?1:-1),pose.y,site.z+pose.z);ship.rotation.set(0,0,pose.roll);
  if(time>=CRASH_TIME&&!crashPlayed){crashPlayed=true;impactCallback?.();}
  effects.visible=time>=5;effects.position.set(site.x,1,site.z);
  for(const p of particles){const age=Math.max(0,time-5),a=p.userData.seed*2.4,r=2+age*(1+p.userData.seed%3);p.position.set(Math.cos(a)*r,age*.6+(p.userData.seed%4),Math.sin(a)*r);p.scale.setScalar(2+age*.45);p.material.opacity=Math.max(0,.65-age*.045);}
  const open=Math.max(0,Math.min(1,(time-7)/2));for(const h of hatches)h.rotation.x=-open*.15;
  for(const e of entries){const progress=exitProgress(time,e.index);e.actor.mesh.visible=progress>0;if(!e.actor.mesh.visible)continue;e.actor.mesh.position.lerpVectors(e.start,e.target,progress);const delta=e.target.clone().sub(e.start);e.actor.mesh.rotation.y=Math.atan2(-delta.x,-delta.z);animateSoldier(e.actor.mesh,dt,progress<1,true,{speed:progress<1?delta.length()/3.2:0});}
  camera.fov=60;camera.updateProjectionMatrix();
  if(time<5){camera.position.set(pose.x+32,pose.y+12,pose.z+35);camera.lookAt(ship.position);}else{const move=Math.min(1,(time-5)/10);camera.position.set(26-move*6,14-move*6,38);camera.lookAt(0,3,8);if(time<5.6){camera.position.x+=Math.sin(time*75)*.22;camera.position.y+=Math.cos(time*90)*.12;}}
  if(time>=ARRIVAL_DURATION){finish();return {done:true,phase:'READY'};}return {done:false,phase:arrivalPhase(time)};
 }
 function finish(){active=false;for(const e of entries){e.actor.mesh.visible=true;e.actor.mesh.position.copy(e.target);animateSoldier(e.actor.mesh,0,false);}ship.position.set(site.x,2.4,site.z);ship.rotation.set(0,0,0);effects.visible=false;}
 function clear(){active=false;ship.visible=false;effects.visible=false;entries=[];}
 // Wreck becomes solid cover after the intro; reused between rounds.
 const wreck={x:site.x,z:site.z,w:15.8,d:10.8};
 const collider=new T.Mesh(new T.BoxGeometry(30,6,20),new T.MeshBasicMaterial({visible:false,side:T.DoubleSide}));collider.position.set(site.x,3,site.z);collider.visible=false;scene.add(collider);
 return {start,tick,finish,clear,wreck,collider,ship};
}

function groundImpact(scene,site){
 const group=new T.Group();group.position.set(site.x,.12,site.z);group.visible=false;scene.add(group);
 const vertices=[];
 for(let branch=0;branch<14;branch++){
  const angle=branch*Math.PI*2/14;let x=Math.cos(angle)*5,z=Math.sin(angle)*5;
  for(let j=0;j<5;j++){const a=angle+Math.sin(branch*5+j)*.19,nx=x+Math.cos(a)*2.6,nz=z+Math.sin(a)*2.6,width=.12+(5-j)*.065;vertices.push(x,0,z-width,nx,0,nz-width,nx,0,nz+width,x,0,z-width,nx,0,nz+width,x,0,z+width);x=nx;z=nz;}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
 group.add(new T.Mesh(geo,new T.MeshBasicMaterial({color:0x211916,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1})));
 const shock=new T.Mesh(new T.RingGeometry(.96,1,64),new T.MeshBasicMaterial({color:0xbba27b,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));shock.rotation.x=-Math.PI/2;shock.position.y=.02;group.add(shock);
 return {group,update(age){group.visible=age>=0;if(age<0)return;group.scale.setScalar(Math.min(1,Math.max(.03,age*2)));shock.visible=age<2;shock.scale.setScalar(3+age*15);shock.material.opacity=Math.max(0,.7-age*.35);}};
}
export function createArrival(scene,sites){
 const friendly=createCarrier(scene,sites[0],'squad'),enemy=createCarrier(scene,sites[1],'enemy');
 const impacts=sites.map(site=>groundImpact(scene,site));let time=0,active=false,enemyStarted=false,actors=[],callback;
 function start(entries,onImpact){actors=entries;time=0;active=true;enemyStarted=false;callback=onImpact;friendly.start(entries.slice(0,4),()=>callback?.(sites[0]));enemy.clear();impacts.forEach(i=>i.group.visible=false);}
 function finish(){if(!enemyStarted){enemy.start(actors.slice(4),()=>{});enemyStarted=true;}friendly.finish();enemy.finish();active=false;impacts.forEach(i=>i.update(3));}
 function tick(dt,camera){if(!active)return {done:true};time+=dt;friendly.tick(dt,camera);if(time>=1&&!enemyStarted){enemy.start(actors.slice(4),()=>callback?.(sites[1]));enemyStarted=true;}if(enemyStarted)enemy.tick(dt,camera);
  impacts[0].update(time-5);impacts[1].update(time-6);
  const midpoint=new T.Vector3((sites[0].x+sites[1].x)/2,3,(sites[0].z+sites[1].z)/2);
  if(time<5){const p=friendly.ship.position.clone().lerp(enemyStarted?enemy.ship.position:friendly.ship.position,.5);camera.position.copy(p).add(new T.Vector3(45,24,65));camera.lookAt(p);}else{camera.position.copy(midpoint).add(new T.Vector3(40,26,65));camera.lookAt(midpoint);const age=Math.min(Math.abs(time-5),Math.abs(time-6));if(age<.7){const force=(1-age/.7)*.7;camera.position.x+=Math.sin(time*70)*force;camera.position.y+=Math.cos(time*85)*force;}}
  camera.fov=65;camera.updateProjectionMatrix();if(time>=16){finish();return {done:true,phase:'READY'};}return {done:false,phase:time<5?'TWO CARRIERS INCOMING':time<7?'DOUBLE IMPACT':time<9?'HATCHES OPENING':'SQUADS DISEMBARKING'};
 }
 function clear(){active=false;actors=[];friendly.clear();enemy.clear();impacts.forEach(i=>i.group.visible=false);}
 return {start,tick,finish,clear,sites,wrecks:[friendly.wreck,enemy.wreck],colliders:[friendly.collider,enemy.collider]};
}
