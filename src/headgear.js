import * as T from 'three';

// Built in character axes: +Y up, -Z forward. No flat cardboard plates.
export function createHeadgear(kind, color) {
  const group=new T.Group();group.name=`headgear-${kind}`;
  const shell=new T.MeshStandardMaterial({color,roughness:.68,metalness:.12});
  const rubber=new T.MeshStandardMaterial({color:0x222a28,roughness:.93});
  const glass=new T.MeshStandardMaterial({color:0x264a57,roughness:.19,metalness:.55});
  const hardware=new T.MeshStandardMaterial({color:0x7b8175,roughness:.4,metalness:.7});
  group.userData.materials=[shell,rubber,glass,hardware];
  function add(geometry,material,name,position=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geometry,material);m.name=name;m.position.fromArray(position);m.scale.fromArray(scale);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
  function cord(points,radius,material,name){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,radius,5,false),material,name);}
  function dome(radius,end,material,name,position,scale){const g=new T.SphereGeometry(radius,28,16,0,Math.PI*2,0,end);return add(g,material,name,position,scale);}
  function rim(y,rx,rz,name){const pts=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;pts.push([Math.cos(a)*rx,y,Math.sin(a)*rz]);}return cord(pts,.012,rubber,name);}
  const height=kind==='hood'?.19:.17;
  dome(.25,Math.PI*.56,shell,'curved-shell',[0,height,0],[1.08,1,1.13]);
  // Inner shell gives an actual lip at the open lower edge.
  const liner=dome(.239,Math.PI*.56,rubber,'inner-liner',[0,height,0],[1.08,1,1.13]);liner.material.side=T.DoubleSide;
  rim(height-.047,.265,.278,'rubber-rim');
  if(kind==='cap'){
    const bill=new T.SphereGeometry(.29,24,8,Math.PI*1.25,Math.PI*.5,Math.PI*.36,Math.PI*.3);
    add(bill,shell,'curved-cap-bill',[0,.14,-.16],[1,.23,1]);
    cord([[-.2,.15,-.27],[0,.16,-.43],[.2,.15,-.27]],.01,rubber,'bill-seam');
    return group;
  }
  for(const side of [-1,1]){
    add(new T.SphereGeometry(.085,14,10),rubber,'padded-ear-cover',[side*.246,.065,.015],[.45,1.1,.85]);
    cord([[side*.237,.16,-.09],[side*.27,.13,-.02],[side*.26,.05,.08]],.016,shell,'accessory-rail');
    for(const z of [-.08,.07]){const screw=add(new T.CylinderGeometry(.012,.012,.008,8),hardware,'rail-bolt',[side*.259,.12,z]);screw.rotation.z=Math.PI/2;}
    cord([[side*.23,.05,-.03],[side*.2,-.09,-.08],[side*.12,-.18,-.12]],.011,rubber,'chin-strap');
  }
  cord([[-.12,-.18,-.12],[0,-.21,-.15],[.12,-.18,-.12]],.015,rubber,'chin-padding');
  // Curved goggle lenses wrap around the face; frame is a rounded tube.
  const lens=new T.SphereGeometry(.27,24,8,Math.PI*1.26,Math.PI*.48,Math.PI*.43,Math.PI*.2);
  add(lens,glass,'curved-visor',[0,.08,0],[1,.68,1.05]);
  cord([[-.19,.14,-.2],[-.1,.15,-.26],[0,.15,-.283],[.1,.15,-.26],[.19,.14,-.2]],.012,rubber,'visor-top-frame');
  cord([[-.19,.03,-.2],[-.1,.02,-.26],[0,.02,-.283],[.1,.02,-.26],[.19,.03,-.2]],.012,rubber,'visor-bottom-frame');
  cord([[0,.19,-.277],[0,.25,-.263],[0,.28,-.244]],.018,rubber,'front-mount');
  return group;
}
