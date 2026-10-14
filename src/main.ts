import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { style as C } from './style';
import { settings } from './settings';
import { input } from './input';
import { actor,createWorld,places,rod,label,ball,block } from './world';
import { judgePull,needleAt,type Catch } from './fishing';
import { tuGreeting,tuCatchReply,type SessionCatch } from './tu-dialogue';
import { me,devSignIn,devSignOut,loadSaveResult,storeSave } from './backend';
import {createProgressStore,type Progress} from './progress';
import {createPresence} from './town-presence';
import {createLakeBoard} from './lake-board';
import {createFairGames} from './fair-games';
import {createFairNpcs,fairNames} from './fair-npcs';
import './game.css';
import './network-ui.css';
import {newCarnival} from './carnival';
import {createCarnivalUI} from './carnival-ui';
import {canUseAdminTools,supplyCarnival} from './admin-tools';
import './access.css';
import {createCarnivalStage} from './carnival-stage';
let carnival=newCarnival(),assisted=false;
let adminIdentity:{username:string}|null=null;

type Fishing={phase:'ready'}|{phase:'casting';started:number;practice:boolean;id:string}|{phase:'result';catch:Catch|null;message:string;retryAt:number;practice:boolean};
const state={started:false,name:'Bạn',coins:20,casts:30,fishCount:0,quest:0,played:0,practice:false,worn:0,owned:new Set([0]),fishing:null as Fishing|null,modal:'',emoteUntil:0,rideUntil:0,garden:0,gardenReady:0,animal:0,animalReady:0,dev:false};
const outfits=[{name:'Áo chiều tím',color:C.lavender,price:0},{name:'Áo lá non',color:C.leaf,price:16},{name:'Áo hoa sen',color:C.pink,price:20},{name:'Áo nắng mật',color:C.gold,price:24}];
const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
let audio:AudioContext|null=null,muted=false,toastUntil=0,clock=0,refillAt=Date.now(),cameraYaw=.22,orbitUntil=0,jumpV=0,jumpY=0,caroBoard=Array<number>(81).fill(0),caroDone=false,bet=0,caroActive=false;
let path:T.Vector3[]=[],pendingPlace=-1;
let latestSessionCatch:SessionCatch|null=null;
const claimedCasts=new Set<string>();
function sound(hz=520,duration=.14){if(muted||!settings.get<boolean>('sound'))return;if(!audio)audio=new AudioContext();void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(hz,audio.currentTime);o.frequency.exponentialRampToValueAtTime(hz*.7,audio.currentTime+duration);g.gain.setValueAtTime(settings.get('volume')*.2,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
function toast(text:string){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=clock+5;}
function modal(title:string,body:string){state.modal=title;state.fishing=null;$('fish').innerHTML='';$('modal').innerHTML='<section class="card panel" role="dialog" aria-modal="true"><button class="close" id="close" aria-label="Đóng">×</button><h2>'+title+'</h2>'+body+'</section>';$('close').onclick=closeModal;$('close').focus();sound(380);}
function closeModal(){if(caroActive){toast('Ván đang chơi đã khép lại; tiền cược đã đặt không hoàn lại.');caroActive=false;}state.modal='';$('modal').innerHTML='';sound(280);}
async function start(){
 const loadWindow=window as unknown as {loadingTimer:number};clearInterval(loadWindow.loadingTimer);$('loadbar').style.width='20%';$('loadpercent').textContent='20%';
 const host=$('game');const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=C.toneMapping;renderer.toneMappingExposure=C.exposure;renderer.shadowMap.enabled=true;host.append(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color(C.sky);scene.fog=new T.Fog(C.sky,45,110);
 const env=new T.PMREMGenerator(renderer);scene.environment=env.fromScene(new RoomEnvironment(),.04).texture;env.dispose();
 const hemi=new T.HemisphereLight('#eed4ef','#82728a',.9);scene.add(hemi);
 const sun=new T.DirectionalLight(C.sun,2.4);sun.position.set(...C.sunPosition);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun,sun.target);
 const camera=new T.PerspectiveCamera(48,1,.1,160);camera.position.set(15,15,25);camera.lookAt(0,1,0);
 const world=createWorld(scene);const lakeBoard=createLakeBoard(scene);places.push({name:'Bảng hồ sen',kind:'board',x:-3,z:11.5});const fairNpcs=createFairNpcs(scene);const clickableNpcs=[...world.npcs.map(n=>n.root),...fairNpcs];settings.subscribe(()=>{world.water.material.color.set(settings.get<string>('waterColor'));state.casts=Math.min(state.casts,settings.get('maxCasts'));});state.casts=settings.get('maxCasts');
 const player=actor(C.lavender);player.root.position.set(0,.4,14);scene.add(player.root);
 const scooter=new T.Group();block(scooter,C.lavender,0,.16,0,.65,.22,1.4);for(const z of [-.5,.5])ball(scooter,C.ink,0,0,z,.18,.22,.22);rod(scooter,C.wood,new T.Vector3(0,.2,.55),new T.Vector3(0,1.2,.55),.045);block(scooter,C.gold,0,1.2,.55,.65,.08,.1);player.root.add(scooter);scooter.visible=false;
 const sunDisc=new T.Mesh(new T.SphereGeometry(3.5,24,16),new T.MeshBasicMaterial({color:'#ffdc9b',fog:false}));sunDisc.position.set(-20,14,-47);scene.add(sunDisc);
 const sky=new T.Mesh(new T.SphereGeometry(120,32,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#8b81b2')},bottom:{value:new T.Color('#f2b897')}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform vec3 top;
uniform vec3 bottom;
varying vec3 v;
void main() {
float h=smoothstep(-8.,45.,v.y);
gl_FragColor=vec4(mix(bottom,top,h),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}` }));scene.add(sky);
 const nameLabel=label('Bạn · Cư dân mới');scene.add(nameLabel);
 const fishingRod=new T.Group();rod(fishingRod,C.wood,new T.Vector3(.4,1.1,.3),new T.Vector3(.6,3.7,2.2),.035);player.root.add(fishingRod);fishingRod.visible=false;
 const fishingLine=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:C.cream}));scene.add(fishingLine);fishingLine.visible=false;
 const arrow=new T.Mesh(new T.ConeGeometry(.35,.8,3),new T.MeshStandardMaterial({color:C.gold,emissive:C.gold,emissiveIntensity:.25}));scene.add(arrow);
 const particlePositions=new Float32Array(120*3),velocities=new Float32Array(120*3);let burstLife=0;const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(particlePositions,3));const sparks=new T.Points(pg,new T.PointsMaterial({color:C.gold,size:.13,transparent:true,opacity:0}));scene.add(sparks);
 function burst(){burstLife=1.3;for(let i=0;i<120;i++){particlePositions[i*3]=player.root.position.x;particlePositions[i*3+1]=2;particlePositions[i*3+2]=player.root.position.z;velocities[i*3]=(Math.random()-.5)*5;velocities[i*3+1]=Math.random()*5;velocities[i*3+2]=(Math.random()-.5)*5;}sound(860,.3);}
 const ui=document.createElement('div');ui.id='ui';if(matchMedia('(pointer:coarse)').matches)ui.classList.add('touchmode');host.append(ui);
 ui.innerHTML=`<div class="profile panel"><div class="avatarIcon">✿</div><div><strong id="username">Bạn</strong><span class="sub">Cư dân mới · Phố Vui</span></div></div>
 <div class="location"><b>HỒ SEN</b><div>Một chiều ở Phố Vui</div></div>
 <div class="topright"><div class="chip panel" id="time">☀ 16:30</div><div class="chip panel" id="coins">◉ 20</div><button id="mute" aria-label="Bật tắt âm thanh">♫</button><button id="settings" aria-label="Cài đặt">⚙</button></div>
 <div class="objective panel hidden" id="objective"><b>↗ Ghé thăm ông Tư</b><small>Theo mũi tên bên hồ · E để trò chuyện</small></div>
 <div class="toast" id="toast" role="status" aria-live="polite"></div>
 <div class="welcome" id="welcome"><span class="eyebrow">CHÀO MỪNG VỀ PHỐ</span><h1>Phố Vui</h1><p>Một chiếc cần câu.<br>Một chiều bình yên.<br>Và những người bạn mới.</p><div class="sub">Chọn màu áo của bạn</div><div class="swatches" id="swatches"></div><button class="primary" id="enter">Vào phố →</button><p class="sub">Câu cá mô phỏng · NPC trong phố<br>WASD để đi · Space để nhảy</p></div>
 <div class="actions panel hidden" id="actions"><button id="interact"><span>♧</span>Gặp gỡ</button><button id="wardrobe"><span>♧</span>Tủ đồ</button><button id="wave"><span>✋</span>Vẫy chào</button><button id="photo"><span>▣</span>Chụp ảnh</button><button id="fairmap"><span>♜</span>Trò chơi</button></div>
 <div class="hint hidden" id="hint">WASD / chạm đường để đi · E tương tác · Space nhảy · Kéo chuột giữa để xoay</div>
 <div class="notice connectionbar"><button id="savestatus">Đang tải tiến độ…</button><button id="roomstatus">Hàng xóm · Chưa kết nối</button></div>
 <div class="touch stick hidden" id="stick"><div class="knob" id="knob"></div></div><div class="touch touchbuttons hidden" id="touchbuttons"><button id="touchE">✋<br>Gặp</button><button id="touchJump">↑<br>Nhảy</button></div>
 <div id="fish"></div><div class="modal" id="modal"></div>`;

 const fair=createFairGames(scene,camera,ui,sound,()=>{state.modal='';path=[];pendingPlace=-1;});
 function gamePicker(){
  if(state.fishing?.phase==='casting')return toast('Giật cá hoặc đóng lượt câu trước nhé.');
  modal('Chọn trò chơi','<p>Bấm Chơi ngay để mở trò. Không cần đi tìm NPC.</p><div class="game-picker">'+[{name:'Câu cá · Ông Tư',place:0,note:'Canh kim, giật cá'},{name:'Caro · Chị Hoa',place:2,note:'Có chế độ 0 xu'},...fairNames.map((name,i)=>({name,place:i+6,note:i<3?'Miễn phí · Chơi ngay':'1 vé / lượt · Có quầy mua vé'})),{name:'Vườn · Cô Lan',place:3,note:'Mở theo thời gian chơi'},{name:'Chuồng · Chú Sáu',place:-1,note:'Mở theo thời gian chơi'}].map(g=>'<button data-play="'+g.place+'">'+g.name+'<small>'+g.note+'</small></button>').join('')+'</div>');
  document.querySelectorAll<HTMLButtonElement>('[data-play]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.play);closeModal();path=[];pendingPlace=-1;if(i===-1)animal();else interactPlace(i);});
 }
 $('fairmap').onclick=gamePicker;
 function adminPanel(){
  if(!canUseAdminTools(adminIdentity))return;
  modal('Công cụ thử nghiệm · duongdv','<div class="admin-tools"><p>Chỉ tác động bản mô phỏng của tài khoản này. Đây không phải quyền quản trị server.</p><p id="admin-feedback" role="status"></p><button id="admin-supply" class="primary">Cấp vé, tiền, Luck và quà đổi</button><button id="admin-unlock">Mở vườn, chuồng, ảnh, xe và đủ áo</button><button id="admin-casts">Nạp đầy lượt câu, kết thúc thời gian chờ</button><button id="admin-play">Mở danh sách trò chơi</button></div>');
  const apply=(fn:()=>void)=>{if(!canUseAdminTools(adminIdentity))return;if(!saves.canChange()){$('admin-feedback').textContent='Chưa tải xong tiến độ. Bấm trạng thái lưu để thử lại; chưa cấp vật phẩm.';return;}fn();assisted=true;saves.changed();void saves.flush();$('admin-feedback').textContent='Đã áp dụng cho bản mô phỏng. '+$('savestatus').textContent;sound(800);};
  $('admin-supply').onclick=()=>apply(()=>{supplyCarnival(carnival);state.coins=Math.max(state.coins,1000);});
  $('admin-unlock').onclick=()=>apply(()=>{state.played=Math.max(state.played,settings.get('unlockSeconds')*2+1);state.owned=new Set([0,1,2,3]);});
  $('admin-casts').onclick=()=>apply(()=>{state.casts=settings.get('maxCasts');refillAt=Date.now();state.gardenReady=clock;state.animalReady=clock;});
  $('admin-play').onclick=gamePicker;
 }
 const adminButton=document.createElement('button');adminButton.className='admin-entry';adminButton.textContent='⚒ Thử nghiệm';adminButton.hidden=true;adminButton.onclick=adminPanel;ui.append(adminButton);
 let lastSaveSignature='',lastProgressSave=0,restored=false;
 const saves=createProgressStore(
  ():Progress=>({version:1,coins:state.coins,owned:[...state.owned],worn:state.worn,fishCount:state.fishCount,quest:state.quest,played:state.played,casts:state.casts,refillAt,latestCatch:latestSessionCatch,garden:state.garden,gardenWait:Math.max(0,state.gardenReady-clock),animal:state.animal,animalWait:Math.max(0,state.animalReady-clock),claimedCasts:[...claimedCasts].slice(-128),muted,assisted,carnival:structuredClone(carnival)}),
  saved=>{
   const keepFreeGame=fair.active();
   assisted=saved.assisted??false;
   carnival=saved.carnival?structuredClone(saved.carnival):newCarnival();
   state.coins=saved.coins;state.owned=new Set(saved.owned);state.worn=saved.worn;state.fishCount=saved.fishCount;state.quest=saved.quest;state.played=saved.played;state.casts=Math.min(saved.casts,settings.get('maxCasts'));refillAt=saved.refillAt;
   latestSessionCatch=saved.latestCatch;state.garden=saved.garden;state.gardenReady=clock+saved.gardenWait;state.animal=saved.animal;state.animalReady=clock+saved.animalWait;muted=saved.muted;
   claimedCasts.clear();saved.claimedCasts.forEach(id=>claimedCasts.add(id));
   (player.body.material as T.MeshStandardMaterial).color.set(outfits[state.worn].color);
   state.fishing=null;state.modal=keepFreeGame?'Hội chợ':'';$('modal').innerHTML='';fishPanel();updateQuest();restored=true;
   $('mute').textContent=muted?'♪̸':'♫';lastSaveSignature='';lastProgressSave=clock;
  },
  text=>{$('savestatus').textContent=text;},
  {load:loadSaveResult,store:storeSave},localStorage
 );
 const carnivalStage=createCarnivalStage(scene,camera);
 const carnivalUI=createCarnivalUI(()=>carnival,()=>saves.changed(),modal,sound,()=>saves.canChange());
 const presence=createPresence(scene,
  ()=>({x:player.root.position.x,y:player.root.position.y,z:player.root.position.z,yaw:player.root.rotation.y,shirt:state.worn}),
  p=>{if(walkable(p.x,p.z)){player.root.position.set(p.x,.4,p.z);player.root.rotation.y=p.yaw;path=[];}},
  text=>{$('roomstatus').textContent=text;},
  result=>toast(tuCatchReply(result.name,result.species,result.weight,false))
 );
 $('savestatus').onclick=()=>void saves.retry();
 function roomPanel(){
  modal('Hàng xóm trong phố','<h3 id="roomtitle"></h3><p id="roomdetail"></p><p class="sub">Phòng world của nền tảng: tối đa 50 người. Mục tiêu thiết kế của Phố Vui: 30 người. Kết quả câu cá do máy người chơi tính, chưa xác thực server.</p><button class="primary" id="joinroom">Vào / kết nối lại</button> <button id="leaveroom">Rời phòng</button>');
  $('roomtitle').textContent=presence.status();
  $('roomdetail').textContent=presence.connected()?(presence.persisted()?'Phòng giữ vị trí và lịch sử gần đây.':'Tiến độ phòng không được giữ khi mọi người rời đi.'):'Bạn vẫn có thể khám phá phố và chơi với NPC.';
  $('joinroom').onclick=()=>{closeModal();void presence.connect();};
  $('leaveroom').onclick=()=>{presence.leave();closeModal();};
 }
 $('roomstatus').onclick=roomPanel;
 function boardPanel(){
  modal('Bảng hồ sen','<div class="badge">THI ĐẤU · CHƯA CÓ KẾT QUẢ XÁC THỰC</div><p>Chưa có cơ chế chấm thi và xác thực kết quả trên server. Cá mô phỏng và luyện tập không được xếp hạng ở đây.</p><h3>Chuyện câu cá trong phố</h3><p class="sub">Mô phỏng do người chơi gửi · Không phải bảng thi đua</p><div id="towncatches"></div>');
  const target=$('towncatches'),items=presence.history().slice(-3).reverse();
  if(!items.length)target.textContent='Chưa có lời báo cá nào từ hàng xóm.';
  for(const c of items){const row=document.createElement('p');row.className='catchline';row.textContent=c.name+' · '+c.species+' '+c.weight.toLocaleString('vi-VN',{maximumFractionDigits:2})+' kg · Mô phỏng';target.append(row);}
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden){saves.changed();void saves.flush();}});
 function updateQuest(){const texts=[['↗ Ghé thăm ông Tư','Theo mũi tên bên hồ · E để trò chuyện'],['♧ Câu thử một con','Canh kim giữa vùng bắt rồi nhấn Space'],['♧ Mặc một chiếc áo mới','Tủ đồ có áo từ 16 xu'],['✿ Phố đã quen bạn','Khám phá bàn caro và tận hưởng hồ sen']];const t=texts[Math.min(3,state.quest)];$('objective').innerHTML='<b>'+t[0]+'</b><small>'+t[1]+'</small>';}
 function wear(i:number){if(!saves.canChange())return toast('Đang tải tiến độ, đợi một chút nhé.');if(restored&&!state.owned.has(i))return toast('Áo này chưa sở hữu. Ghé tủ đồ trong phố để mua nhé.');state.worn=i;if(!state.started&&!restored)state.owned=new Set([0,i]);(player.body.material as T.MeshStandardMaterial).color.set(outfits[i].color);sound(640);}
 outfits.forEach((o,i)=>{const b=document.createElement('button');b.className='swatch';b.style.background=o.color;b.ariaLabel=o.name;b.onclick=()=>wear(i);$('swatches').append(b);});
 const random=document.createElement('button');random.textContent='⚄';random.ariaLabel='Chọn ngẫu nhiên';random.onclick=()=>wear(Math.floor(Math.random()*4));$('swatches').append(random);
 $('enter').onclick=()=>{if(!restored&&saves.canChange())state.owned=new Set([state.worn,0]);state.started=true;ui.classList.add('playing');$('welcome').remove();for(const id of ['objective','actions','hint','stick','touchbuttons'])$(id).classList.remove('hidden');toast('Ông Tư: Chào '+state.name+'! Ghé bên hồ câu cá với bác nhé.');sound();updateQuest();};
 $('mute').onclick=()=>{muted=!muted;$('mute').textContent=muted?'♪̸':'♫';if(!muted)sound();};
 function wardrobe(){if(!saves.canChange())return toast('Chưa tải được tiến độ. Bấm trạng thái lưu để thử lại.');modal('Tủ đồ của bạn','<p class="sub">Mua một lần, mặc ngay trong phiên này.</p>'+outfits.map((o,i)=>'<div class="row"><span class="shirt" style="color:'+o.color+'">♟</span><div><b>'+o.name+'</b><div class="sub">'+(state.owned.has(i)?'Đã sở hữu':o.price+' xu')+'</div></div><button data-wear="'+i+'">'+(state.worn===i?'Đang mặc':state.owned.has(i)?'Mặc':'Mua')+'</button></div>').join(''));
  document.querySelectorAll<HTMLButtonElement>('[data-wear]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.wear),o=outfits[i];if(state.owned.has(i)){wear(i);wardrobe();return;}if(state.coins<o.price){toast('Cần thêm '+(o.price-state.coins)+' xu. Câu cá cùng ông Tư nhé!');return;}modal('Mua '+o.name+'?','<p>Đổi '+o.price+' xu lấy áo và mặc ngay.</p><button id="cancelbuy">Quay lại</button> <button class="primary" id="buy">Mua · '+o.price+' xu</button>');$('cancelbuy').onclick=wardrobe;$('buy').onclick=()=>{state.coins-=o.price;state.owned.add(i);wear(i);if(state.quest===2)state.quest=3;updateQuest();burst();toast('Tiệm Mây: '+state.name+' mặc màu này thật hợp!');wardrobe();};});
 }
 $('wardrobe').onclick=()=>{if(state.fishing?.phase==='casting')return toast('Giật cá hoặc đóng lượt câu trước nhé.');wardrobe();};
 $('wave').onclick=()=>{state.emoteUntil=clock+3;toast('Hàng xóm: Chào '+state.name+'! Một chiều thật đẹp nhỉ.');sound(700);};
 $('photo').onclick=()=>{if(state.played<settings.get('unlockSeconds')){locked('Chụp ảnh');return;}renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pho-vui.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã chụp một chiều bên hồ sen.');},'image/jpeg',.9);};
 $('settings').onclick=()=>{modal('Một chút tuỳ chỉnh','<p>Âm thanh và góc nhìn cho một chiều thư thái.</p><div class="row"><b>Âm thanh</b><button id="soundtoggle">'+(muted?'Bật':'Tắt')+'</button></div><div class="row"><b>Chất lượng</b><button id="quality">Đổi mức bóng</button></div><div class="row"><b>Camera</b><button id="resetcamera">Về góc ban đầu</button></div><p class="sub">Đi bằng WASD hoặc chạm đường. E để gặp NPC. Space để nhảy / giật cá. Xoay bằng chuột giữa hoặc vuốt bên phải.</p>'+(state.dev?'<button id="logout">Logout</button>':''));$('soundtoggle').onclick=()=>{muted=!muted;$('soundtoggle').textContent=muted?'Bật':'Tắt';};$('quality').onclick=()=>{renderer.shadowMap.enabled=!renderer.shadowMap.enabled;toast(renderer.shadowMap.enabled?'Đã bật bóng đổ':'Đã tắt bóng đổ');};$('resetcamera').onclick=()=>{cameraYaw=0;closeModal();};if(import.meta.env.DEV&&state.dev)$('logout').onclick=()=>{devSignOut();modal('Đổi người chơi','<form id="signin"><input id="email" type="email" required placeholder="Email"><button type="submit">Tiếp tục</button></form>');$('signin').onsubmit=e=>{e.preventDefault();devSignIn($<HTMLInputElement>('email').value);};};};
 function fishPanel(){
  const f=state.fishing;if(!f){$('fish').innerHTML='';return;}
  const practice=f.phase==='ready'?(state.practice||state.casts<=0):f.practice;
  let body='<div class="badge">'+(practice?'LUYỆN TẬP · KHÔNG THƯỞNG':'CÂU MÔ PHỎNG · '+state.casts+' LƯỢT')+'</div>';
  if(f.phase==='casting')body+='<p>Cá đang rỉa mồi… canh đúng tâm!</p><div class="meter"><div class="zone" id="zone"></div><div class="best" id="best"></div><div class="needle" id="needle"></div></div><div class="meterlabels"><span>Sớm</span><b>✦ CHUẨN</b><span>Muộn</span></div><button class="primary" id="fishaction">Giật! <small>Space</small></button>';
  else if(f.phase==='result')body+='<div class="result">'+(f.catch?'✦ '+f.catch.species+' · '+f.catch.weight.toFixed(2)+' kg':'Cá thoát mất rồi!')+'</div><p>'+f.message+'</p><button class="primary" id="fishaction">Thả lại →</button>';
  else body+='<p id="tugreeting"></p><div class="sub">Canh kim vào vùng xanh rồi giật · Tâm là cá lóc</div><button class="primary" id="fishaction">Thả câu <small>E</small></button><button id="practice" style="margin-top:12px;width:100%">'+(state.practice?'Đổi sang câu mô phỏng':'Chọn luyện tập')+'</button><p class="sub">Hụt không mất lượt · Hồi 1 lượt / '+settings.get('refillMinutes')+' phút trong phiên.</p>';
  $('fish').innerHTML='<section class="fishcard panel"><button class="close" id="fishclose" aria-label="Rời hồ">×</button><h2>Hồ cá ông Tư</h2>'+body+'<div class="sub">Chỉ trong phiên này · Chưa xác thực server</div></section>';
  if(f.phase==='ready')$('tugreeting').textContent=tuGreeting(state.name,latestSessionCatch);
  $('fishclose').onclick=()=>{state.fishing=null;fishPanel();};$('fishaction').onclick=fishAction;
  if(f.phase==='ready')$('practice').onclick=()=>{state.practice=!state.practice;fishPanel();};
 }
 function fishAction(){
  if(!saves.canChange())return toast('Đang tải tiến độ.');
  const f=state.fishing;if(!f)return;
  if(f.phase==='casting'){
   const elapsed=clock-f.started,pos=needleAt(elapsed,settings.get('needleSeconds')),catchResult=judgePull(pos,settings.get('catchZone'),settings.get('bestZone'));
   if(catchResult)catchResult.coins=settings.get(catchResult.species==='Cá lóc'?'snakeheadCoins':catchResult.species==='Cá chép'?'carpCoins':'perchCoins');
   const towardRight=(elapsed/settings.get('needleSeconds'))%2<1;
   const message=catchResult?(f.practice?'Luyện tập hoàn thành · Không nhận xu.':'+'+catchResult.coins+' xu · Chuẩn '+Math.round(catchResult.accuracy*100)+'%'):((pos<.5)===towardRight?'Sớm quá! Đợi kim tiến vào vùng bắt.':'Muộn rồi! Giật sớm hơn một chút.');
   state.fishing={phase:'result',catch:catchResult,message,retryAt:clock+settings.get('retrySeconds'),practice:f.practice};
   if(catchResult){if(!f.practice&&!claimedCasts.has(f.id)){claimedCasts.add(f.id);if(claimedCasts.size>128)claimedCasts.delete(claimedCasts.values().next().value as string);presence.shareCatch(f.id,catchResult.species,catchResult.weight);state.casts--;state.coins+=catchResult.coins;state.fishCount++;latestSessionCatch={source:'simulation',species:catchResult.species,weight:catchResult.weight};if(state.quest===1)state.quest=2;updateQuest();}burst();toast(tuCatchReply(state.name,catchResult.species,catchResult.weight,f.practice));state.emoteUntil=clock+2;}else sound(180,.3);
  }else{if(f.phase==='result'&&clock<f.retryAt)return;state.fishing={phase:'casting',id:crypto.randomUUID(),started:clock,practice:state.practice||state.casts<=0};sound(350);}
  fishPanel();
 }
 function openFish(){if(!saves.canChange())return toast('Đang tải tiến độ.');if(state.quest===0){state.quest=1;state.coins+=24;toast('Ông Tư: '+state.name+', câu thử một con nhé! Bác tặng 24 xu.');updateQuest();}state.fishing={phase:'ready'};state.modal='';$('modal').innerHTML='';path=[];player.root.rotation.y=Math.PI;fishPanel();}
 function lineWin(board:number[],index:number):boolean{const who=board[index],x=index%9,y=Math.floor(index/9);return [[1,0],[0,1],[1,1],[1,-1]].some(([dx,dy])=>{let count=1;for(const sign of [-1,1])for(let s=1;s<5;s++){const xx=x+dx*s*sign,yy=y+dy*s*sign;if(xx<0||xx>=9||yy<0||yy>=9||board[yy*9+xx]!==who)break;count++;}return count>=5;});}
 function startCaro(){if(!saves.canChange())return toast('Đang tải tiến độ.');modal('Caro cùng chị Hoa','<p>Nối 5 quân liên tiếp để thắng.<br>Ván không cược chơi không giới hạn.</p><label>Cược <select id="bet"><option value="0">0 xu</option><option value="5">5 xu</option><option value="10">10 xu</option><option value="20">20 xu</option></select></label><p><button class="primary" id="carostart">Bắt đầu ván</button></p>');$('carostart').onclick=()=>{bet=Number($<HTMLSelectElement>('bet').value);if(bet>state.coins)return toast('Chưa đủ xu cho mức cược này.');state.coins-=bet;caroBoard.fill(0);caroDone=false;caroActive=true;drawCaro('Bạn đi trước · Quân X');};}
 function drawCaro(message:string){modal('Caro cùng chị Hoa','<div class="sub">'+message+'</div><div class="board">'+caroBoard.map((v,i)=>'<button data-cell="'+i+'" aria-label="Ô '+(i+1)+'" style="color:'+(v===1?C.water:C.wood)+'">'+(v===1?'×':v===2?'○':'')+'</button>').join('')+'</div>'+(caroDone?'<button class="primary" id="againcaro">Chơi lại</button>':'<p class="sub">5 quân liên tiếp · Cược '+bet+' xu</p>'));
  if(caroDone){$('againcaro').onclick=startCaro;return;}
  document.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.cell);if(caroBoard[i]||caroDone)return;caroBoard[i]=1;sound(600,.07);if(lineWin(caroBoard,i)){caroDone=true;caroActive=false;state.coins+=bet*2;burst();drawCaro('Bạn thắng! '+(bet?'Nhận '+bet*2+' xu.':'Ván cờ thật hay!'));return;}const empty=caroBoard.map((v,j)=>v?-1:j).filter(j=>j>=0);if(!empty.length){caroDone=true;caroActive=false;state.coins+=bet;drawCaro('Hoà! Hoàn lại tiền cược.');return;}
   let chosen=empty[0],high=-1;for(const j of empty){let score=4-Math.hypot(j%9-4,Math.floor(j/9)-4)*.1;for(const who of [2,1]){caroBoard[j]=who;if(lineWin(caroBoard,j))score+=who===2?10000:5000;for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let n=0;for(const s of [-2,-1,1,2]){const x=j%9+dx*s,y=Math.floor(j/9)+dy*s;if(x>=0&&x<9&&y>=0&&y<9&&caroBoard[y*9+x]===who)n++;}score+=n*n;}}caroBoard[j]=0;if(score>high){high=score;chosen=j;}}
   caroBoard[chosen]=2;if(lineWin(caroBoard,chosen)){caroDone=true;caroActive=false;drawCaro('Chị Hoa thắng. Thử một ván nữa nhé!');}else drawCaro('Tới lượt bạn · Quân X');
  });
 }

 function locked(feature:string,stage=1){toast(feature+' mở sau '+Math.round(settings.get('unlockSeconds')*stage/60)+' phút chơi trong phiên.');}
 function animal(){
  if(state.played<settings.get('unlockSeconds')*2)return locked('Chuồng',2);
  const actions=['Cho gà ăn','Thay nước','Lót ổ','Nhặt trứng'];
  
  modal('Chuồng chú Sáu','<p>Chăm đàn gà qua bốn bước. Mỗi bước cần đợi một chút.</p><p class="sub">Bước '+(state.animal+1)+' / 4</p><button class="primary" id="care">'+actions[state.animal]+'</button>');
  $('care').onclick=()=>{
   if(clock<state.animalReady)return toast('Đàn gà đang nghỉ, còn '+Math.max(0,Math.ceil(state.animalReady-clock))+' giây.');
   if(state.animal===3){state.coins+=6;state.animal=0;burst();toast('Chú Sáu: Cảm ơn nhé! Bán trứng được 6 xu.');}
   else{state.animal++;toast('Chú Sáu: Tốt lắm, để đàn gà nghỉ một chút nhé.');}
   state.animalReady=clock+settings.get('growSeconds');animal();
  };
 }
 function garden(){
  if(!saves.canChange())return toast('Đang tải tiến độ.');
  if(state.played<settings.get('unlockSeconds'))return locked('Vườn cô Lan');
  const names=['Gieo hạt · 4 xu','Tưới nước','Kiểm tra rau','Thu hoạch','Bán rau · +10 xu'];
  if(state.garden===2&&clock>=state.gardenReady)state.garden=3;
  modal('Vườn cô Lan','<p>Gieo, tưới, đợi rau lớn rồi thu hoạch.</p><button class="primary" id="gardenaction">'+names[state.garden]+'</button><p class="sub">Chuồng mở sau '+Math.round(settings.get('unlockSeconds')*2/60)+' phút chơi.</p>'+(state.played>=settings.get('unlockSeconds')*2?'<button id="animal">Chăm đàn gà</button>':''));
  $('gardenaction').onclick=()=>{
   if(state.garden===0){if(state.coins<4)return toast('Hạt giống giá 4 xu.');state.coins-=4;state.garden=1;}
   else if(state.garden===1){state.garden=2;state.gardenReady=clock+settings.get('growSeconds');}
   else if(state.garden===2){if(clock>=state.gardenReady)state.garden=3;else toast('Rau đang lớn, còn '+Math.ceil(state.gardenReady-clock)+' giây.');}
   else if(state.garden===3)state.garden=4;
   else{state.coins+=10;state.garden=0;burst();}
   garden();
  };
  if(state.played>=settings.get('unlockSeconds')*2)$('animal').onclick=animal;
 }
 function interactPlace(i:number){
  if(i>=9){if(!saves.canChange()){modal('Đang tải tiến độ','<p>Trò dùng vé cần tải ví trước. Bạn có thể chơi ngay 2048, Chim bay hoặc Ném vòng miễn phí trong danh sách trò.</p><button id="backgames">Chọn trò miễn phí</button>');$('backgames').onclick=gamePicker;return;}state.fishing=null;fishPanel();closeModal();path=[];pendingPlace=-1;carnivalUI.open(i-9);return;}
  if(i>=6){state.fishing=null;fishPanel();closeModal();path=[];pendingPlace=-1;state.modal='Hội chợ';fair.open(i-6);return;}
  if(i===5){boardPanel();return;}
  if(!saves.canChange())return toast('Đang tải tiến độ.');
  sound();
  if(i===0)openFish();else if(i===1)wardrobe();else if(i===2)startCaro();else if(i===3)garden();
  else {
   if(state.played<settings.get('unlockSeconds'))return locked('Thuê xe');
   const price=settings.get('ridePrice'),seconds=settings.get('rideSeconds');
   modal('Trạm xe bên hồ','<p>Thuê xe dạo phố trong '+seconds+' giây · '+price+' xu.</p><button class="primary" id="rent">Thuê · '+price+' xu</button>');
   $('rent').onclick=()=>{const cost=settings.get('ridePrice');if(state.coins<cost)return toast('Bạn cần '+cost+' xu để thuê xe.');state.coins-=cost;state.rideUntil=clock+settings.get('rideSeconds');closeModal();toast('Đã thuê xe! Chúc bạn một chuyến dạo phố vui vẻ.');};
  }
 }
 function nearest(){let index=0,d=Infinity;places.forEach((p,i)=>{const n=Math.hypot(p.x-player.root.position.x,p.z-player.root.position.z);if(n<d){d=n;index=i;}});return {index,d};}
 function interact(){if(state.fishing){fishAction();return;}const n=nearest();if(n.d<3.2)interactPlace(n.index);else{goTo(places[n.index].x,places[n.index].z);pendingPlace=n.index;toast('Đang tới '+places[n.index].name);}}
 $('interact').onclick=interact;$('touchE').onclick=interact;$('touchJump').onclick=()=>{input.press('Space');input.release('Space');};
 // Grid A* keeps tap navigation on the ring and bridges.
 function walkable(x:number,z:number){if(Math.abs(x)>19||z>19||z< -19)return false;const r=Math.hypot(x,z);if(r<10.2&&Math.abs(Math.abs(z)-6)>1.05)return false;for(const [bx,bz] of [[-10,-6],[10,-7],[-15,-15],[0,-22],[15,-22]])if(Math.abs(x-bx)<2.9&&Math.abs(z-bz)<2.4)return false;return true;}
 function goTo(tx:number,tz:number){const sx=Math.round(player.root.position.x),sz=Math.round(player.root.position.z);let gx=Math.round(tx),gz=Math.round(tz);if(!walkable(gx,gz)){let best=Infinity;for(let x=-19;x<=19;x++)for(let z=-19;z<=19;z++)if(walkable(x,z)){const d=Math.hypot(x-tx,z-tz);if(d<best){best=d;gx=x;gz=z;}}}
  const key=(x:number,z:number)=>x+','+z,open=[{x:sx,z:sz,g:0,f:0}],cost=new Map([[key(sx,sz),0]]),from=new Map<string,string>();let end='';const closed=new Set<string>();
  while(open.length&&closed.size<1800){open.sort((a,b)=>a.f-b.f);const a=open.shift()!,ak=key(a.x,a.z);if(closed.has(ak))continue;closed.add(ak);if(a.x===gx&&a.z===gz){end=ak;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=a.x+dx,z=a.z+dz,k=key(x,z),g=a.g+1;if(!walkable(x,z)||g>=(cost.get(k)??Infinity))continue;cost.set(k,g);from.set(k,ak);open.push({x,z,g,f:g+Math.abs(gx-x)+Math.abs(gz-z)});}}
  path=[];while(end&&end!==key(sx,sz)){const [x,z]=end.split(',').map(Number);path.unshift(new T.Vector3(x,0,z));end=from.get(end)||'';}pendingPlace=-1;
 }
 const ray=new T.Raycaster(),mouse=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),-.4),hit=new T.Vector3();let pointer:{x:number;y:number;button:number;id:number;drag:boolean}|null=null;
 renderer.domElement.oncontextmenu=e=>e.preventDefault();
 function groundTarget(e:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);if(ray.ray.intersectPlane(ground,hit))goTo(hit.x,hit.z);}
 renderer.domElement.onpointerdown=e=>{if(!state.started||state.modal||state.fishing)return;pointer={x:e.clientX,y:e.clientY,button:e.button,id:e.pointerId,drag:false};renderer.domElement.setPointerCapture(e.pointerId);};
 renderer.domElement.onpointermove=e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(dx,dy)>3)pointer.drag=true;if(pointer.button===1||(e.pointerType==='touch'&&pointer.drag&&e.clientX>host.clientWidth*.55)){cameraYaw-=dx*settings.get('cameraSensitivity');orbitUntil=clock+5;pointer.x=e.clientX;pointer.y=e.clientY;}else if(pointer.drag)groundTarget(e);};
 renderer.domElement.onpointerup=e=>{if(!pointer)return;if(pointer.button===0&&!pointer.drag){groundTarget(e);if(ray.intersectObject(lakeBoard,true).length){goTo(-3,11.5);pendingPlace=5;pointer=null;return;}const intersections=ray.intersectObjects(clickableNpcs,true);if(intersections.length){let o:T.Object3D|null=intersections[0].object;while(o&&!clickableNpcs.includes(o as T.Group))o=o.parent;const rootIndex=clickableNpcs.indexOf(o as T.Group);const index=rootIndex>=world.npcs.length?Number(o?.userData.placeIndex):rootIndex;if(index>=0){goTo(places[index].x,places[index].z);pendingPlace=index;}}}pointer=null;};renderer.domElement.onpointercancel=()=>{pointer=null;};
 const stick=$('stick');stick.onpointerdown=e=>{stick.setPointerCapture(e.pointerId);moveStick(e);};function moveStick(e:PointerEvent){const r=stick.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.35),y=(e.clientY-r.top-r.height/2)/(r.height*.35),len=Math.max(1,Math.hypot(x,y));input.setStick(x/len,y/len);$('knob').style.transform='translate('+x/len*33+'px,'+y/len*33+'px)';}stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId))moveStick(e);};const stopStick=()=>{input.setStick(0,0);$('knob').style.transform='';};stick.onpointerup=stopStick;stick.onpointercancel=stopStick;
 window.addEventListener('keydown',e=>{if(e.code==='Tab'&&state.modal){const buttons=Array.from($('modal').querySelectorAll<HTMLElement>('button,input,select'));if(buttons.length){const i=buttons.indexOf(document.activeElement as HTMLElement);if((!e.shiftKey&&i===buttons.length-1)||(e.shiftKey&&i===0)){e.preventDefault();buttons[e.shiftKey?buttons.length-1:0].focus();}}}});
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight,s=Math.min(Math.max(w,h)/1280,Math.min(w,h)/720);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();ui.style.width=w/s+'px';ui.style.height=h/s+'px';ui.style.transform='scale('+s+')';};new ResizeObserver(resize).observe(host);resize();
 void me().then(user=>{if(!user){saves.unavailable();return;}adminIdentity=user;adminButton.hidden=!canUseAdminTools(adminIdentity);state.name=user.username;$('username').textContent=user.username;nameLabel.material.map?.dispose();const replacement=label(user.username+' · Cư dân mới');nameLabel.material.map=replacement.material.map;nameLabel.material.needsUpdate=true;if(import.meta.env.DEV)state.dev=user.source==='dev';void saves.load(user.email).then(()=>{if(state.started)toast('Ông Tư: Chào '+state.name+'!');});void presence.connect();});
 const timer=new T.Timer(),camTarget=new T.Vector3(),look=new T.Vector3(),move=new T.Vector3(),velocity=new T.Vector3();let fpsTime=0,fpsFrames=0,lastMusic=0,lastUnlock=0;
 window.__GAME_STATE__=()=>({scene:state.fishing?'fishing':state.modal|| (state.started?'town':'welcome'),running:state.started,entities:1+world.npcs.length+fairNpcs.length+world.crowd.length+presence.count(),player:{x:player.root.position.x,y:player.root.position.y,z:player.root.position.z},score:state.coins,custom:{...fair.state(),adminTools:canUseAdminTools(adminIdentity),assisted,luck:carnival.luck,carnivalTickets:carnival.tickets,components:carnival.components.length,carnivalWorkers:carnival.workers,fishCount:state.fishCount,casts:state.casts,phase:state.fishing?.phase||'none',practice:state.fishing?.phase==='casting'?state.fishing.practice:state.practice,played:state.played,quest:state.quest,drawCalls:renderer.info.render.calls,sessionOnly:!saves.cloudReady(),saveStatus:$('savestatus').textContent||'',roomStatus:presence.status(),remotePlayers:presence.count(),catchSource:'simulation'}});
 if(import.meta.env.DEV)window.__GAME_TEST__={openFishing:()=>{state.started=true;openFish();},win:()=>{if(!state.started)return;state.fishing={phase:'casting',id:crypto.randomUUID(),started:clock-settings.get('needleSeconds')*.5,practice:false};fishAction();},lose:()=>{if(!state.started)return;state.fishing={phase:'casting',id:crypto.randomUUID(),started:clock,practice:false};fishAction();},unlock:()=>{state.played=settings.get('unlockSeconds')*2+1;},caro:()=>startCaro(),fair:(index:number)=>{if(state.started&&index>=0&&index<9)interactPlace(6+index);}};
 $('loadbar').style.width='100%';$('loadpercent').textContent='100%';setTimeout(()=>{$('loading').classList.add('out');setTimeout(()=>$('loading').remove(),700);},350);
 renderer.setAnimationLoop(time=>{
  timer.update(time);const dt=Math.min(timer.getDelta(),.1);clock+=dt;const active=state.started&&!document.hidden;if(active)state.played+=dt;
  const unlock=Math.floor(state.played/settings.get('unlockSeconds'));if(unlock>lastUnlock){lastUnlock=unlock;if(unlock===1)toast('Ngày mới! Vườn, xe và ảnh đã mở trong phiên.');if(unlock===2)toast('Cô Lan: Ghé thăm đàn gà cùng cô nhé.');}
  if(Date.now()-refillAt>=settings.get('refillMinutes')*60000){const count=Math.floor((Date.now()-refillAt)/(settings.get('refillMinutes')*60000));state.casts=Math.min(settings.get('maxCasts'),state.casts+count);refillAt+=count*settings.get('refillMinutes')*60000;}
  if(!fair.active()&&input.pressed('Escape')){if(state.modal)closeModal();else if(state.fishing){state.fishing=null;fishPanel();}}
  const space=!fair.active()&&input.pressed('Space'),inter=!fair.active()&&input.pressed('KeyE');
  if(active&&!state.modal){if(state.fishing){if(space||inter)fishAction();}else{if(inter)interact();if(space&&jumpY===0){jumpV=2*settings.get('jumpHeight')/settings.get('jumpApex');sound(430);}}}
  let walking=false;
  if(state.modal||state.fishing)velocity.set(0,0,0);
  if(active&&!state.modal&&!state.fishing){const m=input.move();move.set(m.x,0,m.y);if(move.lengthSq()>.01){path=[];pendingPlace=-1;move.applyAxisAngle(T.Object3D.DEFAULT_UP,cameraYaw);}else if(path.length){move.copy(path[0]).sub(player.root.position);move.y=0;if(move.length()<.22){path.shift();move.set(0,0,0);}else move.normalize();}
   velocity.lerp(move,1-Math.exp(-dt/settings.get('accelSeconds')*3));move.copy(velocity);const speed=settings.get('runSpeed')*(state.rideUntil>clock?settings.get('rideMultiplier'):1);walking=move.lengthSq()>.01;const nx=player.root.position.x+move.x*speed*dt,nz=player.root.position.z+move.z*speed*dt;
   if(walkable(nx,player.root.position.z))player.root.position.x=nx;if(walkable(player.root.position.x,nz))player.root.position.z=nz;
   if(walking){player.root.rotation.y=Math.atan2(move.x,move.z);if(clock>orbitUntil)cameraYaw=T.MathUtils.lerp(cameraYaw,0,dt*.25);}
   if(pendingPlace>=0&&Math.hypot(player.root.position.x-places[pendingPlace].x,player.root.position.z-places[pendingPlace].z)<2.3){const i=pendingPlace;pendingPlace=-1;path=[];interactPlace(i);}
  }
  if(jumpY>0||jumpV>0){jumpV-=2*settings.get('jumpHeight')/(settings.get('jumpApex')**2)*dt;jumpY=Math.max(0,jumpY+jumpV*dt);if(jumpY===0){jumpV=0;sound(230,.08);}}
  const px=player.root.position.x,pz=player.root.position.z,bridge=Math.abs(Math.abs(pz)-6)<1.15&&Math.abs(px)<11;
  player.root.position.y=(bridge?.5+Math.sin((px+11)/22*Math.PI)*.8:.4)+jumpY;
  const reduced=settings.get<boolean>('reducedMotion')||matchMedia('(prefers-reduced-motion:reduce)').matches;
  const swing=walking?Math.sin(clock*11)*.45:Math.sin(clock*2)*.035;
  player.arms.forEach((a,i)=>a.rotation.x=swing*(i?1:-1));player.legs.forEach((a,i)=>a.rotation.x=-swing*(i?1:-1));if(state.emoteUntil>clock)player.arms[1].rotation.z=-2+Math.sin(clock*12)*.25;else player.arms[1].rotation.z=0;
  if(!reduced)player.body.scale.y=.57+Math.sin(clock*2)*.018;
  scooter.visible=state.rideUntil>clock;fishingRod.visible=!!state.fishing;fishingLine.visible=state.fishing?.phase==='casting';if(fishingLine.visible){const tip=new T.Vector3(.6,3.7,2.2);player.root.localToWorld(tip);const a=fishingLine.geometry.attributes.position as T.BufferAttribute;a.setXYZ(0,tip.x,tip.y,tip.z);a.setXYZ(1,world.float.position.x,.4,world.float.position.z);a.needsUpdate=true;}
  world.float.position.y=.35+Math.sin(clock*3)*.06;world.ring.scale.setScalar(1+(clock%2)*.7);world.ring.material.opacity=.5*(1-clock%2/2);
  world.npcs.forEach((n,i)=>{n.root.position.y=.4+Math.sin(clock*2+i)*.025;if(state.emoteUntil>clock)n.arms[1].rotation.z=-2+Math.sin(clock*8+i)*.2;else n.arms[1].rotation.z=0;});
  world.crowd.forEach((n,i)=>{n.root.rotation.y=Math.sin(clock*.2+i)*.4;n.arms[0].rotation.x=Math.sin(clock*2+i)*.1;});
  nameLabel.position.set(px,player.root.position.y+3.15,pz);nameLabel.visible=state.started;
  arrow.visible=state.started&&state.quest<2&&!state.fishing;arrow.position.set(places[0].x,4.6+Math.sin(clock*3)*.2,places[0].z);arrow.rotation.z=Math.PI;
  if(state.fishing?.phase==='casting'){const n=$('needle');if(n)n.style.left=needleAt(clock-state.fishing.started,settings.get('needleSeconds'))*100+'%';for(const [id,key] of [['zone','catchZone'],['best','bestZone']]){const el=$(id);if(el){const ratio=settings.get(key);el.style.left=(1-ratio)*50+'%';el.style.width=ratio*100+'%';}}}
  if(burstLife>0){burstLife-=dt;sparks.material.opacity=Math.max(0,burstLife);for(let i=0;i<120;i++){for(let j=0;j<3;j++)particlePositions[i*3+j]+=velocities[i*3+j]*dt;velocities[i*3+1]-=4*dt;}pg.attributes.position.needsUpdate=true;}else sparks.material.opacity=0;
  if(clock>toastUntil)$('toast').classList.remove('show');
  $('coins').textContent='◉ '+state.coins;const day=(16.5+state.played/settings.get('daySeconds')*24)%24;$('time').textContent='☀ '+String(Math.floor(day)).padStart(2,'0')+':'+String(Math.floor(day%1*60)).padStart(2,'0');
  if(state.started){look.set(px,1.4,pz-2);const distance=state.fishing?13:15;camTarget.set(px+Math.sin(cameraYaw)*distance,11, pz+Math.cos(cameraYaw)*distance);camera.position.lerp(camTarget,1-Math.exp(-dt*3));camera.lookAt(look);}else{camTarget.set(17,14,25);camera.position.lerp(camTarget,dt);camera.lookAt(-1,1,0);}
  if(active&&audio&&clock-lastMusic>3.5){lastMusic=clock;sound([261.63,329.63,392,440,392,329.63][Math.floor(clock/3.5)%6],1.2);}
  fpsTime+=dt;fpsFrames++;if(fpsTime>2){const fps=fpsFrames/fpsTime;if(fps<50){renderer.shadowMap.enabled=false;renderer.setPixelRatio(Math.max(.6,renderer.getPixelRatio()-.15));}else if(fps>57)renderer.setPixelRatio(Math.min(Math.min(devicePixelRatio,1.5),renderer.getPixelRatio()+.05));fpsTime=0;fpsFrames=0;}
  presence.update(dt,clock);
  if(saves.canChange()){const signature=[state.coins,state.worn,[...state.owned].join(','),state.fishCount,state.quest,state.casts,state.garden,state.animal,muted].join('|');if(signature!==lastSaveSignature||(state.started&&clock-lastProgressSave>15)){lastSaveSignature=signature;lastProgressSave=clock;saves.changed();}}
  if(fair.active())fair.update(dt);
  carnivalStage.update(dt,carnivalUI.view(),carnival);
  sky.position.copy(camera.position);
  renderer.render(scene,camera);
 });
}
void start();
