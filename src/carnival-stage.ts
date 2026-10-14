import * as T from 'three';
import {ball,block,rod} from './world';
import {style as C} from './style';
import {settings} from './settings';
import type {Carnival,Roll} from './carnival';
export type CarnivalView={stall:number;serial:number;roll:Roll|null;action:string};
export function createCarnivalStage(scene:T.Scene,camera:T.PerspectiveCamera){
 const root=new T.Group();root.position.x=2000;root.visible=false;scene.add(root);
 block(root,C.wood,0,-.2,0,13,.4,10);block(root,C.lavender,0,-.02,0,12.7,.12,9.7);
 for(const x of [-5.8,5.8]){block(root,C.wood,x,3,-3,.2,6,.2);ball(root,C.gold,x,5.2,-3,.36,.55,.36);}
 for(let i=0;i<16;i++)block(root,i%2?C.cream:C.lavender,-5.65+i*.75,6,-3.2,.76,.2,1.6);
 const games=Array.from({length:6},()=>{const g=new T.Group();root.add(g);return g;});
 block(games[0],C.wood,0,2.8,0,1.3,5.6,.4);block(games[0],C.cream,0,2.8,.25,.55,5,.08);
 for(let i=0;i<10;i++)block(games[0],C.lavender,.5,.5+i*.47,.3,.3,.05,.1);
 const puck=ball(games[0],C.pink,0,.5,.4,.28,.15,.2);const bell=ball(games[0],C.gold,0,5.5,.2,.6,.38,.35);
 const mallet=new T.Group();games[0].add(mallet);mallet.position.set(-1.7,.3,1.5);rod(mallet,C.wood,new T.Vector3(),new T.Vector3(0,1.6,0),.08);block(mallet,C.lavender,0,1.6,0,.9,.4,.45);
 const bottle=(g:T.Group,x:number,y:number,z:number,color:string)=>{const b=new T.Group();g.add(b);b.position.set(x,y,z);ball(b,color,0,.38,0,.24,.4,.24);block(b,color,0,.85,0,.18,.4,.18);return b;};
 block(games[1],C.wood,0,.8,0,6,1.6,2);for(let i=0;i<5;i++)bottle(games[1],-2+i,1.65,0,i===2?C.gold:C.leaf);
 const ring=new T.Mesh(new T.TorusGeometry(.5,.07,8,28),new T.MeshStandardMaterial({color:C.pink}));ring.rotation.x=Math.PI/2;games[1].add(ring);
 const targets:T.Group[]=[];
 for(let i=0;i<3;i++){const t=new T.Group();games[2].add(t);t.position.set(-2.2+i*2.2,3.2,0);block(t,C.wood,0,-1.5,-.15,.12,3,.12);for(let j=0;j<3;j++)ball(t,[C.cream,C.pink,C.gold][j],0,0,j*.08,.85-j*.25,.85-j*.25,.08);targets.push(t);}
 const shot=ball(games[2],C.gold,0,1,4,.13);
 const horses:T.Group[]=[];
 for(let i=0;i<6;i++){const z=-2.3+i*.85;block(games[3],i%2?C.cream:C.lavender,0,.25,z,7,.12,.7);const h=new T.Group();games[3].add(h);h.position.set(-2.7,.6,z);ball(h,i===0?C.gold:C.pink,0,.4,0,.45,.23,.2);ball(h,C.gold,.35,.7,0,.2,.35,.16);for(const x of [-.25,.25])block(h,C.wood,x,.15,0,.08,.4,.15);horses.push(h);}
 const bottles:T.Group[]=[];block(games[4],C.wood,0,.6,0,7,1.2,2);
 for(let p=0;p<3;p++)for(let row=0;row<3;row++)for(let j=0;j<3-row;j++)bottles.push(bottle(games[4],-2.4+p*2.4+(j-(2-row)/2)*.55,1.25+row*.85,0,C.cream));
 const ballThrow=ball(games[4],C.pink,0,1,4,.25);
 ball(games[5],C.water,0,.35,0,3.3,.3,2.2);const ducks:T.Group[]=[];
 for(let i=0;i<8;i++){const d=new T.Group();games[5].add(d);ball(d,C.gold,0,.2,0,.3,.25,.4);ball(d,C.gold,0,.5,.18,.2);ball(d,C.pink,0,.46,.4,.12,.05,.15);for(const x of [-.1,.1])ball(d,C.ink,x,.55,.34,.028);ducks.push(d);}
 root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;}});
 let previous=-1,age=5,time=0,wasActive=false;
 const savedPosition=new T.Vector3(),savedRotation=new T.Quaternion();
 function update(dt:number,v:CarnivalView|null,c:Carnival){
  root.visible=!!v;
  if(!v){if(wasActive){camera.position.copy(savedPosition);camera.quaternion.copy(savedRotation);}wasActive=false;return;}
  if(!wasActive){savedPosition.copy(camera.position);savedRotation.copy(camera.quaternion);wasActive=true;}
  games.forEach((g,i)=>g.visible=i===v.stall);time+=dt;if(v.serial!==previous){previous=v.serial;age=0;}else age+=dt;
  const reduced=settings.get<boolean>('reducedMotion'),t=reduced?1:Math.min(1,age/1.1),n=v.roll?.total??0;
  const playing=v.action==='play'||v.action==='small-ring';
  puck.position.y=.5+(v.roll&&playing?Math.min(1,Math.max(0,n/19))*4.5*Math.sin(t*Math.PI/2):0);bell.rotation.z=n>=19&&age<1&&!reduced?Math.sin(age*25)*.15:0;mallet.rotation.z=playing&&age<1?Math.sin(t*Math.PI)*-1.1:0;
  const ringGood=v.roll&&v.roll.natural!==1&&(v.roll.natural===20||n>=19);
  ring.position.set(v.action==='small-ring'?-1.9:ringGood?0:1.5,1.7+Math.sin(t*Math.PI)*2.5,4*(1-t));ring.visible=v.stall===1&&!!v.roll&&playing;
  const completed=c.attempt?.stall===2?c.attempt.step:v.roll?.progress?.step??0;targets.forEach((target,i)=>target.rotation.x=i<completed?-.7:0);shot.visible=!!v.roll&&playing&&age<1.1;shot.position.set(-2.2+Math.max(0,completed-1)*2.2,1+2.2*t,4*(1-t));
  const others=c.attempt?.stall===3?c.attempt.others:v.roll?.progress?.others??c.recruits;
  horses.forEach((h,i)=>{h.visible=i<=others;h.position.x=-2.7+(playing&&v.roll?5.4*t*(i===0?Math.min(1,n/(10+others)):.65+i*.035):0);h.rotation.z=!reduced&&age<1.1?Math.sin(time*15+i)*.08:0;});
  const knocked=c.attempt?.stall===4?c.attempt.bottles:v.roll?.progress?.bottles??0;bottles.forEach((b,i)=>{b.rotation.z=i<knocked?Math.PI/2*t:0;});ballThrow.visible=!!v.roll&&playing&&age<1.1;ballThrow.position.set(0,1+Math.sin(t*Math.PI)*2,4*(1-t));
  ducks.forEach((d,i)=>{const a=i/8*Math.PI*2+(reduced?0:time*.1);d.position.set(Math.sin(a)*2.1,.7+(i===0&&v.roll&&playing?Math.sin(t*Math.PI)*1.5:0),Math.cos(a)*1.2);d.rotation.y=a;});
  camera.position.set(2000,6.8,14);camera.lookAt(2000,2.4,0);
 }
 return {update};
}
