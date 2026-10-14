import {begin,trade,resolve,stalls,bigPrize,die,type Carnival,type Action} from './carnival';
import './carnival.css';
const rules=[
 '1 vé / lượt. Athletics DC 19 để rung chuông và lấy quà lớn; mọi kết quả khác được quà nhỏ.',
 '1 vé / 3 vòng. Chọn chai lớn AC 19 hoặc chai nhỏ: mặt d20 là bội số của 3 nhận quà nhỏ. Không có cộng proficiency ném đĩa.',
 '1 vé / lượt. Bắn liên tiếp ba bia AC 12, 15, 17. Trượt bất kỳ bia nào kết thúc lượt. Trúng cả ba nhận quà lớn. Vũ khí đơn giản; cộng đánh xa +0.',
 'Concentration DC 10 + số người khác. Thắng với dưới 6 người nhận quà nhỏ; đủ 6 người nhận quà lớn. Mỗi người trả 1 vé. NPC nhận lời dùng vé của họ.',
 '1 vé / 3 bóng, mỗi bóng vào một tháp. Trúng AC 11 hạ 1d4+1 chai; natural 20 chỉ hạ 1 chai. Tổng ≥3: quà nhỏ; ≥10: quà vừa. Hạ 6 trong một lần: quà lớn.',
 '1 vé / lượt. Tổng sau Luck đúng 20 nhận quà lớn. Nếu không, mặt d20 chẵn nhận quà nhỏ. Không cộng chỉ số.'
];
export function createCarnivalUI(get:()=>Carnival,changed:()=>void,show:(title:string,body:string)=>void,sound:()=>void,canChange:()=>boolean){
 let selected=0,count=0;
 const $=(id:string)=>document.getElementById(id)!;
 function mutate(fn:(c:Carnival)=>void){if(!canChange())return;fn(get());changed();sound();render();}
 function render(){
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
  function button(text:string,action:Action){const b=document.createElement('button');b.textContent=text;b.className='primary';b.onclick=()=>{preview();if(!input.reportValidity())return;mutate(c=>{resolve(c,action,count);count=0;});};$('c-rolls').append(b);}
  if(a){if(a.stall===4&&a.step===2&&!a.wisdom)button('Nhìn ra mẹo · Wisdom DC 12','wisdom');else{button(a.stall===1?'Ném vào chai lớn · AC 19':'Gieo d20','play');if(a.stall===1)button('Ném vào chai nhỏ','small-ring');}}
  else{
   $('c-start').onclick=()=>mutate(c=>{if(!c.tickets&&c.silver>0){c.silver--;c.tickets++;}if(!begin(c,selected))c.log='Cần 1 vé để bắt đầu. Mua 12 vé bằng 1 vàng, hoặc dùng Công cụ thử nghiệm nếu bạn là duongdv.';});
   $('c-silver').onclick=()=>mutate(c=>{if(c.silver>=1){c.silver--;c.tickets++;c.log='Đã mua 1 vé bằng 1 bạc.';}else c.log='Không đủ bạc. Có thể đổi quà đã có hoặc thử lấy thú bông trên giá.';});
   $('c-gold').onclick=()=>mutate(c=>{if(c.gold>=1){c.gold--;c.tickets+=12;c.log='Đã mua 12 vé bằng 1 vàng.';}else c.log='Không đủ vàng.';});
   if(selected===3){const line=document.createElement('p');line.textContent='Đã mời '+c.recruits+'/5 NPC (đối thủ mô phỏng có vé riêng).';$('c-rolls').append(line);if(c.recruits<5)button('Mời thêm NPC · Charisma DC 12','recruit');}
  }
  if(selected===4&&c.milkInsight&&!c.milkIntTried&&!c.milkSolved&&c.luck>=0&&(!a||a.step!==2||a.wisdom))button('Giải mẹo · Intelligence DC 15','intelligence');
  $('c-medium').onclick=()=>mutate(c=>{c.log=trade(c,'medium',selected)?'Đã đổi 3 quà nhỏ lấy 1 quà vừa.':'Cần 3 quà nhỏ.';});
  $('c-big').onclick=()=>mutate(c=>{c.log=trade(c,'big',selected)?'Đã đổi 3 quà vừa lấy thú bông lớn và linh kiện.':'Cần 3 quà vừa.';});
  $('c-steal').onclick=()=>mutate(c=>{if(c.components.includes(selected)){c.log='Linh kiện quầy này đã nằm trong túi.';return;}bigPrize(c,selected);c.workers++;c.log='Bạn lấy thú bông. Một nhân viên chạy tới!';});
  $('c-fight').onclick=()=>mutate(c=>{if(!c.workers){c.log='Không có nhân viên đang đối đầu.';return;}const n=die(4);c.workers+=n;c.log='Gây gổ thu hút thêm 1d4 = '+n+' nhân viên. Tổng '+c.workers+' người.';});
 }
 return {open:(stall:number)=>{if(!canChange())return;selected=stall;count=0;render();}};
}
