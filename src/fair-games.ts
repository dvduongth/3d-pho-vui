import * as T from 'three';
import {ball, block} from './world';
import {style as C} from './style';
import {input} from './input';
import {settings} from './settings';
import {slide2048, canMove2048, birdHits, ringHit, type Direction} from './fair-rules';
import {fairNames} from './fair-npcs';
import './fair.css';

type Phase = 'ready' | 'playing' | 'result';
const directions: [string, Direction][] = [['ArrowLeft','left'],['ArrowRight','right'],['ArrowUp','up'],['ArrowDown','down'],['KeyA','left'],['KeyD','right'],['KeyW','up'],['KeyS','down']];

export function createFairGames(scene:T.Scene, camera:T.PerspectiveCamera, ui:HTMLElement, sound:(hz?:number,duration?:number)=>void, onClose:()=>void) {
  const overlay=document.createElement('section');overlay.id='fair';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Hội chợ Phố Vui');ui.append(overlay);
  settings.subscribe(()=>overlay.classList.toggle('fair-reduced',settings.get<boolean>('reducedMotion')));
  const stage=new T.Group();stage.position.x=1000;stage.visible=false;scene.add(stage);
  const birdStage=new T.Group(),ringStage=new T.Group();stage.add(birdStage,ringStage);
  const bird=new T.Group();birdStage.add(bird);
  ball(bird,C.gold,0,0,0,.48,.36,.32);ball(bird,C.cream,.28,.17,.24,.16);ball(bird,C.ink,.32,.18,.36,.055);
  const wing=ball(bird,C.pink,-.1,-.05,.28,.25,.12,.12);block(bird,C.gold,.5,-.02,0,.27,.12,.2);
  block(birdStage,C.leaf,0,-.4,0,30,.8,3);block(birdStage,C.cream,0,-.01,0,30,.12,3);
  for(let i=0;i<7;i++){ball(birdStage,i%2?C.pink:C.lavender,-10+i*3.5,1,-3,2,1.5,.7);ball(birdStage,C.cream,-10+i*3.5,8.7+(i%2)*.4,-4,.8,.28,.2);}
  const pipes=Array.from({length:3},(_,i)=>{
    const root=new T.Group();birdStage.add(root);
    const bottom=block(root,C.leaf,0,0,0,1.3,1,.9),top=block(root,C.leaf,0,0,0,1.3,1,.9);
    const lip1=block(root,C.gold,0,0,0,1.6,.22,1.1),lip2=block(root,C.gold,0,0,0,1.6,.22,1.1);
    return {root,bottom,top,lip1,lip2,x:7+i*7,gapY:5,gap:3.5,passed:false};
  });
  block(ringStage,C.wood,0,.3,0,11,.6,3);block(ringStage,C.cream,0,.66,0,10.8,.12,2.8);
  for(const [i,x] of [-3,0,3].entries()) {
    ball(ringStage,[C.lavender,C.leaf,C.pink][i],x,.95,0,.4,.25,.4);
    block(ringStage,C.gold,x,1.5,0,.2,1,.2);ball(ringStage,C.cream,x,2,0,.2);
  }
  for(const x of [-6,6]){block(ringStage,C.wood,x,3,-2,.2,6,.2);ball(ringStage,C.gold,x,5.5,-2,.45,.65,.4);}
  const hoop=new T.Mesh(new T.TorusGeometry(.62,.075,10,32),new T.MeshStandardMaterial({color:C.gold,metalness:.2,roughness:.4}));hoop.rotation.x=Math.PI/2;ringStage.add(hoop);
  const aim=new T.Mesh(new T.TorusGeometry(.65,.045,8,32),new T.MeshBasicMaterial({color:C.pink}));aim.rotation.x=Math.PI/2;aim.position.y=.76;ringStage.add(aim);
  // Stages reuse the town renderer and camera. Meshes are built once, not on retry.
  stage.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=false;});
  let game=-1,phase:Phase='ready',score=0,board=Array<number>(16).fill(0),won2048=false;
  let elapsed=0,birdY=5,birdVelocity=0,ringCount=0,ringFlight=-1,ringX=0,aimX=0;
  let focusBefore:HTMLElement|null=null;
  const cameraPosition=new T.Vector3(),cameraRotation=new T.Quaternion();
  const el=(id:string)=>overlay.querySelector<HTMLElement>('#'+id)!;
  function drain(){for(const [code] of directions)input.pressed(code);input.pressed('Space');input.pressed('KeyE');input.setStick(0,0);}
  function close(){if(game<0)return;game=-1;stage.visible=false;overlay.hidden=true;ui.classList.remove('fair-open');camera.position.copy(cameraPosition);camera.quaternion.copy(cameraRotation);drain();onClose();focusBefore?.focus();}
  function spawnTile(){const empty=board.map((v,i)=>v===0?i:-1).filter(i=>i>=0);if(empty.length)board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4;}
  function drawBoard(){
    const target=el('fair-grid');target.replaceChildren();
    board.forEach(v=>{const tile=document.createElement('div');tile.className='number-tile '+(v?'filled':'');tile.dataset.level=String(v?Math.min(5,Math.log2(v)):0);tile.textContent=v?String(v):'';tile.setAttribute('aria-label',v?String(v):'Ô trống');target.append(tile);});
    el('fair-score').textContent=String(score);
  }
  function result(title:string,detail:string){phase='result';el('fair-message').innerHTML='<h2></h2><p></p><button class="primary" id="fair-retry">Chơi lại ↻</button>';el('fair-message').querySelector('h2')!.textContent=title;el('fair-message').querySelector('p')!.textContent=detail;el('fair-message').hidden=false;el('fair-retry').onclick=reset;el('fair-retry').focus();sound(title.includes('Giỏi')||title.includes('2048')?880:240,.3);}
  function moveBoard(direction:Direction){
    if(game!==0||phase!=='playing')return;
    const next=slide2048(board,direction);if(!next.changed){el('fair-feedback').textContent='Hướng này chưa ghép được. Thử hướng khác nhé.';return;}
    board=next.board;score+=next.score;spawnTile();drawBoard();sound(next.score?660:340,.08);
    el('fair-feedback').textContent=next.score?'Ghép đẹp! +'+next.score+' điểm':'Tiếp tục tìm hai ô bằng nhau.';
    if(board.includes(2048)&&!won2048){won2048=true;result('Đã ghép được 2048!','Cô Mai: Giỏi quá! Bạn được '+score+' điểm.');}
    else if(!canMove2048(board))result('Bàn đã kín rồi!','Cô Mai: Bạn được '+score+' điểm. Thử giữ ô lớn ở một góc nhé.');
  }
  function action(){
    if(game<0||game===0||phase==='result')return;
    if(phase==='ready'){phase='playing';el('fair-message').hidden=true;}
    if(game===1){birdVelocity=5.4;sound(600,.07);}
    else if(ringFlight<0&&ringCount<5){ringFlight=0;ringX=aimX;ringCount++;sound(450,.1);el('fair-act').setAttribute('disabled','');}
  }
  function reset(){
    phase=game===0?'playing':'ready';score=0;elapsed=0;birdY=5;birdVelocity=0;ringCount=0;ringFlight=-1;won2048=false;drain();
    overlay.innerHTML=`<header class="fair-header panel"><div><small>HỘI CHỢ BÊN HỒ</small><h2>${fairNames[game]}</h2></div><div class="fair-points"><small>ĐIỂM</small><b id="fair-score">0</b></div><button id="fair-exit" aria-label="Về phố">← Về phố</button></header>
      <aside class="fair-help panel"><span class="fair-seal">${['2048','✦','◎'][game]}</span><h2>${['Ghép số thật khéo','Bay qua cổng sen','Một vòng thật chuẩn'][game]}</h2><p>${['Ghép hai ô bằng nhau. Mỗi nước đi xuất hiện một ô mới. Mục tiêu là ô 2048.','Chạm để vỗ cánh, giữ chim trong khoảng trống. Qua mỗi cổng được 1 điểm.','Canh vòng hồng trùng một cọc rồi ném. Có 5 vòng, trúng 3 vòng là thắng.'][game]}</p><p class="fair-local">Thử thách cá nhân<br>Không cược · Không thưởng xu<br>Điểm chỉ trong lượt chơi</p><p id="fair-feedback" role="status" aria-live="polite">${['Cô Mai: Giữ ô lớn ở một góc nhé!','Anh Bình: Nhẹ tay, đều nhịp nhé!','Chú Bảy: Canh đúng cọc rồi bấm nhé!'][game]}</p></aside>
      ${game===0?'<div class="fair-grid-wrap"><div id="fair-grid" role="group" aria-label="Bàn 2048"></div></div>':''}
      <div class="fair-bottom panel">${game===0?'<span>Phím mũi tên / WASD · Vuốt trên bàn</span><div class="fair-directions"><button data-dir="left" aria-label="Trượt trái">←</button><button data-dir="up" aria-label="Trượt lên">↑</button><button data-dir="down" aria-label="Trượt xuống">↓</button><button data-dir="right" aria-label="Trượt phải">→</button></div>':'<span id="fair-hint">'+(game===1?'Space / chạm nút để vỗ cánh':'5 vòng · Trúng 3 vòng để thắng')+'</span><button class="primary" id="fair-act">'+(game===1?'Vỗ cánh ↑':'Ném vòng ◎')+'</button>'}</div>
      <div class="fair-message panel" id="fair-message" ${game!==1?'hidden':''}><h2>Sẵn sàng cất cánh?</h2><p>Space hoặc nút Vỗ cánh để bắt đầu.</p></div>`;
    el('fair-exit').onclick=close;
    if(game===0){board=Array<number>(16).fill(0);spawnTile();spawnTile();drawBoard();overlay.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(b=>b.onclick=()=>moveBoard(b.dataset.dir as Direction));
      const grid=el('fair-grid');let start:{x:number;y:number}|null=null;
      grid.onpointerdown=e=>{start={x:e.clientX,y:e.clientY};grid.setPointerCapture(e.pointerId);};
      grid.onpointerup=e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.hypot(dx,dy)>16)moveBoard(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');};grid.onpointercancel=()=>start=null;
    }else el('fair-act').onclick=action;
    pipes.forEach((p,i)=>{p.x=7+i*7;p.gapY=4.2+i*.6;p.gap=3.5;p.passed=false;});
    hoop.position.set(0,1.3,4);hoop.visible=true;
    el('fair-exit').focus();
  }
  function open(index:number){if(game>=0)close();focusBefore=document.activeElement as HTMLElement;cameraPosition.copy(camera.position);cameraRotation.copy(camera.quaternion);game=index;overlay.hidden=false;ui.classList.add('fair-open');stage.visible=game!==0;birdStage.visible=game===1;ringStage.visible=game===2;reset();sound(660,.15);}
  overlay.addEventListener('keydown',e=>{if(e.key==='Tab'){const buttons=Array.from(overlay.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')).filter(b=>!b.closest('[hidden]'));const index=buttons.indexOf(document.activeElement as HTMLButtonElement);if(e.shiftKey&&index<=0){e.preventDefault();buttons.at(-1)?.focus();}else if(!e.shiftKey&&index===buttons.length-1){e.preventDefault();buttons[0]?.focus();}}});
  function update(dt:number){
    if(game<0)return;
    if(input.pressed('Escape')){close();return;}
    for(const [code,dir] of directions)if(input.pressed(code))moveBoard(dir);
    if(input.pressed('Space'))action();input.pressed('KeyE');
    if(document.hidden)return;
    elapsed+=dt;
    if(game===0)return;
    if(game===1){
      const gap=Math.max(2.6,3.5-score*.025),speed=3.2+Math.min(score*.08,2);
      if(phase==='playing'){
        birdVelocity-=13*dt;birdY+=birdVelocity*dt;
        for(const p of pipes){p.x-=speed*dt;if(!p.passed&&p.x < -4.5){p.passed=true;score++;sound(850,.08);}if(p.x< -12){p.x=Math.max(...pipes.map(q=>q.x))+7;p.gapY=3+Math.random()*4;p.gap=gap;p.passed=false;}}
        if(pipes.some(p=>birdHits(birdY,p.x,p.gapY,p.gap)))result('Hạ cánh rồi!','Anh Bình: Bạn vượt '+score+' cổng. Thử lại một chuyến nhé!');
      }
      bird.position.set(-3.5,birdY,0);bird.rotation.z=phase==='playing'?T.MathUtils.clamp(birdVelocity*.06,-.8,.4):0;
      wing.rotation.x=settings.get<boolean>('reducedMotion')?0:Math.sin(elapsed*18)*.8;
      for(const p of pipes){p.root.position.x=p.x;const low=p.gapY-p.gap/2,high=p.gapY+p.gap/2;p.bottom.position.y=low/2;p.bottom.scale.y=low;p.top.position.y=(10+high)/2;p.top.scale.y=10-high;p.lip1.position.y=low;p.lip2.position.y=high;}
      camera.position.set(1000,5,15/Math.min(camera.aspect,1.8));camera.position.z=Math.max(13.8,camera.position.z);camera.lookAt(1000,5,0);
    }else{
      if(ringFlight<0&&phase!=='result')aimX=Math.sin(elapsed*1.6)*4.3;
      aim.position.x=aimX;aim.visible=phase!=='result';
      if(ringFlight>=0&&phase==='playing'){
        ringFlight+=dt;const t=Math.min(1,ringFlight/.85);hoop.position.set(ringX*t,1.3+(Math.sin(t*Math.PI)*3)-t*.5,4*(1-t));hoop.rotation.z=Math.sin(t*Math.PI)*.25;
        if(t===1){const hit=ringHit(ringX);if(hit>=0){score++;sound(880,.18);}else sound(190,.14);el('fair-feedback').textContent=hit>=0?'Trúng cọc! Thêm 1 điểm.':'Vòng lệch rồi! Canh vòng hồng gần tâm cọc nhé.';ringFlight=-1;el('fair-act').removeAttribute('disabled');el('fair-hint').textContent='Còn '+(5-ringCount)+' vòng · Đã trúng '+score+'/3';if(ringCount===5)result(score>=3?'Giỏi quá, thắng rồi!':'Suýt được rồi!','Chú Bảy: Bạn ném trúng '+score+'/5 vòng.');}
      }
      camera.position.set(1000,8,13);camera.lookAt(1000,1,0);
    }
    el('fair-score').textContent=String(score);
  }
  return {open,close,update,active:()=>game>=0,state:()=>({fairGame:game<0?'none':['2048','flappy','rings'][game],fairPhase:phase,fairScore:score}),moveBoard};
}
