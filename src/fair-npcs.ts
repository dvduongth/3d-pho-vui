import {puzzleNpcs} from './puzzle-ui';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {actor, block, ball, label, places} from './world';
import {style as C} from './style';
export const fairNames = ['Cô Mai · 2048', 'Anh Bình · Chim bay', 'Chú Bảy · Ném vòng','Chú Sơn · Sức mạnh','Cô Liên · Vòng chai','Anh Hải · Bắn bia','Chị Ngân · Đua ngựa','Chú Tám · Chai sữa','Cô Vy · Hồ vịt',...puzzleNpcs];
export function createFairNpcs(scene: T.Scene) {
  const roots: T.Group[] = [];
  for (const [i, [x,z]] of [[-10,15],[0,18],[10,15],[-16,3],[-16,-5],[-8,-17],[7,-17],[16,-5],[16,3],[-18,10],[-15,17],[-7,18],[7,18],[15,17],[18,10],[-18,-10],[18,-10]].entries()) {
    const root = new T.Group(), decor = new T.Group(), color = [C.lavender,C.leaf,C.pink][i%3];
    const person = actor(color, i !== 1); person.root.position.set(0,.4,0); decor.add(person.root);
    block(decor,C.wood,0,1,-1.2,3.5,.8,.8);
    for (const dx of [-1.9,1.9]) block(decor,C.wood,dx,2,-1.5,.12,4,.12);
    for(let k=0;k<6;k++) block(decor,k%2?C.cream:color,-1.65+k*.66,4,-1.3,.68,.16,2);
    for(let k=0;k<5;k++) ball(decor,k%2?C.gold:C.pink,-1.4+k*.7,3.55,-.4,.13,.2,.13);
    if(i===0)for(let k=0;k<4;k++)block(decor,k%2?C.gold:C.lavender,-.6+k*.4,1.65,-1.2,.34,.34,.3);
    if(i===1){ball(decor,C.gold,0,1.8,-1.2,.45,.35,.3);ball(decor,C.cream,.3,1.9,-.95,.13);ball(decor,C.ink,.32,1.9,-.84,.05);}
    if(i===2)for(let k=0;k<3;k++){block(decor,C.leaf,-.65+k*.65,1.65,-1.2,.2,.55,.2);const ring=new T.Mesh(new T.TorusGeometry(.22,.045,6,16),new T.MeshStandardMaterial({color:C.gold}));ring.rotation.x=Math.PI/2;ring.position.set(-.65+k*.65,1.45,-1.2);decor.add(ring);}
    if(i>=3&&i<9){
      const bear=new T.Group();bear.position.set(1.15,1.6,-1.2);decor.add(bear);
      ball(bear,C.gold,0,.35,0,.38,.48,.3);ball(bear,C.gold,0,.95,0,.4);
      for(const x of [-.3,.3]){ball(bear,C.gold,x,1.25,0,.17);ball(bear,C.cream,x,.05,.15,.18);}
      for(const x of [-.13,.13])ball(bear,C.ink,x,1,.36,.04);
      block(bear,C.pink,0,.63,.29,.65,.1,.08);ball(bear,C.lavender,0,.5,.37,.14,.18,.06);
      if(i===3){block(decor,C.wood,-1.1,2,-1.3,.2,1.2,.2);ball(decor,C.gold,-1.1,2.7,-1.3,.3);}
      if(i===4||i===7)for(let b=0;b<3;b++)block(decor,C.cream,-1.3+b*.35,1.65,-1.1,.16,.5,.16);
      if(i===5)for(let b=0;b<3;b++)ball(decor,[C.leaf,C.lavender,C.pink][b],-1.3+b*.4,2.3,-1.5,.18,.18,.07);
      if(i===6){ball(decor,C.wood,-.8,1.65,-1.2,.4,.2,.15);ball(decor,C.gold,-.5,1.95,-1.2,.17,.3,.15);}
      if(i===8){ball(decor,C.water,-.8,1.4,-1.2,.65,.1,.4);ball(decor,C.gold,-.8,1.7,-1.2,.25,.2,.2);ball(decor,C.gold,-.6,1.9,-1.2,.13);}
    }
    if(i>=9){
      block(decor,C.cream,0,1.55,-1.2,2.8,.12,.9);
      for(let j=0;j<5;j++){
        if(i===13||i===14)ball(decor,j%2?C.ink:C.lavender,-1+j*.5,1.85,-1.2,.15,.25,.15);
        else if(i===16)ball(decor,C.gold,-1+j*.5,1.8,-1.2,.18,.15,.2);
        else block(decor,[C.gold,C.pink,C.leaf,C.lavender,C.water][j],-1+j*.5,1.8,-1.2,.32,.3,.32);
      }
    }
    decor.updateMatrixWorld(true);
    const geos:T.BufferGeometry[]=[];
    decor.traverse(o=>{if(o instanceof T.Mesh && o.visible && o.parent?.visible){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const color=(o.material as T.MeshStandardMaterial).color;const colors=new Float32Array(g.attributes.position.count*3);for(let j=0;j<colors.length;j+=3){colors[j]=color.r;colors[j+1]=color.g;colors[j+2]=color.b;}g.setAttribute('color',new T.BufferAttribute(colors,3));geos.push(g);}});
    const merged=mergeGeometries(geos);geos.forEach(g=>g.dispose());
    if(merged)root.add(new T.Mesh(merged,new T.MeshStandardMaterial({vertexColors:true,roughness:.8})));
    (person.body.material as T.Material).dispose();
    const title=label(fairNames[i]);title.position.set(0,4.7,0);root.add(title);
    root.position.set(x,0,z);root.userData.placeIndex=places.length;
    places.push({name:fairNames[i],kind:'fair',x,z});scene.add(root);roots.push(root);
  }
  return roots;
}
