import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { style as C } from './style';
export type Actor={root:T.Group;body:T.Mesh;arms:T.Mesh[];legs:T.Mesh[];hat:T.Group};
const sphere=new T.SphereGeometry(1,16,12),box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,20);
const materials=new Map<string,T.MeshStandardMaterial>();
function mat(color:string){let m=materials.get(color);if(!m){m=new T.MeshStandardMaterial({color,roughness:0.8});materials.set(color,m);}return m;}
export function shape(parent:T.Object3D,geo:T.BufferGeometry,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number){const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function ball(p:T.Object3D,c:string,x:number,y:number,z:number,sx:number,sy=sx,sz=sx){return shape(p,sphere,c,x,y,z,sx,sy,sz);}
export function block(p:T.Object3D,c:string,x:number,y:number,z:number,sx:number,sy:number,sz:number){return shape(p,box,c,x,y,z,sx,sy,sz);}
export function rod(p:T.Object3D,c:string,a:T.Vector3,b:T.Vector3,r:number){const m=shape(p,cylinder,c,0,0,0,r,a.distanceTo(b),r);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());return m;}
export function actor(color:string,hat=true):Actor{
 const root=new T.Group();const body=ball(root,color,0,1.03,0,.43,.57,.32);body.material=mat(color).clone();
 ball(root,C.cream,0,1.92,0,.57,.55,.5);ball(root,C.ink,0,2.17,-.09,.58,.36,.48);
 for(const x of [-.2,.2]){ball(root,C.ink,x,1.94,.452,.063,.083,.035);ball(root,C.cream,x+.016,1.97,.48,.016);}
 ball(root,C.gold,0,1.78,.48,.07,.055,.06);
 for(const x of [-.52,.52])ball(root,C.cream,x,1.88,0,.11,.16,.12);
 const arms=[-.49,.49].map(x=>ball(root,C.cream,x,1.13,0,.13,.35,.15));
 const legs=[-.2,.2].map(x=>{const l=ball(root,C.ink,x,.39,0,.17,.3,.17);ball(root,C.wood,x,.14,.08,.19,.11,.28);return l;});
 const h=new T.Group();root.add(h);shape(h,cylinder,C.gold,0,2.29,0,.82,.09,.72);ball(h,C.gold,0,2.43,0,.54,.37,.51);shape(h,cylinder,C.lavender,0,2.35,0,.55,.12,.52);ball(h,C.cream,.51,2.36,.2,.12);h.visible=hat;
 root.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=false;});body.castShadow=true;
 return {root,body,arms,legs,hat:h};
}
export function label(text:string):T.Sprite{
 const c=document.createElement('canvas');c.width=512;c.height=96;const x=c.getContext('2d')!;x.fillStyle=C.cream;x.beginPath();x.roundRect(3,4,506,84,40);x.fill();x.strokeStyle=C.lavender;x.lineWidth=3;x.stroke();x.fillStyle=C.ink;x.font='bold 30px sans-serif';x.textAlign='center';x.fillText(text,256,58);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false}));s.scale.set(3.6,.68,1);return s;
}
export type Place={name:string;kind:string;x:number;z:number};
export const places:Place[]=[{name:'Ông Tư · Hồ sen',kind:'fish',x:3,z:10},{name:'Tiệm Mây · Tủ đồ',kind:'shop',x:-10,z:-4},{name:'Chị Hoa · Caro',kind:'caro',x:10,z:-3},{name:'Cô Lan · Vườn',kind:'garden',x:13,z:-12},{name:'Trạm xe',kind:'ride',x:-13,z:9}];
export function createWorld(scene:T.Scene){
 const staticRoot=new T.Group();scene.add(staticRoot);
 block(staticRoot,C.leaf,0,-.65,0,70,1,65);
 shape(staticRoot,cylinder,'#c1a5b6',0,-.4,0,12.7,.7,12.7);
 const water=new T.Mesh(new T.CircleGeometry(10.25,96),new T.MeshStandardMaterial({color:C.water,roughness:.4,metalness:.08}));water.rotation.x=-Math.PI/2;water.position.y=.12;scene.add(water);
 for(let i=0;i<72;i++){const a=i/72*Math.PI*2;const b=block(staticRoot,i%3?'#e0c1ba':C.cream,Math.sin(a)*11.3,.22,Math.cos(a)*11.3,1.06,.42,2.1);b.rotation.y=a;}
 block(staticRoot,'#d2b2b1',0,.02,15,11,.3,8);block(staticRoot,'#d2b2b1',0,.02,-16,30,.3,9);
 // The bridges connect both sides without stepping into water.
 for(const z of [-6,6])for(let i=-11;i<=11;i++){const y=.35+Math.sin((i+11)/22*Math.PI)*.8;block(staticRoot,'#d6b8bf',i,y,z,1.02,.3,2.1);if(i%3===0)for(const dz of [-1,1]){block(staticRoot,'#b49bae',i,y+.5,z+dz,.18,1,.18);ball(staticRoot,C.cream,i,y+1.05,z+dz,.17);}}
 for(const z of [-6,6])for(const dz of [-1,1])rod(staticRoot,'#c2a7bd',new T.Vector3(-11,1.2,z+dz),new T.Vector3(11,1.2,z+dz),.11);
 shape(staticRoot,cylinder,'#c4abc4',0,.55,0,2.8,.8,2.8);shape(staticRoot,cylinder,C.cream,0,1.02,0,2.6,.18,2.6);shape(staticRoot,cylinder,'#b9a2bd',0,1.7,0,.85,1.3,.85);
 function lotus(x:number,y:number,z:number,size:number){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(size);staticRoot.add(g);for(let j=0;j<7;j++){const a=j/7*Math.PI*2;const petal=ball(g,j%2?C.pink:C.lavender,Math.sin(a)*.55,.35,Math.cos(a)*.55,.35,.75,.26);petal.rotation.z=-Math.sin(a)*.55;petal.rotation.x=Math.cos(a)*.55;}ball(g,C.gold,0,.6,0,.34,.6,.34);}
 lotus(0,2.05,0,2.15);
 for(let i=0;i<25;i++){const a=i*2.399,r=3.8+(i%5)*1.06,x=Math.sin(a)*r,z=Math.cos(a)*r;if(Math.abs(Math.abs(z)-6)<1.5)continue;shape(staticRoot,cylinder,C.leaf,x,.16,z,.7,.06,.54);if(i%2===0)lotus(x,.22,z,.46);}
 function lamp(x:number,z:number,tall=false){const h=tall?4.6:1.5;block(staticRoot,C.wood,x,h/2,z,.17,h,.17);if(tall)block(staticRoot,C.wood,x+.4,h,z,1.2,.14,.15);const lx=x+(tall?.7:0);block(staticRoot,C.gold,lx,h-.5,z,.5,.75,.5);block(staticRoot,C.wood,lx,h-.08,z,.65,.1,.65);block(staticRoot,C.wood,lx,h-.92,z,.6,.12,.6);const glow=ball(staticRoot,'#ffe9a6',lx,h-.48,z,.23,.35,.23);(glow.material as T.MeshStandardMaterial).emissive.set('#eeb15d');(glow.material as T.MeshStandardMaterial).emissiveIntensity=.6;}
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;lamp(Math.sin(a)*12,Math.cos(a)*12,i%3===0);}
 for(const [x,z] of [[-10,-6],[10,-7],[-15,-15],[0,-22],[15,-22]]){
  block(staticRoot,C.gold,x,1.9,z,5,3.8,4);block(staticRoot,C.wood,x,1.3,z+2.04,1.1,2.6,.12);
  for(const dx of [-1.5,1.5]){block(staticRoot,C.lavender,x+dx,2,z+2.1,.9,1.2,.15);block(staticRoot,C.cream,x+dx,2,z+2.21,.08,1.1,.06);}
  const roof=shape(staticRoot,new T.ConeGeometry(4.2,2,4),C.lavender,x,4.6,z,1,1,.8);roof.rotation.y=Math.PI/4;
 }
 // Striped cloth and counter beside the pond.
 for(let i=0;i<8;i++)block(staticRoot,i%2?C.cream:C.lavender,-12.2+i*.62,3.7,-3, .63,.12,3);
 for(const x of [-12.4,-7.4])block(staticRoot,C.wood,x,1.9,-2,.12,3.8,.12);
 block(staticRoot,C.wood,-10,1,-2,4.6,1.1,.85);
 for(let i=0;i<3;i++)ball(staticRoot,[C.leaf,C.pink,C.lavender][i],-11+i,2.1,-3,.3,.55,.16);
 for(const x of [-17,17])for(let j=0;j<5;j++){const z=-18+j*8;shape(staticRoot,cylinder,C.wood,x,1.5,z,.23,3,.23);for(let k=0;k<3;k++)ball(staticRoot,k%2?C.leaf:'#65856e',x+Math.sin(k*2)*.8,3.5+k*.55,z+Math.cos(k*2)*.6,1.7,1.6,1.5);}
 for(let j=0;j<3;j++){block(staticRoot,C.wood,14,.3,-11-j*1.5,3,.4,1);for(let k=0;k<6;k++)ball(staticRoot,C.leaf,12.8+k*.48,.75,-11-j*1.5,.24,.4,.24);}
 for(let i=0;i<3;i++){const x=11+i*.8,z=-17;ball(staticRoot,C.cream,x,.57,z,.34,.33,.4);ball(staticRoot,C.cream,x,.89,z+.22,.21);ball(staticRoot,C.gold,x,.85,z+.43,.1,.06,.15);ball(staticRoot,C.pink,x,1.1,z+.22,.09,.12,.08);ball(staticRoot,C.ink,x+.12,.94,z+.35,.027);}
 for(let i=0;i<7;i++){block(staticRoot,C.wood,10+i*.7,.8,-18,.1,1.1,.1);block(staticRoot,C.wood,10+i*.7,.8,-15.8,.1,1.1,.1);}block(staticRoot,C.gold,12,.95,-18,4.5,.1,.08);block(staticRoot,C.gold,12,.95,-15.8,4.5,.1,.08);
 for(const x of [-6,6]){block(staticRoot,C.wood,x,.8,13,2.8,.2,.8);block(staticRoot,C.wood,x,1.35,13.4,2.8,.7,.15);for(const dx of [-1,1])block(staticRoot,C.ink,x+dx,.4,13,.12,.8,.7);}
 for(let i=0;i<8;i++){const x=Math.sin(i*1.9)*16,z=Math.cos(i*1.9)*16;shape(staticRoot,cylinder,C.lavender,x,.5,z,.65,.8,.55);for(let k=0;k<5;k++){ball(staticRoot,C.leaf,x+Math.sin(k*2)*.4,1,z+Math.cos(k*2)*.4,.45);ball(staticRoot,k%2?C.pink:C.cream,x+Math.sin(k*2)*.4,1.4,z+Math.cos(k*2)*.4,.16);}}
 // Bake stationary primitives by material to keep scenery draw calls small.
 staticRoot.updateMatrixWorld(true);const batches=new Map<T.Material,T.BufferGeometry[]>();staticRoot.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.Material,g=o.geometry.clone().applyMatrix4(o.matrixWorld);const list=batches.get(m)||[];list.push(g);batches.set(m,list);}});
 scene.remove(staticRoot);for(const [material,geos] of batches){const g=mergeGeometries(geos);if(g){const m=new T.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;scene.add(m);}geos.forEach(g=>g.dispose());}
 const npcs=places.map((p,i)=>{const a=actor([C.water,C.pink,C.lavender,C.leaf,C.gold][i],true);a.root.position.set(p.x,.4,p.z);scene.add(a.root);const s=label(p.name);s.position.set(p.x,3.65,p.z);scene.add(s);return a;});
 const crowd=[[-5,10],[7,9],[-7,-10],[5,-11]].map((p,i)=>{const a=actor([C.lavender,C.leaf,C.gold,C.pink][i],i%2===0);a.root.position.set(p[0],.4,p[1]);scene.add(a.root);return a;});
 const float=ball(scene,C.gold,3,.3,7,.13,.2,.13);
 const ring=new T.Mesh(new T.RingGeometry(.35,.39,40),new T.MeshBasicMaterial({color:C.cream,transparent:true,opacity:.45,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(3,.2,7);scene.add(ring);
 return {water,npcs,crowd,float,ring};
}
