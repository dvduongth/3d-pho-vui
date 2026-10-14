export type Move={from:number;to:number;promotion?:number};
export type BoardGame={cells:number[];turn:number;chinese:boolean;rights:boolean[];ep:number;quiet:number;history:string[]};
export function newBoardGame(chinese:boolean):BoardGame{
 const w=chinese?9:8,h=chinese?10:8,cells=Array<number>(w*h).fill(0),back=chinese?[4,2,3,7,6,7,3,2,4]:[4,2,3,5,6,3,2,4];
 back.forEach((p,x)=>{cells[x]=-p;cells[(h-1)*w+x]=p;});
 if(chinese){for(const x of [0,2,4,6,8]){cells[27+x]=-1;cells[54+x]=1;}for(const x of [1,7]){cells[18+x]=-5;cells[63+x]=5;}}
 else for(let x=0;x<8;x++){cells[8+x]=-1;cells[48+x]=1;}
 const s={cells,turn:1,chinese,rights:[true,true,true,true],ep:-1,quiet:0,history:[] as string[]};s.history=[position(s)];return s;
}
export function position(s:BoardGame){return s.cells.join(',')+'/'+s.turn+'/'+s.rights.join('')+'/'+s.ep;}
function pseudo(s:BoardGame,from:number,attack=false):Move[]{
 const w=s.chinese?9:8,h=s.chinese?10:8,p=s.cells[from],side=Math.sign(p),kind=Math.abs(p),x=from%w,y=Math.floor(from/w),out:Move[]=[];
 const add=(xx:number,yy:number)=>{if(xx>=0&&xx<w&&yy>=0&&yy<h&&(attack||Math.sign(s.cells[yy*w+xx])!==side))out.push({from,to:yy*w+xx});};
 const ray=(dx:number,dy:number)=>{for(let xx=x+dx,yy=y+dy;xx>=0&&xx<w&&yy>=0&&yy<h;xx+=dx,yy+=dy){add(xx,yy);if(s.cells[yy*w+xx])break;}};
 const straight=[[1,0],[-1,0],[0,1],[0,-1]],diagonal=[[1,1],[-1,1],[1,-1],[-1,-1]],knights=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
 if(!s.chinese){
  if(kind===1){if(attack){add(x-1,y-side);add(x+1,y-side);}else{if(y-side>=0&&y-side<h&&!s.cells[(y-side)*w+x]){add(x,y-side);if(y===(side===1?6:1)&&!s.cells[(y-2*side)*w+x])add(x,y-2*side);}for(const xx of [x-1,x+1]){const to=(y-side)*w+xx;if(xx>=0&&xx<w&&to>=0&&to<64&&((s.cells[to]&&Math.sign(s.cells[to])===-side)||to===s.ep))add(xx,y-side);}}}
  if(kind===2)for(const [dx,dy] of knights)add(x+dx,y+dy);
  if(kind===3||kind===5)for(const [dx,dy] of diagonal)ray(dx,dy);
  if(kind===4||kind===5)for(const [dx,dy] of straight)ray(dx,dy);
  if(kind===6){for(const [dx,dy] of [...straight,...diagonal])add(x+dx,y+dy);
   if(!attack&&from===(side===1?60:4)&&!attacked(s,from,-side)){const r=side===1?0:2;
    if(s.rights[r]&&s.cells[from+3]===side*4&&!s.cells[from+1]&&!s.cells[from+2]&&!attacked(s,from+1,-side)&&!attacked(s,from+2,-side))add(x+2,y);
    if(s.rights[r+1]&&s.cells[from-4]===side*4&&!s.cells[from-1]&&!s.cells[from-2]&&!s.cells[from-3]&&!attacked(s,from-1,-side)&&!attacked(s,from-2,-side))add(x-2,y);
   }
  }
 }else{
  const palace=(xx:number,yy:number)=>xx>=3&&xx<=5&&(side===1?yy>=7:yy<=2);
  if(kind===1){add(x,y-side);if(side===1?y<=4:y>=5){add(x-1,y);add(x+1,y);}}
  if(kind===2)for(const [dx,dy] of knights){const lx=x+(Math.abs(dx)===2?Math.sign(dx):0),ly=y+(Math.abs(dy)===2?Math.sign(dy):0);if(!s.cells[ly*w+lx])add(x+dx,y+dy);}
  if(kind===3)for(const [dx,dy] of diagonal){if((side===1?y+2*dy>=5:y+2*dy<=4)&&!s.cells[(y+dy)*w+x+dx])add(x+dx*2,y+dy*2);}
  if(kind===4)for(const [dx,dy] of straight)ray(dx,dy);
  if(kind===5)for(const [dx,dy] of straight){let screen=false;for(let xx=x+dx,yy=y+dy;xx>=0&&xx<w&&yy>=0&&yy<h;xx+=dx,yy+=dy){const p=s.cells[yy*w+xx];if(!screen){if(p)screen=true;else if(!attack)add(xx,yy);}else if(p){add(xx,yy);break;}}}
  if(kind===7)for(const [dx,dy] of diagonal)if(palace(x+dx,y+dy))add(x+dx,y+dy);
  if(kind===6){for(const [dx,dy] of straight)if(palace(x+dx,y+dy))add(x+dx,y+dy);for(let yy=y-side;yy>=0&&yy<h;yy-=side)if(s.cells[yy*w+x]){if(s.cells[yy*w+x]===-side*6)add(x,yy);break;}}
 }
 return out;
}
export function attacked(s:BoardGame,square:number,by:number){return s.cells.some((p,i)=>Math.sign(p)===by&&pseudo(s,i,true).some(m=>m.to===square));}
export function inCheck(s:BoardGame,side=s.turn){const k=s.cells.indexOf(side*6);return k<0||attacked(s,k,-side);}
function apply(s:BoardGame,m:Move):BoardGame{
 const n={...s,cells:s.cells.slice(),rights:s.rights.slice(),ep:-1},p=s.cells[m.from],side=Math.sign(p),taken=s.cells[m.to];n.cells[m.from]=0;n.cells[m.to]=p;
 if(!s.chinese){if(Math.abs(p)===1){if(m.to===s.ep&&!taken)n.cells[m.to+side*8]=0;if(Math.abs(m.to-m.from)===16)n.ep=(m.to+m.from)/2;if(m.to<8||m.to>=56)n.cells[m.to]=side*(m.promotion??5);}
  if(Math.abs(p)===6){const r=side===1?0:2;n.rights[r]=n.rights[r+1]=false;if(Math.abs(m.to-m.from)===2){const rook=m.to>m.from?m.from+3:m.from-4;n.cells[rook]=0;n.cells[(m.to+m.from)/2]=side*4;}}
  for(const [sq,r] of [[63,0],[56,1],[7,2],[0,3]])if(m.from===sq||m.to===sq)n.rights[r]=false;
 }
 n.turn=-s.turn;n.quiet=taken||Math.abs(p)===1?0:s.quiet+1;return n;
}
export function legalMoves(s:BoardGame):Move[]{const out:Move[]=[];s.cells.forEach((p,i)=>{if(Math.sign(p)!==s.turn)return;for(const m of pseudo(s,i))if(Math.abs(s.cells[m.to])!==6&&!inCheck(apply(s,m),s.turn))out.push(m);});return out;}
export function movePiece(s:BoardGame,m:Move){const n=apply(s,m);n.history=[...s.history,position(n)];return n;}
export function boardResult(s:BoardGame){if(!legalMoves(s).length)return !s.chinese&&!inCheck(s)?'draw':s.turn===1?'lose':'win';if(s.history.filter(p=>p===position(s)).length>=3)return 'draw';if(!s.chinese){if(s.quiet>=100)return 'draw';const rest=s.cells.filter(p=>p&&Math.abs(p)!==6);if(!rest.length||(rest.length===1&&[2,3].includes(Math.abs(rest[0]))))return 'draw';}return 'playing';}
export function computerMove(s:BoardGame){const values=s.chinese?[0,1,4,2,9,5,100,2]:[0,1,3,3,5,9,100];return legalMoves(s).map(m=>({m,score:values[Math.abs(s.cells[m.to])]*10+(inCheck(movePiece(s,m))?3:0)+Math.random()})).sort((a,b)=>b.score-a.score)[0]?.m;}
