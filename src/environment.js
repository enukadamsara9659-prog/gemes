import * as T from 'three';
export function createEnvironment(scene, groundTexture) {
  const colliders=[], obstacles=[], materials=new Map();
  function material(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.85}));return materials.get(color);}
  function mesh(geometry,color,x,y,z,parent=scene){const m=new T.Mesh(geometry,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function block(x,y,z,w,h,d,c,parent=scene){return mesh(new T.BoxGeometry(w,h,d),c,x,y,z,parent);}
  const geo=new T.PlaneGeometry(600,600,90,90);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),r=Math.hypot(x,z);pos.setY(i,r>150?(Math.sin(x*.035)*Math.cos(z*.026)*14+8)*Math.min(1,(r-150)/40):0);}
  geo.computeVertexNormals();groundTexture.repeat.set(100,100);
  const floor=new T.Mesh(geo,new T.MeshStandardMaterial({map:groundTexture,color:0xb2ab85,roughness:1}));floor.receiveShadow=true;scene.add(floor);colliders.push(floor);
  const road=block(0,.015,0,6,.025,285,0x535553);const road2=block(0,.03,0,285,.025,6,0x535553);
  road.castShadow=road2.castShadow=false;
  for(let i=-135;i<140;i+=12){block(0,.05,i,.13,.02,4,0xd4c6a1);block(i,.055,0,4,.02,.13,0xd4c6a1);}
  const brick=new T.TextureLoader().load('/assets/brick-color.webp');brick.colorSpace=T.SRGBColorSpace;brick.wrapS=brick.wrapT=T.RepeatWrapping;brick.repeat.set(2,2);const brickBump=new T.TextureLoader().load('/assets/brick-height.webp');brickBump.wrapS=brickBump.wrapT=T.RepeatWrapping;brickBump.repeat.set(2,2);
  const plaster=new T.TextureLoader().load('/assets/plaster.webp');plaster.colorSpace=T.SRGBColorSpace;plaster.wrapS=plaster.wrapT=T.RepeatWrapping;plaster.repeat.set(2,2);
  for(let i=0;i<27;i++){
    const a=i*2.399,r=27+(i%7)*11,x=Math.cos(a)*r,z=Math.sin(a)*r,w=6+i%3,h=4+(i%3)*1.3,d=7;
    const g=new T.Group();g.position.set(x,0,z);scene.add(g);
    const body=block(0,h/2,0,w,h,d,i%3===0?0xb3b09c:0xc8b497,g);body.material=new T.MeshStandardMaterial({map:i%3===0?brick:plaster,bumpMap:i%3===0?brickBump:null,bumpScale:.08,color:i%3===0?0xe0d8cf:0xc5b99d,roughness:.92});
    block(0,.3,0,w+.3,.6,d+.3,0x6b6d61,g);
    const roof=new T.BufferGeometry();const v=[-w/2-.5,h,-4,w/2+.5,h,-4,0,h+2,-4,-w/2-.5,h,4,w/2+.5,h,4,0,h+2,4];roof.setAttribute('position',new T.Float32BufferAttribute(v,3));roof.setIndex([0,1,2,3,5,4,0,2,5,0,5,3,2,1,4,2,4,5]);roof.computeVertexNormals();const rm=mesh(roof,0x72594a,0,0,0,g);rm.material.side=T.DoubleSide;
    for(const side of [-1,1])for(const wx of [-w*.28,w*.28]){block(wx,h*.58,side*3.53,1.2,1.4,.1,0x263b3b,g);for(const dx of [-.67,.67])block(wx+dx,h*.58,side*3.6,.12,1.6,.1,0x655f4f,g);block(wx,h*.58,side*3.61,.06,1.4,.08,0xa89f83,g);block(wx,h*.58,side*3.61,1.2,.06,.08,0xa89f83,g);block(wx,h*.58-.8,side*3.65,1.5,.12,.35,0xb0ac98,g);}
    block(0,1.15,3.56,1.2,2.3,.12,0x52473a,g);block(.4,1.1,3.65,.09,.09,.08,0xd1c49e,g);
    block(w*.3,h+1.1,0,.8,2,.8,0x828078,g);
    colliders.push(body,rm);obstacles.push({x,z,w:w/2+.7,d:4.1});
  }
  const trunkGeo=new T.CylinderGeometry(.15,.4,5,12),leafGeo=new T.IcosahedronGeometry(1,2);
  for(let i=0;i<140;i++){
    const a=i*2.4,r=20+(i*17%160),x=Math.sin(a)*r,z=Math.cos(a)*r;if(Math.abs(x)<5||Math.abs(z)<5||obstacles.some(o=>Math.abs(x-o.x)<o.w+3&&Math.abs(z-o.z)<o.d+3))continue;
    const trunk=mesh(trunkGeo,0x5e5140,x,2.5,z);colliders.push(trunk);
    for(let k=0;k<3;k++){const c=mesh(leafGeo,k%2?0x546249:0x68734d,x+Math.sin(k*3+i)*1.6,5+k*.8,z+Math.cos(k*3+i)*1.4);c.scale.set(3.2,2.1,3);}
  }
  const rockGeo=new T.IcosahedronGeometry(1,1);
  for(let i=0;i<50;i++){const x=Math.sin(i*7)*130,z=Math.cos(i*4)*130;if(Math.abs(x)<6||Math.abs(z)<6)continue;const rock=mesh(rockGeo,0x7b7d71,x,.45,z);rock.scale.set(1+i%3,.8,1.3);colliders.push(rock);}
  // Instanced grass: one draw call, no model downloads.
  const grassGeo=new T.PlaneGeometry(.35,.65);grassGeo.translate(0,.32,0);
  const grass=new T.InstancedMesh(grassGeo,new T.MeshStandardMaterial({color:0x727950,side:T.DoubleSide,roughness:1}),1600);const dummy=new T.Object3D();
  for(let i=0;i<1600;i++){const x=Math.sin(i*127.1)*145,z=Math.cos(i*311.7)*145;dummy.position.set(x,Math.abs(x)<4||Math.abs(z)<4?-2:0,z);dummy.rotation.y=i*2.4;dummy.scale.setScalar(.7+(i%5)*.2);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}scene.add(grass);
  const water=new T.Mesh(new T.PlaneGeometry(1400,1400),new T.MeshStandardMaterial({color:0x4d7e89,metalness:.45,roughness:.28}));water.rotation.x=-Math.PI/2;water.position.y=-3;scene.add(water);
  return {floor,obstacles,colliders,grass};
}
