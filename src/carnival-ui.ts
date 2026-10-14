import {forceAt} from './carnival-skill';
import {settings} from './settings';
import {input as gameInput} from './input';
import {begin,trade,resolve,stalls,bigPrize,die,type Carnival,type Action} from './carnival';
import './carnival.css';
import type {CarnivalView} from './carnival-stage';
import './carnival-screen.css';
const rules=[
 '1 vé / lượt. Athletics DC 19 để rung chuông và lấy quà lớn; mọi kết quả khác được quà nhỏ.',
 '1 vé / 3 vòng. Chọn chai lớn AC 19 hoặc chai nhỏ: mặt d20 là bội số của 3 nhận quà nhỏ. Không có cộng proficiency ném đĩa.',
 '1 vé / lượt. Bắn liên tiếp ba bia AC 12, 15, 17. Trượt bất kỳ bia nào kết thúc lượt. Trúng cả ba nhận quà lớn. Vũ khí đơn giản; cộng đánh xa +0.',
 'Concentration DC 10 + số người khác. Thắng với dưới 6 người nhận quà nhỏ; đủ 6 người nhận quà lớn. Mỗi người trả 1 vé. NPC nhận lời dùng vé của họ.',
 '1 vé / 3 bóng, mỗi bóng vào một tháp. Trúng AC 11 hạ 1d4+1 chai; natural 20 chỉ hạ 1 chai. Tổng ≥3: quà nhỏ; ≥10: quà vừa. Hạ 6 trong một lần: quà lớn.',
 '1 vé / lượt. Tổng sau Luck đúng 20 nhận quà lớn. Nếu không, mặt d20 chẵn nhận quà nhỏ. Không cộng chỉ số.'
];
export function createCarnivalUI(get:()=>Carnival,changed:()=>void,show:(title:string,body:string)=>void,sound:()=>void,canChange:()=>boolean){
 let selected=0,count=0,lastForce=0;
 let charge:{button:HTMLButtonElement;action:Action;amount:number;elapsed:number;traverse:number}|null=null;
 function cancelCharge(){if(!charge)return;charge=null;const field=document.getElementById('c-dice') as HTMLInputElement|null;if(field)field.disabled=false;document.querySelectorAll<HTMLButtonElement>('#c-rolls button').forEach(b=>{b.disabled=false;if(b.dataset.skill)b.textContent=b.dataset.skillLabel||'Căn lực';});const hint=document.getElementById('c-force-hint');if(hint)hint.textContent='Đã huỷ căn lực · Chưa dùng Luck hoặc mất lượt';}
 function finishCharge(){if(!charge)return;const shot=charge;charge=null;if(!document.getElementById('carnival-screen')||!canChange())return;lastForce=forceAt(shot.elapsed,shot.traverse);mutate(c=>{const result=resolve(c,shot.action,shot.amount,undefined,lastForce);if(result){view.roll=result;view.serial++;view.action=shot.action;}count=0;});}
 function tick(dt:number){
  const active=document.getElementById('carnival-screen');if(!active||document.hidden){cancelCharge();return;}
  const typing=document.activeElement instanceof HTMLInputElement;
  if(!typing&&gameInput.pressed('Space')&&active.querySelector<HTMLElement>('.c-game-drawer')?.hidden){if(charge)finishCharge();else{const focused=document.activeElement as HTMLElement;const b=focused?.hasAttribute('data-skill')?focused:active.querySelector<HTMLElement>('[data-skill]');b?.click();}}
  if(charge){charge.elapsed+=dt;const f=forceAt(charge.elapsed,charge.traverse);$('c-force-needle').style.left=f*100+'%';$('c-force-hint').textContent='Thả tay / bấm lần nữa khi kim ở tâm · '+Math.round(f*100)+'% lực';}
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelCharge();});window.addEventListener('blur',cancelCharge);

 const view:CarnivalView={stall:0,serial:0,roll:null,action:""};
 const $=(id:string)=>document.getElementById(id)!;
 function mutate(fn:(c:Carnival)=>void){if(!canChange())return;fn(get());changed();sound();render();}
 function render(){
  charge=null;
  const c=get(),a=c.attempt;if(a)selected=a.stall;
  show(stalls[selected],`<div class="carnival-ui"><div class="carnival-wallet"><b>✦ Luck ${c.luck}</b><span>🎟 ${c.tickets} vé</span><span>${c.silver} bạc · ${c.gold} vàng</span></div>
  <p class="carnival-rule">${rules[selected]}</p><div class="carnival-prizes">Quà nhỏ ${c.small} · Vừa ${c.medium} · Lớn ${c.big} · Linh kiện ${c.components.length}/6</div>
  ${c.components.length===6?'<p class="carnival-win">✦ Hoàn thành bộ 6 linh kiện! Bạn vẫn có thể chơi tiếp. Nợ Luck còn lại được giữ nguyên.</p>':'<p><b>Mục tiêu: thu thập đủ 6 linh kiện.</b> Thắng quà lớn hoặc đổi quà tại từng quầy để lấy linh kiện trên nơ thú bông.</p>'}
  <p class="carnival-log" id="carnival-log" role="status" aria-live="polite"></p>
  ${a?'<p><b>Lượt đang chơi · '+(a.stall===1?'Vòng '+(a.step+1)+'/3':a.stall===2?'Bia '+(a.step+1)+'/3':a.stall===4?'Bóng '+(a.step+1)+'/3 · Đã hạ '+a.bottles+' chai':'Đã trả vé')+'</b></p>':'<div class="carnival-buttons"><button id="c-start" class="primary">'+(c.tickets?'Chơi · 1 vé':c.silver?'Mua vé & chơi · 1 bạc':'Cần mua vé trước')+'</button><button id="c-silver">Mua 1 vé · 1 bạc</button><button id="c-gold">Mua 12 vé · 1 vàng</button></div>'}
  <div class="carnival-luck"><label for="c-dice">Thêm d4 trước khi gieo</label><input id="c-dice" type="number" min="0" max="10000" step="1" value="${count}" inputmode="numeric"><p id="c-preview"></p><small>Natural 1 hồi 1 Luck. Khi đang nợ và không vay thêm, −1d4 và hồi 1 Luck. Mức nhập tối đa mỗi lần: 10.000 d4.</small></div>
  <div class="carnival-buttons" id="c-rolls"></div>
  <details><summary>Túi quà, linh kiện & nhân viên</summary><p>3 quà nhỏ → 1 quà vừa; 3 quà vừa → quà lớn của quầy này, kèm linh kiện trên nơ.</p><div class="carnival-buttons"><button id="c-medium">Đổi 3 nhỏ → 1 vừa</button><button id="c-big">Đổi 3 vừa → 1 lớn</button></div><p>Thú bông lớn có linh kiện buộc ở cổ. ${c.components.includes(selected)?'Bạn đã có linh kiện quầy này.':'Linh kiện quầy này còn trên giá.'}</p><div class="carnival-buttons"><button id="c-steal">Lấy trộm thú bông</button><button id="c-fight">Đánh nhau với nhân viên</button></div><p id="c-workers">${c.workers} nhân viên đang chú ý. Đánh nhau gọi thêm 1d4 người; chưa có luật giải quyết giao chiến.</p></details>
  <details><summary>Bộ linh kiện · ${c.components.length}/6</summary>${stalls.map((name,i)=>'<p>'+(c.components.includes(i)?'✓ Đã có':'○ Chưa có')+' · '+name+'</p>').join('')}</details>
  <p class="sub">Khởi đầu: 12 bạc, 0 vàng, 1 Luck. Athletics, đánh xa, Concentration, Charisma, Wisdom và Intelligence đều +0. Mời NPC bằng Charisma DC 12; họ có vé riêng. Ví hội chợ tách khỏi xu Phố Vui. Luck, quà và lượt đang chơi được lưu cùng tiến độ.</p><p class="sub">Mô phỏng cá nhân, chưa xác thực server.</p></div>`);
  const root=document.querySelector<HTMLElement>('.carnival-ui')!;
  const controls=document.createElement('div');controls.className='carnival-actions-top';
  const luck=root.querySelector('.carnival-luck')!,rolls=$('c-rolls');
  if(!a){const start=root.querySelector('.carnival-buttons')!;controls.append(start);}
  controls.append(luck,rolls);root.querySelector('.carnival-wallet')!.after(controls);
  if(a){const note=document.createElement('p');note.className='resume-note';note.textContent='Đang tiếp tục lượt đã trả vé ở '+stalls[a.stall]+'. Đóng cửa sổ vẫn giữ lượt này.';controls.prepend(note);
   const leave=document.createElement('button');leave.textContent='Kết thúc lượt để đổi trò';leave.onclick=()=>{leave.textContent='Xác nhận bỏ lượt · Không hoàn vé';leave.onclick=()=>mutate(c=>{c.attempt=null;c.log='Đã kết thúc lượt. Quà đã nhận và nợ Luck được giữ nguyên.';});};root.append(leave);
  }
  $('carnival-log').textContent=c.log.replace('Bản thử:','Khởi đầu:');
  const input=$('c-dice') as HTMLInputElement;
  function preview(){count=Number(input.value);const valid=Number.isSafeInteger(count)&&count>=0&&count<=10000;input.setCustomValidity(valid?'':'Nhập số nguyên từ 0 đến 10.000');$('c-preview').textContent=!valid?'Số d4 không hợp lệ.':count?'Dùng '+Math.min(Math.max(0,c.luck),count)+' Luck có sẵn; vay '+Math.max(0,count-Math.max(0,c.luck))+' → Luck '+(c.luck-count)+' trước kết quả.':c.luck<0?'Không vay: −1d4; hồi 1 Luck.':'Gieo d20, không dùng Luck.';}
  input.oninput=preview;preview();
  function button(text:string,action:Action){
   const b=document.createElement('button');b.textContent=text;b.className='primary';
   if(action==='play'||action==='small-ring'){
    b.textContent='Căn lực · '+text;b.dataset.skill='true';b.dataset.skillLabel=b.textContent;
    const start=()=>{if(charge||!canChange())return;preview();if(!input.reportValidity())return;charge={button:b,action,amount:count,elapsed:0,traverse:settings.get('needleSeconds')};input.disabled=true;document.querySelectorAll<HTMLButtonElement>('#c-rolls button').forEach(other=>other.disabled=other!==b);b.textContent='Thả tay / bấm để thực hiện';b.focus();};
    b.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();if(charge)return;start();if(charge)b.setPointerCapture(e.pointerId);};
    b.onpointerup=()=>{if(charge?.button===b)finishCharge();};b.onpointercancel=cancelCharge;
    b.onclick=e=>{if(e.detail!==0)return;if(charge?.button===b)finishCharge();else start();};
   }else b.onclick=()=>{preview();if(!input.reportValidity())return;mutate(c=>{const result=resolve(c,action,count);if(result){view.roll=result;view.serial++;view.action=action;}count=0;});};
   $('c-rolls').append(b);
  }
  if(a){if(a.stall===4&&a.step===2&&!a.wisdom)button('Nhìn ra mẹo · Wisdom DC 12','wisdom');else{button(['Vung búa!','Ném chai lớn · AC 19','Bắn bia!','Bắt đầu đua!','Ném bóng!','Chọn vịt!'][selected],'play');if(a.stall===1)button('Ném vào chai nhỏ','small-ring');}}
  else{
   $('c-start').onclick=()=>mutate(c=>{view.roll=null;view.action='';view.serial++;if(!c.tickets&&c.silver>0){c.silver--;c.tickets++;}if(!begin(c,selected))c.log='Cần 1 vé để bắt đầu. Mua 12 vé bằng 1 vàng, hoặc dùng Công cụ thử nghiệm nếu bạn là duongdv.';});
   $('c-silver').onclick=()=>mutate(c=>{if(c.silver>=1){c.silver--;c.tickets++;c.log='Đã mua 1 vé bằng 1 bạc.';}else c.log='Không đủ bạc. Có thể đổi quà đã có hoặc thử lấy thú bông trên giá.';});
   $('c-gold').onclick=()=>mutate(c=>{if(c.gold>=1){c.gold--;c.tickets+=12;c.log='Đã mua 12 vé bằng 1 vàng.';}else c.log='Không đủ vàng.';});
   if(selected===3){const line=document.createElement('p');line.textContent='Đã mời '+c.recruits+'/5 NPC (đối thủ mô phỏng có vé riêng).';$('c-rolls').append(line);if(c.recruits<5)button('Mời thêm NPC · Charisma DC 12','recruit');}
  }
  if(selected===4&&c.milkInsight&&!c.milkIntTried&&!c.milkSolved&&c.luck>=0&&(!a||a.step!==2||a.wisdom))button('Giải mẹo · Intelligence DC 15','intelligence');
  $('c-medium').onclick=()=>mutate(c=>{c.log=trade(c,'medium',selected)?'Đã đổi 3 quà nhỏ lấy 1 quà vừa.':'Cần 3 quà nhỏ.';});
  $('c-big').onclick=()=>mutate(c=>{c.log=trade(c,'big',selected)?'Đã đổi 3 quà vừa lấy thú bông lớn và linh kiện.':'Cần 3 quà vừa.';});
  $('c-steal').onclick=()=>mutate(c=>{if(c.components.includes(selected)){c.log='Linh kiện quầy này đã nằm trong túi.';return;}bigPrize(c,selected);c.workers++;c.log='Bạn lấy thú bông. Một nhân viên chạy tới!';});
  $('c-fight').onclick=()=>mutate(c=>{if(!c.workers){c.log='Không có nhân viên đang đối đầu.';return;}const n=die(4);c.workers+=n;c.log='Gây gổ thu hút thêm 1d4 = '+n+' nhân viên. Tổng '+c.workers+' người.';});
  view.stall=selected;
  root.id='carnival-screen';
  const wallet=root.querySelector('.carnival-wallet')!,prizes=root.querySelector('.carnival-prizes')!,rule=root.querySelector('.carnival-rule')!,log=$('carnival-log');
  const header=document.createElement('header');header.className='c-game-header panel';header.innerHTML='<div><small>HỘI CHỢ · MÔ PHỎNG CÁ NHÂN</small><h2>'+stalls[selected]+'</h2></div>';header.append(wallet);
  const left=document.createElement('aside');left.className='c-game-info panel';left.innerHTML='<h3>'+(['Rung chuông trên đỉnh','Chiếc vòng may mắn','Ba bia, một lượt','Cùng đua về đích','Giải mẹo tháp chai','Vịt nào mang quà?'][selected])+'</h3>';
  const status=document.createElement('p');status.className='c-game-status';status.textContent=a?'Đang chơi · Lượt '+Math.min(3,a.step+1)+(selected===1||selected===2||selected===4?'/3':''):view.roll&&view.action!=='recruit'?'Kết thúc lượt · Chơi lại bên phải':'Sẵn sàng · Bắt đầu bên phải';left.append(status,prizes);
  const help=document.createElement('details');help.innerHTML='<summary>Cách chơi</summary>';help.append(rule);left.append(help);
  const bag=document.createElement('button');bag.textContent='Vé, quà & linh kiện';left.append(bag);
  const right=document.createElement('aside');right.className='c-game-controls panel';right.innerHTML='<h3>'+ (a?'Chọn Luck rồi hành động':'Sẵn sàng chơi?')+'</h3>';right.append(controls);
  const footer=document.createElement('footer');footer.className='c-game-result panel';
  const dice=document.createElement('strong');dice.className='c-game-die';dice.textContent=view.roll?String(view.roll.total):'d20';footer.append(dice,log);
  const drawer=document.createElement('section');drawer.className='c-game-drawer panel';drawer.hidden=true;
  const back=document.createElement('button');back.textContent='← Trở lại sân chơi';back.onclick=()=>{drawer.hidden=true;bag.focus();};drawer.append(back);
  const tickets=document.createElement('div');tickets.className='carnival-buttons';
  for(const id of ['c-silver','c-gold']){const button=document.getElementById(id);if(button)tickets.append(button);}
  drawer.append(tickets);
  Array.from(root.children).forEach(child=>drawer.append(child));
  root.replaceChildren(header,left,right,footer,drawer);
  if(a&&!(selected===4&&a.step===2&&!a.wisdom)){
   const meter=document.createElement('section');meter.className='c-force panel';meter.innerHTML='<b>CĂN LỰC · TÂM LÀ CHUẨN</b><div class="c-force-track"><span class="c-force-zone"></span><i id="c-force-needle"></i></div><span id="c-force-hint">Giữ nút rồi thả · Hoặc Space hai lần</span>';root.append(meter);$('c-force-needle').style.left=lastForce*100+'%';
  }
  const skillHelp=document.createElement('p');skillHelp.className='c-skill-help';skillHelp.textContent='Căn lực: 0–20 điểm. d20 tạo sai lệch −3…+3; Luck cộng d4. Chai nhỏ và vịt chẵn cần căn chuẩn ít nhất 60%. Natural 1 vẫn hồi Luck; chai sữa natural 20 vẫn chỉ hạ 1 chai.';help.append(skillHelp);
  bag.onclick=()=>{cancelCharge();drawer.hidden=false;back.focus();};
  const close=document.getElementById('close')!;close.textContent='← Về phố';
  if(!a&&view.roll&&view.action!=='recruit'&&c.tickets)$('c-start').textContent='Chơi lại · 1 vé';
  const primary=right.querySelector<HTMLElement>('button.primary');primary?.focus();

 }
 return {tick,view:()=>document.getElementById('carnival-screen')?view:null,open:(stall:number)=>{if(!canChange())return;cancelCharge();selected=stall;count=0;lastForce=0;view.roll=null;view.action='';view.serial++;render();}};
}
