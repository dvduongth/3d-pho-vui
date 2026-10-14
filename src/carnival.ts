export const stalls=['Thử sức mạnh','Ném vòng chai','Bắn bia','Đua ngựa súng nước','Ném chai sữa','Hồ vịt'];
export type Roll={natural:number;bonus:number[];penalty:number;total:number;before:number;after:number};
export type Attempt={stall:number;step:number;bottles:number;wisdom:boolean;insight:boolean;intTried:boolean;others:number};
export type Carnival={luck:number;silver:number;gold:number;tickets:number;small:number;medium:number;big:number;components:number[];workers:number;recruits:number;milkSolved:boolean;milkInsight:boolean;milkIntTried:boolean;attempt:Attempt|null;log:string;};
export const newCarnival=():Carnival=>({luck:1,silver:12,gold:0,tickets:0,small:0,medium:0,big:0,components:[],workers:0,recruits:0,milkSolved:false,milkInsight:false,milkIntTried:false,attempt:null,log:'Chào mừng tới hội chợ! Bạn bắt đầu với 12 bạc, 0 vàng và 1 Luck. Mua vé, chơi ở sáu quầy và thu thập đủ 6 linh kiện trên nơ thú bông.'});
export function parseCarnival(value:unknown):Carnival|null{
 if(!value||typeof value!=='object')return null;const c=value as Carnival;
 for(const k of ['luck','silver','gold','tickets','small','medium','big','workers','recruits'] as const)if(!Number.isSafeInteger(c[k])||(k!=='luck'&&c[k]<0))return null;
 if(c.recruits>5||typeof c.milkSolved!=='boolean'||typeof c.milkInsight!=='boolean'||typeof c.milkIntTried!=='boolean'||typeof c.log!=='string'||c.log.length>2000||!Array.isArray(c.components)||c.components.length>6||new Set(c.components).size!==c.components.length||!c.components.every(i=>Number.isInteger(i)&&i>=0&&i<6))return null;
 const a=c.attempt;if(a!==null){if(!a||typeof a!=='object')return null;for(const [key,max] of [['stall',5],['step',3],['bottles',18],['others',5]] as const)if(!Number.isInteger(a[key])||a[key]<0||a[key]>max)return null;for(const key of ['wisdom','insight','intTried'] as const)if(typeof a[key]!=='boolean')return null;}
 return structuredClone(c);
}
export const die=(sides:number)=>1+Math.floor(Math.random()*sides);
export function rollLuck(c:Carnival,count:number,modifier=0,random=die):Roll{
 if(!Number.isSafeInteger(count)||count<0||count>10000||!Number.isSafeInteger(c.luck-count))throw Error('Số xúc xắc không hợp lệ');
 const before=c.luck;const penalty=before<0&&count===0?random(4):0;
 c.luck-=count;if(penalty)c.luck++;
 const natural=random(20),bonus=Array.from({length:count},()=>random(4));
 if(natural===1)c.luck++;
 return {natural,bonus,penalty,total:natural+modifier+bonus.reduce((a,b)=>a+b,0)-penalty,before,after:c.luck};
}
export function describe(r:Roll){return 'd20 ['+r.natural+']'+(r.bonus.length?' + '+r.bonus.length+'d4 ['+r.bonus.slice(0,12).join(', ')+(r.bonus.length>12?', …':'')+'] (tổng '+r.bonus.reduce((a,b)=>a+b,0)+')':'')+(r.penalty?' − d4 ['+r.penalty+']':'')+' = '+r.total+' · Luck '+r.before+' → '+r.after;}
export function bigPrize(c:Carnival,stall:number){c.big++;if(!c.components.includes(stall))c.components.push(stall);}
export function begin(c:Carnival,stall:number){if(c.attempt||c.tickets<1)return false;c.tickets--;c.attempt={stall,step:0,bottles:0,wisdom:false,insight:false,intTried:false,others:c.recruits};c.log='Đã dùng 1 vé. Chọn Luck trước mỗi lần gieo.';return true;}
export function trade(c:Carnival,size:'medium'|'big',stall:number){if(size==='medium'){if(c.small<3)return false;c.small-=3;c.medium++;}else{if(c.medium<3)return false;c.medium-=3;bigPrize(c,stall);}return true;}
export type Action='play'|'small-ring'|'wisdom'|'intelligence'|'recruit';
export function resolve(c:Carnival,action:Action,count:number,random=die){
 const a=c.attempt;
 if(action==='recruit'){
  if(a||c.recruits>=5)return null;const r=rollLuck(c,count,0,random);if(r.total>=12)c.recruits++;
  c.log=describe(r)+(r.total>=12?' · Một NPC nhận lời, có vé riêng.':' · NPC chưa nhận lời.');return r;
 }
 if(action==='intelligence'){
  if(!c.milkInsight||c.milkIntTried||c.milkSolved||c.luck<0||(a&&a.stall!==4))return null;
  const r=rollLuck(c,count,0,random);c.milkIntTried=true;c.milkSolved=r.total>=15;
  c.log=describe(r)+(c.milkSolved?' · Đã hiểu mẹo! Lần ném trúng kế tiếp hạ cả 6 chai (trừ critical).':' · Chưa giải được mẹo. Thử lại sau lần ném kế tiếp nếu Luck không âm.');return r;
 }
 if(!a)return null;
 if(action==='wisdom'&&!(a.stall===4&&a.step===2&&!a.wisdom))return null;
 if((action==='play'||action==='small-ring')&&a.stall===4&&a.step===2&&!a.wisdom)return null;
 const r=rollLuck(c,count,0,random);let message='';
 if(action==='wisdom'){a.wisdom=true;a.insight=r.total>=12;if(a.insight)c.milkInsight=true;message=a.insight?'Bạn nhận ra quầy chai sữa bị sắp đặt.':'Chưa phát hiện điều bất thường.';}
 else{
  const hit=(ac:number)=>r.natural!==1&&(r.natural===20||r.total>=ac);
  if(a.stall===0){if(r.total>=19){bigPrize(c,0);message='Chuông reo! Quà lớn và linh kiện.';}else{c.small++;message='Nhận 1 quà nhỏ.';}c.attempt=null;}
  if(a.stall===1){a.step++;if(action==='small-ring'){if(r.natural%3===0){c.small++;message='Mặt d20 chia hết cho 3: 1 quà nhỏ.';}else message='Chưa trúng chai quà nhỏ.';}else if(hit(19)){bigPrize(c,1);message='Trúng chai AC 19! Quà lớn và linh kiện.';}else message='Trượt chai quà lớn.';if(a.step===3)c.attempt=null;}
  if(a.stall===2){if(hit([12,15,17][a.step])){a.step++;message='Trúng bia '+a.step+'/3.';if(a.step===3){bigPrize(c,2);message+=' Quà lớn và linh kiện!';c.attempt=null;}}else{message='Trượt bia. Lượt kết thúc, chơi lại cần vé mới.';c.attempt=null;}}
  if(a.stall===3){if(r.total>=10+a.others){if(a.others>=5){bigPrize(c,3);message='Thắng cuộc đua 6 người! Quà lớn và linh kiện.';}else{c.small++;message='Thắng cuộc đua ít người: 1 quà nhỏ.';}}else message='Chưa thắng cuộc đua.';c.attempt=null;c.recruits=0;}
  if(a.stall===4){
   a.step++;a.intTried=false;c.milkIntTried=false;let bottles=0;
   if(r.natural===20)bottles=1;else if(hit(11)){bottles=c.milkSolved?6:random(4)+1;if(c.milkSolved)c.milkSolved=false;}
   a.bottles+=bottles;message='Hạ '+bottles+' chai · Tổng '+a.bottles+'.';if(bottles===6){bigPrize(c,4);message+=' Quà lớn và linh kiện!';}
   if(a.step===3){if(a.bottles>=10){c.medium++;message+=' Nhận 1 quà vừa.';}else if(a.bottles>=3){c.small++;message+=' Nhận 1 quà nhỏ.';}c.attempt=null;}
  }
  if(a.stall===5){if(r.total===20){bigPrize(c,5);message='Tổng đúng 20! Vịt mang quà lớn và linh kiện.';}else if(r.natural%2===0){c.small++;message='Mặt d20 chẵn: 1 quà nhỏ.';}else message='Chú vịt này không mang quà.';c.attempt=null;}
 }
 c.log=describe(r)+' · '+message;return r;
}
