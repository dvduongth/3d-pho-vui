import type {SaveResult} from './backend';
import type {SessionCatch} from './tu-dialogue';
import {parseCarnival,type Carnival} from './carnival.ts';

export type Progress={
 version:1; coins:number; owned:number[]; worn:number; fishCount:number; quest:number;
 played:number; casts:number; refillAt:number; latestCatch:SessionCatch|null;
 garden:number; gardenWait:number; animal:number; animalWait:number;
 claimedCasts:string[]; muted:boolean; carnival?:Carnival;
};
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
export function parseProgress(v:unknown):Progress|null{
 if(!object(v)||v.version!==1)return null;
 const integer=(key:string,min:number,max:number)=>typeof v[key]==='number'&&Number.isInteger(v[key])&&(v[key] as number)>=min&&(v[key] as number)<=max;
 for(const key of ['coins','fishCount'])if(!integer(key,0,Number.MAX_SAFE_INTEGER))return null;
 for(const [key,max] of [['worn',3],['quest',3],['casts',30],['garden',4],['animal',3]] as const)if(!integer(key,0,max))return null;
 for(const key of ['played','refillAt','gardenWait','animalWait'])if(typeof v[key]!=='number'||!Number.isFinite(v[key])||(v[key] as number)<0)return null;
 if(!Array.isArray(v.owned)||v.owned.length>4||!v.owned.every(n=>Number.isInteger(n)&&n>=0&&n<4)||!v.owned.includes(v.worn))return null;
 if(!Array.isArray(v.claimedCasts)||v.claimedCasts.length>128||!v.claimedCasts.every(id=>typeof id==='string'&&id.length<=64))return null;
 if(typeof v.muted!=='boolean')return null;
 if(v.carnival!==undefined&&!parseCarnival(v.carnival))return null;
 if(v.latestCatch!==null){
  if(!object(v.latestCatch)||v.latestCatch.source!=='simulation'||!['Cá rô','Cá chép','Cá lóc'].includes(v.latestCatch.species as string)||typeof v.latestCatch.weight!=='number'||!Number.isFinite(v.latestCatch.weight)||v.latestCatch.weight<.25||v.latestCatch.weight>3.2)return null;
 }
 return v as Progress;
}

/** A single in-flight writer. A failed read never authorizes overwriting a cloud save. */
export function createProgressStore(snapshot:()=>Progress,restore:(p:Progress)=>void,status:(s:string)=>void,transport:{load:()=>Promise<SaveResult>;store:(p:Progress)=>Promise<boolean>},storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>){
 let key='',ready=false,cloudKnown=false,busy=false,dirty=false,loaded=false,suspended=false;
 let timer:ReturnType<typeof setTimeout>|undefined;
 function backup(value:Progress){if(!key)return;try{storage.setItem(key,JSON.stringify(value));}catch{status('Chưa lưu · Bộ nhớ máy không khả dụng');}}
 function readBackup():Progress|null{if(!key)return null;try{const raw=storage.getItem(key);return raw?parseProgress(JSON.parse(raw)):null;}catch{return null;}}
 function clearBackup(){if(key)try{storage.removeItem(key);}catch{/* The service is authoritative even if local cleanup fails. */}}
 async function flush(){
  if(!ready||busy||!dirty)return;
  clearTimeout(timer);timer=undefined;dirty=false;const value=snapshot();
  if(!key){status('Chưa có danh tính · Chưa lưu');return;}
  if(!cloudKnown||suspended){backup(value);status('Lưu tạm trên máy · Chưa đồng bộ');return;}
  busy=true;status('Đang lưu…');
  const ok=await transport.store(value);busy=false;
  if(ok){clearBackup();status(dirty?'Có thay đổi chưa lưu':'Đã lưu');}
  else{suspended=true;backup(snapshot());status('Lưu tạm trên máy · Bấm để thử lại');}
  if(dirty&&!suspended)timer=setTimeout(()=>void flush(),800);
 }
 function changed(){if(!ready)return;dirty=true;if(!cloudKnown||suspended){backup(snapshot());return;}clearTimeout(timer);timer=setTimeout(()=>void flush(),800);}
 async function load(email:string){
  if(busy)return;clearTimeout(timer);key='pho-vui:recovery:'+email;busy=true;ready=false;status('Đang tải tiến độ…');
  const result=await transport.load();busy=false;
  if(!result.ok){
   if(!loaded){const copy=readBackup();if(copy)restore(copy);}
   loaded=true;ready=true;cloudKnown=false;status('Chưa tải được · Lưu tạm trên máy');return;
  }
  cloudKnown=true;suspended=false;
  if(result.data!==null){
   const saved=parseProgress(result.data);
   if(!saved){ready=false;status('Bản lưu không tương thích · Không ghi đè');return;}
   restore(saved);clearBackup();
  }else{
   const copy=readBackup();if(copy)restore(copy);
  }
  ready=true;loaded=true;status('Đã tải tiến độ');
  if(result.data===null){dirty=true;await flush();}
 }
 return {load,changed,flush,canChange:()=>ready,cloudReady:()=>cloudKnown&&!suspended&&ready,retry:async()=>{if(!key)return;const email=key.slice('pho-vui:recovery:'.length);if(!cloudKnown||!ready)await load(email);else{suspended=false;dirty=true;await flush();}},unavailable:()=>{ready=true;cloudKnown=false;status('Chưa có danh tính · Chưa lưu');}};
}
