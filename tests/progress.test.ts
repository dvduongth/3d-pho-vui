import {strict as assert} from 'node:assert';
import {createProgressStore,parseProgress,type Progress} from '../src/progress.ts';

const initial=():Progress=>({version:1,coins:20,owned:[0],worn:0,fishCount:0,quest:0,played:0,casts:30,refillAt:1,latestCatch:null,garden:0,gardenWait:0,animal:0,animalWait:0,claimedCasts:[],muted:false});
function storage(){
 const map=new Map<string,string>();
 return {map,getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value);},removeItem:(key:string)=>{map.delete(key);}};
}
const saved={...initial(),coins:66,quest:2,fishCount:1,casts:29,claimedCasts:['cast-once'],latestCatch:{source:'simulation' as const,species:'Cá lóc',weight:3.2}};
assert.ok(parseProgress(saved));
assert.equal(parseProgress({...saved,worn:2}),null);
assert.equal(parseProgress({...saved,latestCatch:{...saved.latestCatch,source:'server'}}),null);
assert.equal(parseProgress({...saved,coins:-1}),null);
assert.equal(parseProgress({...saved,version:99}),null);

async function checks(){
 // A cloud record wins over an older local fallback, without another reward.
 let current=initial();const local=storage();local.setItem('pho-vui:recovery:a',JSON.stringify({...saved,coins:999}));
 const writes:Progress[]=[];
 const store=createProgressStore(()=>structuredClone(current),p=>{current=p;},()=>{},{
  load:async()=>({ok:true,data:saved,updatedAt:null}),
  store:async p=>{writes.push(p);return true;},
 },local);
 await store.load('a');assert.equal(current.coins,66);assert.equal(current.fishCount,1);assert.deepEqual(current.claimedCasts,['cast-once']);assert.equal(local.getItem('pho-vui:recovery:a'),null);assert.equal(writes.length,0);
 store.changed();await store.flush();assert.equal(writes[0].coins,66);

 // Failure to read must not overwrite an unseen cloud save.
 let uploadCount=0;current=initial();const recovery=storage();
 const offline=createProgressStore(()=>structuredClone(current),p=>{current=p;},()=>{},{
  load:async()=>({ok:false}),
  store:async()=>{uploadCount++;return true;},
 },recovery);
 await offline.load('b');current.coins=44;offline.changed();await offline.flush();
 assert.equal(uploadCount,0);assert.equal(JSON.parse(recovery.getItem('pho-vui:recovery:b')!).coins,44);

 // Migrate only when the service explicitly has no save.
 let imported:Progress|null=null;
 const migrate=createProgressStore(()=>structuredClone(current),p=>{current=p;},()=>{},{
  load:async()=>({ok:true,data:null,updatedAt:null}),
  store:async p=>{imported=p;return true;},
 },recovery);
 await migrate.load('b');assert.equal((imported as Progress|null)?.coins,44);assert.equal(recovery.getItem('pho-vui:recovery:b'),null);

 // Failed writes stop until an explicit retry; newer state is retained locally.
 let attempts=0,ok=false;current=initial();const temp=storage();
 const retry=createProgressStore(()=>structuredClone(current),p=>{current=p;},()=>{},{
  load:async()=>({ok:true,data:initial(),updatedAt:null}),
  store:async()=>{attempts++;return ok;},
 },temp);
 await retry.load('c');current.coins=42;retry.changed();await retry.flush();assert.equal(attempts,1);
 current.coins=50;retry.changed();await retry.flush();assert.equal(attempts,1);
 ok=true;await retry.retry();assert.equal(attempts,2);assert.equal(temp.getItem('pho-vui:recovery:c'),null);

 // A later write cannot overtake a pending request.
 let release:(ok:boolean)=>void=()=>{};let requests=0;const snapshots:number[]=[];
 current=initial();
 const serial=createProgressStore(()=>structuredClone(current),p=>{current=p;},()=>{},{
  load:async()=>({ok:true,data:initial(),updatedAt:null}),
  store:async p=>{snapshots.push(p.coins);requests++;if(requests===1)return new Promise<boolean>(r=>{release=r;});return true;},
 },storage());
 await serial.load('d');current.coins=44;serial.changed();const first=serial.flush();
 current.coins=66;serial.changed();await serial.flush();assert.equal(requests,1);
 release(true);await first;await serial.flush();assert.deepEqual(snapshots,[44,66]);
 console.log('Progress checks passed: validation, cloud priority, restore without reward, safe recovery, manual retry, serialized writes.');
}
void checks();
