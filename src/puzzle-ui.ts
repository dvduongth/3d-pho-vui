import {input} from './input';
import {style as C} from './style';
import {adjacent,newSliding,matches,newMatch,canSwap,collapse,linePath,pieces,fits,rotate,clearRows,newOAn,ownPits,sowOAn,type OAn} from './puzzle-rules';
import {newBoardGame,legalMoves,movePiece,computerMove,boardResult,inCheck,type BoardGame} from './puzzle-chess';
import './puzzle.css';
export const puzzleNames=['Xếp hình trượt','Xếp gạch','Match-3','Lines · Nối 5','Cờ vua','Cờ tướng','Ô ăn quan','Đào vàng'];
export const puzzleNpcs=['Cô Hạnh · Xếp hình','Anh Nam · Xếp gạch','Chị Đào · Match-3','Anh Lâm · Lines','Ông Minh · Cờ vua','Ông Phúc · Cờ tướng','Bà Thu · Ô ăn quan','Chú Quang · Đào vàng'];
const help=[
 'Chạm ô sát khoảng trống để trượt. Xếp từ 1 đến 8, ô trống ở góc dưới phải. Phím mũi tên di chuyển khoảng trống.',
 '← → di chuyển, ↑ xoay, ↓ hạ, Space thả nhanh. Lấp hàng ngang để xoá. Xoá 10 hàng để thắng; gạch chạm đỉnh thì thua.',
 'Chọn hai viên kề nhau để đổi. Ghép ít nhất 3 viên cùng hình/màu. Đạt 500 điểm trong 20 nước; đổi không tạo bộ không mất nước.',
 'Chọn bóng rồi chọn ô trống có đường tới. Nối ít nhất 5 bóng cùng màu theo hàng, cột hoặc chéo. Mỗi lượt không xoá bóng sẽ thêm 3 bóng. Đạt 100 điểm để thắng.',
 'Bạn cầm Trắng, máy cầm Đen. Chọn quân rồi chọn ô sáng. Có nhập thành, bắt tốt qua đường, phong cấp và kiểm tra chiếu. Chiếu hết để thắng.',
 'Bạn cầm Đỏ, máy cầm Đen. Có cung, sông, cản chân mã, mắt tượng, ngòi pháo và chống lộ mặt tướng. Đối thủ hết nước hợp lệ thì thắng.',
 'Chọn một trong 5 ô dân hàng dưới và chiều rải. Rải hết: ô tiếp có dân thì bốc rải tiếp, gặp quan thì dừng; ô trống rồi ô có hạt thì ăn. Hai quan hết là kết thúc. Quan tính 10 điểm.',
 'Canh móc lắc rồi bấm Thả móc hoặc Space. Móc chạm vàng sẽ kéo lên; tảng lớn kéo chậm hơn. Đạt 500 điểm trong 60 giây. Đá chỉ được 20 điểm.'
];
const colors=[C.cream,C.gold,C.pink,C.leaf,C.lavender,C.water];
const symbols=['','✦','♥','♣','◆','●'];
type Nugget={x:number;y:number;r:number;value:number;mass:number;rock:boolean;taken:boolean};
export function createPuzzleUI(show:(title:string,body:string)=>void,sound:(hz?:number,duration?:number)=>void){
 let zoomed=false,promotion=5;
 let game=-1,b:number[]=[],selected=-1,score=0,moves=0,remaining=20,status='',ended='',aiWait=0,elapsed=0,dropTime=0,lines=0;
 let piece:number[][]=[],px=3,py=0,pieceColor=1,bag:number[]=[],nextPiece=0;
 let chess:BoardGame=newBoardGame(false),oan:OAn=newOAn(),direction=1;
 let nuggets:Nugget[]=[],angle=0,lockedAngle=0,length=20,hook:'swing'|'out'|'back'='swing',caught=-1,seconds=60;
 let lastReadout=-1;
 const $=(id:string)=>document.getElementById(id)!;
 const active=()=>!!document.getElementById('puzzle-screen');
 function finish(text:string){ended=text;sound(text.includes('thắng')||text.includes('Hoàn')?880:240,.25);render();}
 function drawRandomPiece(){if(!bag.length){bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}}return bag.pop()!;}
 function spawnPiece(){const id=nextPiece;nextPiece=drawRandomPiece();piece=pieces[id].map(p=>p.slice());pieceColor=id%5+1;px=3;py=0;dropTime=0;if(!fits(b,piece,px,py))ended='Hết chỗ rồi! Thử xếp phẳng hơn ở lượt sau.';}
 function addBalls(){for(let k=0;k<3;k++){const empty=b.map((v,i)=>v? -1:i).filter(i=>i>=0);if(!empty.length)break;b[empty[Math.floor(Math.random()*empty.length)]]=1+Math.floor(Math.random()*5);}const found=matches(b,9,5,true);score+=found.length*10;found.forEach(i=>b[i]=0);}
 function reset(){
  zoomed=false;selected=-1;score=0;moves=0;remaining=20;status='Chọn một ô để bắt đầu.';ended='';aiWait=0;elapsed=0;lines=0;dropTime=0;lastReadout=-1;
  for(const code of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'])input.pressed(code);
  if(game===0)b=newSliding();
  if(game===1){b=Array(180).fill(0);bag=[];nextPiece=drawRandomPiece();spawnPiece();status='Xoá 10 hàng · Khối tiếp theo hiển thị bên trái.';}
  if(game===2){do{b=newMatch();}while(!canSwap(b));}
  if(game===3){b=Array(81).fill(0);addBalls();addBalls();score=0;}
  if(game===4||game===5){chess=newBoardGame(game===5);status=game===4?'Bạn đi trước · Quân Trắng':'Bạn đi trước · Quân Đỏ';}
  if(game===6){oan=newOAn();direction=1;status='Chọn ô dân ở hàng dưới, rồi bấm Rải.';}
  if(game===7){seconds=60;angle=0;lockedAngle=0;length=20;hook='swing';caught=-1;nuggets=Array.from({length:10},(_,i)=>({x:55+(i%5)*120+(Math.random()-.5)*28,y:175+Math.floor(i/5)*155+Math.random()*30,r:i%3===0?27:19,value:i%4===0?20:i%3===0?150:100,mass:i%4===0?3:i%3===0?2:1,rock:i%4===0,taken:false}));status='Canh hướng tới vàng rồi thả móc.';}
  render();
 }
 function boardHTML(cells:number[],w:number,kind:string,legal:number[]=[]){return '<div class="p-board '+kind+'" style="--cols:'+w+'">'+cells.map((value,i)=>{
  let content='',name='Ô '+(i+1),cls='';
  if(kind==='slide'){content=value?String(value):'';cls=value?'':'empty';name=value?'Trượt ô '+value:'Ô trống';}
  else if(kind==='match'||kind==='lines'){content=value?symbols[value]:'';cls=value?'gem gem-'+value:'empty';name=value?'Màu '+value+', hàng '+(Math.floor(i/w)+1)+', cột '+(i%w+1):'Ô trống';}
  else if(kind==='chess'||kind==='xiangqi'){
   const type=Math.abs(value),positive=value>0;cls=((Math.floor(i/w)+i%w)%2?'dark ':'light ')+(positive?'human':'computer');
   if(value)content=kind==='chess'?(positive?['','♙','♘','♗','♖','♕','♔']:['','♟','♞','♝','♜','♛','♚'])[type]:['','Tốt','Mã','Tượng','Xe','Pháo','Tướng','Sĩ'][type];
   name=(value?(positive?'Bạn ':'Máy ')+['','Tốt','Mã','Tượng','Xe',kind==='chess'?'Hậu':'Pháo',kind==='chess'?'Vua':'Tướng','Sĩ'][type]:'Ô trống')+', '+(Math.floor(i/w)+1)+','+(i%w+1);
  }
  return '<button data-cell="'+i+'" title="'+name+'" aria-label="'+name+'" class="'+cls+(selected===i?' selected':'')+(legal.includes(i)?' legal':'')+'">'+content+'</button>';
 }).join('')+'</div>';}
 function render(){
  let body='',extra='',stats='Điểm '+score;
  if(game===0){body=boardHTML(b,3,'slide');stats=moves+' nước';}
  if(game===1){const cells=b.slice();let ghostY=py;while(fits(b,piece,px,ghostY+1))ghostY++;const ghost=new Set(piece.map(([x,y])=>(ghostY+y)*10+px+x));piece.forEach(([x,y])=>{const i=(py+y)*10+px+x;if(i>=0&&i<180)cells[i]=pieceColor;});body='<div class="tetris-grid">'+cells.map((v,i)=>'<i class="'+(v?'solid':'')+(ghost.has(i)&&!v?' ghost':'')+'" style="--block:'+colors[v]+'"></i>').join('')+'</div>';extra='<p>Khối kế tiếp</p><div class="next-grid">'+Array.from({length:8},(_,i)=>'<i style="background:'+(pieces[nextPiece].some(([x,y])=>y*4+x===i)?colors[nextPiece%5+1]:'transparent')+'"></i>').join('')+'</div><div class="p-controls"><button data-action="left">←</button><button data-action="rotate">↻</button><button data-action="right">→</button><button data-action="down">↓</button><button data-action="drop">Thả nhanh</button></div>';stats=lines+'/10 hàng';}
  if(game===2){body=boardHTML(b,7,'match');stats=score+'/500 · '+remaining+' nước';}
  if(game===3){body=boardHTML(b,9,'lines');stats=score+'/100 điểm';}
  if(game===4||game===5){const legal=selected<0?[]:legalMoves(chess).filter(m=>m.from===selected).map(m=>m.to);body=boardHTML(chess.cells,game===4?8:9,game===4?'chess':'xiangqi',legal);stats=moves+' lượt · '+(chess.turn===1?'Bạn':'Máy');if(game===4)extra='<label>Phong cấp tốt <select id="promotion"><option value="5">Hậu</option><option value="4">Xe</option><option value="3">Tượng</option><option value="2">Mã</option></select></label>';else extra='<p class="p-variant">Bản casual: lặp cùng thế 3 lần tính hoà; chưa phân xử luật đuổi quân chuyên nghiệp.</p>';}
  if(game===6){const pit=(i:number)=>'<button data-cell="'+i+'" class="pit '+((i===0||i===6)?'quan ':'')+(selected===i?'selected':'')+'"><small>'+((i===0||i===6)?'QUAN':'DÂN')+'</small><b>'+oan.pits[i]+'</b><span>'+('•'.repeat(Math.min(oan.pits[i],12)))+'</span></button>';body='<div class="oan-table">'+pit(0)+'<div class="oan-rows"><div>'+[11,10,9,8,7].map(pit).join('')+'</div><div>'+[1,2,3,4,5].map(pit).join('')+'</div></div>'+pit(6)+'</div>';extra='<div class="p-controls"><button data-action="ccw">← Rải trái</button><button data-action="cw">Rải phải →</button></div><p>Nợ hạt: bạn '+oan.debt[0]+' · máy '+oan.debt[1]+'. Hết dân: dùng 5 điểm để rải lại, thiếu thì ghi nợ; cuối ván trừ nợ.</p>';stats='Bạn '+(oan.scores[0]-oan.debt[0])+' · Máy '+(oan.scores[1]-oan.debt[1]);}
  if(game===7){body='<div class="gold-field"><div class="gold-surface"></div><div class="gold-cart">⚙</div><div id="gold-rope"><span>∪</span></div>'+nuggets.map((n,i)=>'<div id="nugget-'+i+'" class="nugget '+(n.rock?'rock':'')+'" style="left:'+n.x+'px;top:'+n.y+'px;width:'+n.r*2+'px;height:'+n.r*2+'px;'+(n.taken?'display:none':'')+'">'+n.value+'</div>').join('')+'</div>';extra='<button class="primary" data-action="hook">Thả móc · Space</button>';stats=score+'/500 · '+Math.ceil(seconds)+' giây';}
  if(game>=2&&game<=5)extra+='<button id="p-zoom">'+(zoomed?'Thu nhỏ bàn':'Phóng to bàn · Kéo để xem')+'</button>';
  show(puzzleNames[game],'<div id="puzzle-screen"><header class="p-header panel"><div><small>SẠP PUZZLE · MIỄN PHÍ</small><h2>'+puzzleNames[game]+'</h2></div><b id="p-stats">'+stats+'</b></header><aside class="p-help panel"><h3>Cách chơi</h3><p>'+help[game]+'</p>'+extra+'<p class="p-local">'+(game===4||game===5||game===6?'Đấu với máy':'Thử thách cá nhân')+' · Điểm trong lượt này<br>Không dùng vé / Luck · Không thưởng xu</p><button id="p-restart">Chơi lại</button></aside><div class="p-stage '+(game===6?'wide-stage':'')+'">'+body+'</div><footer id="p-status" class="panel" role="status">'+status+'</footer>'+(ended?'<div class="p-end panel" role="dialog" aria-label="Kết quả"><h2>'+ended+'</h2><p>'+stats+'</p><button id="p-again" class="primary">Chơi lại ↻</button></div>':'')+'</div>');
  $('close').textContent='← Về phố';$('p-restart').onclick=()=>{if(ended){reset();return;}$('p-restart').textContent='Bấm lần nữa để bắt đầu lại';$('p-restart').onclick=reset;};if(ended){$('p-again').onclick=reset;$('p-again').focus();}
  if(game>=2&&game<=5){
   $('p-zoom').onclick=()=>{zoomed=!zoomed;render();};
   if(zoomed){const viewport=document.querySelector<HTMLElement>('.p-stage')!,board=viewport.querySelector<HTMLElement>('.p-board')!;viewport.classList.add('zoomed');const w=game===2?7:game===4?8:9,h=game===5?10:w;board.style.width=w*84+'px';board.style.height=h*84+'px';board.style.minWidth=w*84+'px';
    let drag:{x:number;y:number;left:number;top:number}|null=null,moved=false;
    viewport.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};moved=false;};
    viewport.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>8){moved=true;viewport.setPointerCapture(e.pointerId);viewport.scrollLeft=drag.left-dx;viewport.scrollTop=drag.top-dy;}};
    viewport.onpointerup=()=>drag=null;viewport.onpointercancel=()=>drag=null;viewport.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false;}},true);
   }
  }
  const promotionSelect=document.getElementById('promotion') as HTMLSelectElement|null;
  if(promotionSelect){promotionSelect.value=String(promotion);promotionSelect.onchange=()=>{promotion=Number(promotionSelect.value);};}
  document.querySelectorAll<HTMLButtonElement>('#puzzle-screen [data-cell]').forEach(button=>button.onclick=()=>cell(Number(button.dataset.cell)));
  document.querySelectorAll<HTMLButtonElement>('#puzzle-screen [data-action]').forEach(button=>button.onclick=()=>action(button.dataset.action!));
 }
 function cell(i:number){if(ended||aiWait>0)return;
  if(game===0){const zero=b.indexOf(0);if(adjacent(i,zero,3)){[b[i],b[zero]]=[b[zero],b[i]];moves++;sound(500);if(b.every((v,j)=>v===(j+1)%9))return finish('Hoàn thành bức số!');}else status='Chọn ô nằm sát khoảng trống.';}
  if(game===2){if(selected<0){selected=i;}else if(selected===i)selected=-1;else if(!adjacent(selected,i,7))selected=i;else{const first=selected;selected=-1;[b[first],b[i]]=[b[i],b[first]];if(!matches(b,7,3).length){[b[first],b[i]]=[b[i],b[first]];status='Chưa tạo bộ 3, không mất nước.';}else{remaining--;let chain=0,found=matches(b,7,3);while(found.length&&chain<40){score+=found.length*10;found.forEach(j=>b[j]=0);collapse(b);chain++;found=matches(b,7,3);}status='Ghép đẹp! Liên hoàn '+chain+' lần.';sound(650);if(score>=500)return finish('Bạn thắng Match-3!');if(remaining===0)return finish('Hết nước! Thử thêm một lượt nhé.');if(found.length||!canSwap(b)){do{b=newMatch();}while(!canSwap(b));status+=' Đã xáo bàn để có nước đi.';}}}}
  if(game===3){if(b[i])selected=i;else if(selected>=0){if(!linePath(b,selected,i))status='Không có đường trống tới ô đó.';else{b[i]=b[selected];b[selected]=0;selected=-1;moves++;const found=matches(b,9,5,true);if(found.length){score+=found.length*10;found.forEach(j=>b[j]=0);sound(750);}else addBalls();if(score>=100)return finish('Bạn thắng Lines!');if(b.every(Boolean))return finish('Bàn đã đầy!');}}}
  if(game===4||game===5){if(chess.turn!==1)return;if(chess.cells[i]>0){selected=i;status=game===4?['','Tốt: đi thẳng, ăn chéo; bước đầu có thể đi 2 ô.','Mã: đi chữ L (2 + 1 ô), được nhảy qua quân.','Tượng (Tịnh): đi chéo, không nhảy qua quân.','Xe: đi ngang hoặc dọc, không nhảy qua quân.','Hậu: đi ngang, dọc hoặc chéo, không nhảy qua quân.','Vua: đi 1 ô; không được vào ô bị tấn công.'][chess.cells[i]]:'Chọn một ô được đánh dấu.';if(!legalMoves(chess).some(m=>m.from===i))status+=' Chưa có nước hợp lệ: bị chắn hoặc sẽ lộ vua/tướng.';}else if(selected>=0){const m=legalMoves(chess).find(m=>m.from===selected&&m.to===i&&(m.promotion===undefined||m.promotion===promotion));if(!m){status='Nước đi không hợp lệ: kiểm tra đường đi, quân chắn và an toàn của vua/tướng.';}else{chess=movePiece(chess,m);moves++;selected=-1;sound(500);if(endBoard())return;status='Máy đang suy nghĩ…';aiWait=.45;}}}
  if(game===6){if(oan.turn===0&&ownPits(0).includes(i)&&oan.pits[i]){selected=i;status='Đã chọn ô '+i+'. Chọn chiều rải.';}else status='Chọn ô dân có hạt ở hàng dưới.';}
  render();
 }
 function endBoard(){const result=boardResult(chess);if(result==='playing')return false;finish(result==='draw'?'Ván cờ hoà!':result==='win'?'Bạn thắng ván cờ!':'Máy thắng ván cờ.');return true;}
 function endOAn(){if(!oan.done)return false;const a=oan.scores[0]-oan.debt[0],b=oan.scores[1]-oan.debt[1];finish(a===b?'Ván ô ăn quan hoà!':a>b?'Bạn thắng ô ăn quan!':'Máy thắng ô ăn quan.');return true;}
 function action(name:string){if(ended||aiWait>0)return;
  if(game===1){if(name==='left'&&fits(b,piece,px-1,py))px--;if(name==='right'&&fits(b,piece,px+1,py))px++;if(name==='rotate'){const turned=rotate(piece);for(const dx of [0,-1,1,-2,2])if(fits(b,turned,px+dx,py)){piece=turned;px+=dx;break;}}
   if(name==='down'){if(fits(b,piece,px,py+1))py++;else lockPiece();}
   if(name==='drop'){while(fits(b,piece,px,py+1))py++;lockPiece();}render();
  }
  if(game===6){if(selected<0){status='Chọn ô dân trước nhé.';render();return;}direction=name==='ccw'?-1:1;oan=sowOAn(oan,selected,direction);selected=-1;moves++;sound(500);if(endOAn())return;status='Máy đang chọn ô…';aiWait=.5;render();}
  if(game===7&&name==='hook'&&hook==='swing'){hook='out';lockedAngle=angle;sound(400);}
 }
 function lockPiece(){piece.forEach(([x,y])=>b[(py+y)*10+px+x]=pieceColor);const cleared=clearRows(b);b=cleared.grid;lines+=cleared.count;score+=cleared.count*100;sound(cleared.count?750:280,.08);if(lines>=10){ended='Bạn thắng xếp gạch!';return;}spawnPiece();}
 function tick(dt:number){if(!active()||document.hidden)return;elapsed+=dt;
  if(ended){for(const code of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'])input.pressed(code);return;}
  if(aiWait>0){aiWait-=dt;if(aiWait<=0){if(game===4||game===5){const m=computerMove(chess);if(m)chess=movePiece(chess,m);if(endBoard())return;status=inCheck(chess)?'Bạn đang bị chiếu!':'Tới lượt bạn.';}else if(game===6){const options=ownPits(1).filter(i=>oan.pits[i]).flatMap(i=>[-1,1].map(d=>({s:sowOAn(oan,i,d),random:Math.random()})));options.sort((a,b)=>(b.s.scores[1]-a.s.scores[1])+(b.random-a.random)*.01);if(options.length)oan=options[0].s;if(endOAn())return;status='Tới lượt bạn.';}render();}}
  if(game===0)for(const [key,delta] of [['ArrowLeft',-1],['ArrowRight',1],['ArrowUp',-3],['ArrowDown',3]] as const)if(input.pressed(key)){const zero=b.indexOf(0),target=zero+delta;if(target>=0&&target<9&&adjacent(zero,target,3))cell(target);}
  if(game===1){for(const [key,act] of [['ArrowLeft','left'],['ArrowRight','right'],['ArrowUp','rotate'],['ArrowDown','down'],['Space','drop']])if(input.pressed(key))action(act);dropTime+=dt;if(dropTime>=Math.max(.14,.7-lines*.045)){dropTime=0;action('down');}}
  if(game===7){if(input.pressed('Space'))action('hook');seconds=Math.max(0,seconds-dt);if(seconds===0){finish('Hết giờ đào vàng!');return;}
   if(hook==='swing'){angle=Math.sin(elapsed*1.6)*1.05;length=20;}else if(hook==='out'){length+=300*dt;const x=300+Math.sin(lockedAngle)*length,y=25+Math.cos(lockedAngle)*length;const hit=nuggets.findIndex(n=>!n.taken&&Math.hypot(n.x-x,n.y-y)<n.r+6);if(hit>=0){caught=hit;hook='back';sound(600);}else if(length>440||x<15||x>585||y>440)hook='back';}else{length-=250*dt/(caught>=0?nuggets[caught].mass:1);if(length<=20){if(caught>=0){score+=nuggets[caught].value;$('p-stats').textContent=score+'/500 · '+Math.ceil(seconds)+' giây';nuggets[caught].taken=true;sound(800);$('nugget-'+caught).style.display='none';caught=-1;if(score>=500){finish('Bạn thắng đào vàng!');return;}}hook='swing';}}
   const a=hook==='swing'?angle:lockedAngle,rope=$('gold-rope');rope.style.height=length+'px';rope.style.transform='rotate('+(-a)+'rad)';if(caught>=0){const n=$('nugget-'+caught);n.style.left=(300+Math.sin(a)*length)+'px';n.style.top=(25+Math.cos(a)*length)+'px';}
   if(lastReadout!==Math.ceil(seconds)){lastReadout=Math.ceil(seconds);$('p-stats').textContent=score+'/500 · '+lastReadout+' giây';}
  }
 }
 return {active,open:(id:number)=>{if(!Number.isInteger(id)||id<0||id>=8)return;game=id;reset();},tick,state:()=>({puzzle:active()?puzzleNames[game]:'none',puzzleScore:score,puzzleResult:ended||'playing'})};
}
