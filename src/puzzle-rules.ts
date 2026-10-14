export function adjacent(a:number,b:number,w:number){return Math.abs(a%w-b%w)+Math.abs(Math.floor(a/w)-Math.floor(b/w))===1;}
export function newSliding(){const b=[1,2,3,4,5,6,7,8,0];let blank=8,previous=-1;for(let i=0;i<120;i++){const choices=b.map((_,j)=>j).filter(j=>j!==previous&&adjacent(j,blank,3));const next=choices[Math.floor(Math.random()*choices.length)];b[blank]=b[next];b[next]=0;previous=blank;blank=next;}if(b.every((v,i)=>v===(i+1)%9)){b[8]=b[7];b[7]=0;}return b;}
export function matches(b:number[],w:number,min:number,diagonal=false){const found=new Set<number>(),h=b.length/w;for(let i=0;i<b.length;i++){if(!b[i])continue;for(const [dx,dy] of diagonal?[[1,0],[0,1],[1,1],[1,-1]]:[[1,0],[0,1]]){const run=[i];for(let x=i%w+dx,y=Math.floor(i/w)+dy;x>=0&&x<w&&y>=0&&y<h&&b[y*w+x]===b[i];x+=dx,y+=dy)run.push(y*w+x);if(run.length>=min)run.forEach(j=>found.add(j));}}return [...found];}
export function newMatch(){const b=Array<number>(49).fill(0);for(let i=0;i<b.length;i++){const choices=[1,2,3,4,5].filter(c=>!(i%7>=2&&b[i-1]===c&&b[i-2]===c)&&!(i>=14&&b[i-7]===c&&b[i-14]===c));b[i]=choices[Math.floor(Math.random()*choices.length)];}return b;}
export function canSwap(b:number[]){for(let i=0;i<b.length;i++)for(const j of [i+1,i+7])if(j<b.length&&adjacent(i,j,7)){const c=b.slice();[c[i],c[j]]=[c[j],c[i]];if(matches(c,7,3).length)return true;}return false;}
export function collapse(b:number[]){for(let x=0;x<7;x++){const column=[];for(let y=6;y>=0;y--)if(b[y*7+x])column.push(b[y*7+x]);for(let y=6;y>=0;y--)b[y*7+x]=column[6-y]??1+Math.floor(Math.random()*5);}}
export function linePath(b:number[],from:number,to:number){if(!b[from]||b[to])return false;const queue=[from],seen=new Set(queue);while(queue.length){const at=queue.shift()!;if(at===to)return true;for(const n of [at-1,at+1,at-9,at+9])if(n>=0&&n<81&&adjacent(at,n,9)&&!b[n]&&!seen.has(n)){seen.add(n);queue.push(n);}}return false;}
export const pieces=[[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,0],[0,1],[1,1]],[[1,0],[0,1],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]]];
export function fits(grid:number[],piece:number[][],x:number,y:number){return piece.every(([dx,dy])=>x+dx>=0&&x+dx<10&&y+dy>=0&&y+dy<18&&!grid[(y+dy)*10+x+dx]);}
export function rotate(piece:number[][]){const next=piece.map(([x,y])=>[-y,x]),minX=Math.min(...next.map(p=>p[0])),minY=Math.min(...next.map(p=>p[1]));return next.map(([x,y])=>[x-minX,y-minY]);}
export function clearRows(grid:number[]){const rows=[];let count=0;for(let y=0;y<18;y++){const row=grid.slice(y*10,y*10+10);if(row.every(Boolean))count++;else rows.push(row);}while(rows.length<18)rows.unshift(Array(10).fill(0));return {grid:rows.flat(),count};}
export type OAn={pits:number[];scores:number[];debt:number[];turn:number;done:boolean};
export function newOAn():OAn{return {pits:[10,5,5,5,5,5,10,5,5,5,5,5],scores:[0,0],debt:[0,0],turn:0,done:false};}
export function ownPits(turn:number){return turn===0?[1,2,3,4,5]:[7,8,9,10,11];}
export function sowOAn(old:OAn,pit:number,direction:number):OAn{
 if(old.done||!ownPits(old.turn).includes(pit)||!old.pits[pit]||![-1,1].includes(direction))return old;
 const s:OAn={...old,pits:old.pits.slice(),scores:old.scores.slice(),debt:old.debt.slice()};const next=(i:number)=>(i+direction+12)%12;let pos=pit;
 for(let relay=0;relay<100;relay++){
  let seeds=s.pits[pos];s.pits[pos]=0;while(seeds--){pos=next(pos);s.pits[pos]++;}
  const following=next(pos);if(!s.pits[following]){
   let gap=following;while(!s.pits[gap]){const capture=next(gap);if(!s.pits[capture])break;s.scores[s.turn]+=s.pits[capture];s.pits[capture]=0;gap=next(capture);}break;
  }
  if(following===0||following===6)break;pos=following;
 }
 if(!s.pits[0]&&!s.pits[6]){s.done=true;for(let player=0;player<2;player++)for(const i of ownPits(player)){s.scores[player]+=s.pits[i];s.pits[i]=0;}return s;}
 s.turn=1-s.turn;
 if(ownPits(s.turn).every(i=>!s.pits[i])){const cost=Math.min(5,s.scores[s.turn]);s.scores[s.turn]-=cost;s.debt[s.turn]+=5-cost;ownPits(s.turn).forEach(i=>s.pits[i]=1);}
 return s;
}
