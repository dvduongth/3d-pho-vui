import * as T from 'three';
import {join,leave,MultiplayerError,type Connection} from './multiplayer';
import {actor,label} from './world';
import {style as C} from './style';
export type Pose={x:number;y:number;z:number;yaw:number;shirt:number};
export type TownCatch={id:string;name:string;species:string;weight:number;at:string;source:'simulation'};
type CatchEvent={type:'catch';id:string;species:string;weight:number;source:'simulation';practice:false};
function pose(v:unknown):Pose|null{
 if(typeof v!=='object'||v===null)return null;
 const p=v as Pose;
 if(![p.x,p.y,p.z,p.yaw,p.shirt].every(Number.isFinite)||Math.abs(p.x)>19||Math.abs(p.z)>19||p.y<0||p.y>8||Math.abs(p.yaw)>Math.PI*4||!Number.isInteger(p.shirt)||p.shirt<0||p.shirt>3)return null;
 return p;
}
function catchEvent(v:unknown):CatchEvent|null{
 if(typeof v!=='object'||v===null)return null;const e=v as CatchEvent;
 if(e.type!=='catch'||e.source!=='simulation'||e.practice!==false||typeof e.id!=='string'||e.id.length>64||!['Cá rô','Cá chép','Cá lóc'].includes(e.species)||!Number.isFinite(e.weight)||e.weight<.25||e.weight>3.2)return null;
 return e;
}
export function createPresence(scene:T.Scene,own:()=>Pose,restore:(p:Pose)=>void,changed:(status:string)=>void,onCatch:(c:TownCatch)=>void){
 const template=actor(C.lavender);template.root.updateMatrixWorld(true);
 (template.body.material as T.MeshStandardMaterial).color.set('#ffffff');
 const parts:{mesh:T.InstancedMesh;matrix:T.Matrix4;body:boolean}[]=[];
 template.root.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const mesh=new T.InstancedMesh(o.geometry,o.material,49);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.count=0;mesh.castShadow=false;scene.add(mesh);
  parts.push({mesh,matrix:o.matrixWorld.clone(),body:o===template.body});
 });
 const peers=new Map<string,{label:T.Sprite;target:Pose;position:T.Vector3;yaw:number}>();
 const seen=new Set<string>(),history:TownCatch[]=[];
 const m=new T.Matrix4(),rootMatrix=new T.Matrix4(),q=new T.Quaternion(),scale=new T.Vector3(1,1,1),axis=new T.Vector3(0,1,0),targetPosition=new T.Vector3();
 const colors=[C.lavender,C.leaf,C.pink,C.gold].map(c=>new T.Color(c));
 let conn:Connection|null=null,joining=false,online=false,lastSend=0,lastPose='',status='Hàng xóm · Chưa kết nối',manual=false;
 function setStatus(next:string){if(status!==next){status=next;changed(next);}}
 function remove(id:string){const p=peers.get(id);if(!p)return;scene.remove(p.label);p.label.material.map?.dispose();p.label.material.dispose();peers.delete(id);}
 function sync(){
  if(!conn)return;
  const ids=new Set(conn.peers.map(p=>p.id));for(const id of peers.keys())if(!ids.has(id))remove(id);
  for(const peer of conn.peers){
   const target=pose(conn.states[peer.id]);let remote=peers.get(peer.id);
   if(!remote&&target){const tag=label(peer.username);scene.add(tag);remote={label:tag,target,position:new T.Vector3(target.x,target.y,target.z),yaw:target.yaw};peers.set(peer.id,remote);}
   if(remote&&target)remote.target=target;
  }
  setStatus('Phố chung · '+(conn.peers.length+1)+' người');
 }
 function receive(data:unknown,name:string,at:string,announce:boolean){
  const e=catchEvent(data);if(!e||seen.has(e.id))return;
  seen.add(e.id);if(seen.size>256)seen.delete(seen.values().next().value as string);
  const item:TownCatch={...e,name,at};history.push(item);if(history.length>6)history.shift();
  if(announce)onCatch(item);
 }
 async function connectTown(){
  if(joining)return;joining=true;manual=false;setStatus('Đang vào phố chung…');
  try{
   conn=await join();online=true;seen.clear();history.length=0;
   const resume=pose(conn.me.saved);if(conn.persisted&&resume)restore(resume);
   if(conn.persisted)for(const event of conn.history)receive(event.data,event.from.username,event.at,false);
   sync();
   conn.on('join',sync);conn.on('leave',({id})=>{remove(id);sync();});conn.on('snapshot',sync);
   conn.on('event',({from,data})=>{const peer=conn?.peers.find(p=>p.id===from);if(peer)receive(data,peer.username,new Date().toISOString(),true);});
   conn.on('reconnect',()=>{online=true;lastPose='';if(conn?.persisted){const saved=pose(conn.me.saved);if(saved)restore(saved);for(const e of conn.history)receive(e.data,e.from.username,e.at,false);}sync();});
   conn.on('close',({code})=>{online=false;for(const id of peers.keys())remove(id);setStatus(manual?'Đã rời phố chung':'Mất kết nối ('+code+') · Bấm để vào lại');});
   conn.on('error',()=>setStatus('Kết nối đang gián đoạn'));
  }catch(error){
   online=false;
   const code=error instanceof MultiplayerError?error.code:0;
   setStatus(code===4003?'Phố đã đầy · Thử lại sau':code===4001?'Chưa xác định được người chơi':code===4004?'Tên phòng không hợp lệ':'Chưa kết nối được · Bấm thử lại');
  }finally{joining=false;}
 }
 function update(dt:number,time:number){
  if(conn&&online&&time-lastSend>=.1){
   lastSend=time;const p=own(),serialized=JSON.stringify(p);
   // A slow heartbeat detects a dropped connection even while standing still.
   if(serialized!==lastPose||Math.floor(time)!==Math.floor(time-.1)){
    if(conn.setState(p)){lastPose=serialized;sync();}
    else setStatus('Đang kết nối lại…');
   }
  }
  let index=0;
  for(const p of peers.values()){
   targetPosition.set(p.target.x,p.target.y,p.target.z);p.position.lerp(targetPosition,1-Math.exp(-dt*12));
   p.yaw+=Math.atan2(Math.sin(p.target.yaw-p.yaw),Math.cos(p.target.yaw-p.yaw))*(1-Math.exp(-dt*12));
   q.setFromAxisAngle(axis,p.yaw);rootMatrix.compose(p.position,q,scale);
   for(const part of parts){m.multiplyMatrices(rootMatrix,part.matrix);part.mesh.setMatrixAt(index,m);if(part.body)part.mesh.setColorAt(index,colors[p.target.shirt]);}
   p.label.position.copy(p.position);p.label.position.y+=3.15;index++;
  }
  for(const part of parts){part.mesh.count=index;part.mesh.instanceMatrix.needsUpdate=true;if(part.mesh.instanceColor)part.mesh.instanceColor.needsUpdate=true;part.mesh.computeBoundingSphere();}
 }
 return {
  connect:connectTown,update,count:()=>peers.size,status:()=>status,persisted:()=>conn?.persisted??false,history:()=>history,
  connected:()=>online,
  shareCatch:(id:string,species:string,weight:number)=>{if(conn&&online){const event={type:'catch',id,species,weight,source:'simulation',practice:false};if(conn.send(event))receive(event,conn.me.username,new Date().toISOString(),false);}},
  leave:()=>{manual=true;leave();online=false;for(const id of peers.keys())remove(id);setStatus('Đã rời phố chung');},
 };
}
