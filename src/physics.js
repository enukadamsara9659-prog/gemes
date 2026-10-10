import * as C from 'cannon-es';
import * as T from 'three';
export function createPhysics(scene,obstacles=[]){
 const world=new C.World({gravity:new C.Vec3(0,-9.81,0),allowSleep:true});world.broadphase=new C.SAPBroadphase(world);world.solver.iterations=8;
 const groundMaterial=new C.Material('ground'),debrisMaterial=new C.Material('debris');
 world.addContactMaterial(new C.ContactMaterial(groundMaterial,debrisMaterial,{friction:.65,restitution:.2}));
 const floor=new C.Body({mass:0,material:groundMaterial,shape:new C.Plane()});floor.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(floor);
 const fixed=[],pieces=[];
 function addBox(o,height=6){const body=new C.Body({mass:0,material:groundMaterial,shape:new C.Box(new C.Vec3(o.w,height/2,o.d))});body.position.set(o.x,height/2,o.z);world.addBody(body);fixed.push(body);return body;}
 obstacles.forEach(o=>addBox(o));
 const geometry=new T.IcosahedronGeometry(1,1),material=new T.MeshStandardMaterial({color:0x797264,roughness:.95});
 function burst(site,count=12){
  for(let i=0;i<count;i++){const radius=.2+(i%4)*.08,a=i*2.4;const body=new C.Body({mass:1.5,material:debrisMaterial,shape:new C.Sphere(radius),linearDamping:.12,angularDamping:.15,sleepTimeLimit:1});body.position.set(site.x+Math.cos(a)*9,1.5+i%3,site.z+Math.sin(a)*8);body.velocity.set(Math.cos(a)*(5+i%4),6+i%5,Math.sin(a)*(5+i%4));body.angularVelocity.set(i%3,2,i%4);world.addBody(body);const mesh=new T.Mesh(geometry,material);mesh.scale.set(radius*1.2,radius,radius);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);pieces.push({body,mesh});}
 }
 function step(dt){world.step(1/60,Math.min(.1,Math.max(0,dt)),6);for(const p of pieces){p.mesh.position.copy(p.body.position);p.mesh.quaternion.copy(p.body.quaternion);}}
 function reset(){for(const p of pieces){world.removeBody(p.body);p.mesh.removeFromParent();}pieces.length=0;}
 function removeBox(body){world.removeBody(body);const i=fixed.indexOf(body);if(i>=0)fixed.splice(i,1);}
 return {world,pieces,burst,step,reset,addBox,removeBox};
}
