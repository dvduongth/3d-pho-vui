import assert from 'node:assert/strict';
import {newBoardGame,legalMoves,movePiece,inCheck,boardResult,position,type BoardGame} from '../src/puzzle-chess.ts';
function fen(text:string):BoardGame {
 const [board,turn,rights,ep]=text.split(' '),s=newBoardGame(false);
 s.cells=[];for(const c of board.replaceAll('/','')){if(/[1-8]/.test(c))s.cells.push(...Array(Number(c)).fill(0));else s.cells.push((c===c.toUpperCase()?1:-1)*({p:1,n:2,b:3,r:4,q:5,k:6}[c.toLowerCase()]!));}
 s.turn=turn==='w'?1:-1;s.rights=['K','Q','k','q'].map(c=>rights.includes(c));s.ep=ep==='-'?-1:square(ep);s.history=[];return s;
}
function square(s:string){return (8-Number(s[1]))*8+s.charCodeAt(0)-97;}
function targets(s:BoardGame,from:string){return legalMoves(s).filter(m=>m.from===square(from)).map(m=>m.to).sort((a,b)=>a-b);}
function expect(s:BoardGame,from:string,to:string[]){assert.deepEqual(targets(s,from),to.map(square).sort((a,b)=>a-b),from);}
function perft(s:BoardGame,depth:number):number {if(!depth)return 1;return legalMoves(s).reduce((n,m)=>n+perft(movePiece(s,m),depth-1),0);}
assert.equal(perft(newBoardGame(false),3),8902,'Initial position perft 3');
assert.equal(perft(fen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -'),2),2039,'Kiwipete: captures, pins, castles');
assert.equal(perft(fen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -'),3),2812,'Rook and pawn endgame perft 3');
for(const side of [1,-1])for(const kind of [2,3,4,5]){
 const s=fen('7k/8/8/8/8/8/8/K7 w - -');s.turn=side;s.cells[square('d4')]=side*kind;
 const expected:number[]=[];
 for(let to=0;to<64;to++){
  const dx=Math.abs(to%8-3),dy=Math.abs(Math.floor(to/8)-4);
  if(to===square('d4')||s.cells[to])continue;
  if(kind===2?dx*dy===2:kind===3?dx===dy:kind===4?dx===0||dy===0:dx===dy||dx===0||dy===0)expected.push(to);
 }
 assert.deepEqual(targets(s,'d4'),expected,`Piece ${kind}, side ${side}`);
}
expect(newBoardGame(false),'e2',['e3','e4']);
expect(fen('7k/8/8/8/8/4p3/4P3/K7 w - -'),'e2',[]);
expect(fen('7k/8/8/8/3p1p2/4P3/8/K7 w - -'),'e3',['d4','e4','f4']);
expect(fen('7k/8/8/2PpP3/2PNP3/2PPP3/8/K7 w - -'),'d4',['b3','b5','c2','c6','e2','e6','f3','f5']);
expect(fen('7k/8/1p3P2/8/3B4/8/1P3p2/K7 w - -'),'d4',['c5','b6','e5','c3','e3','f2']);
expect(fen('7k/8/8/3p4/2PR1p2/8/3P4/K7 w - -'),'d4',['d5','e4','f4','d3']);
expect(fen('7k/8/8/8/3Pp3/8/8/K7 b - -'),'e4',['e3']);
expect(fen('k3r3/8/8/8/8/8/4N3/4K3 w - -'),'e2',[]);
assert.equal(inCheck(fen('7k/8/8/8/8/8/4k3/4K3 w - -')),true,'Kings attack adjacent squares');
assert.ok(!targets(fen('k4r2/8/8/8/8/8/8/4K2R w K -'),'e1').includes(square('g1')),'No castling through check');
assert.ok(!targets(fen('k3r3/8/8/8/8/8/8/4K2R w K -'),'e1').includes(square('g1')),'No castling out of check');
assert.ok(!targets(fen('k7/8/8/4KPpr/8/8/8/8 w - g6'),'f5').includes(square('g6')),'En passant must not expose own king');
assert.equal(boardResult(fen('7k/5Q2/6K1/8/8/8/8/8 b - -')),'draw','Stalemate');
assert.equal(boardResult(fen('7k/6Q1/6K1/8/8/8/8/8 b - -')),'win','Checkmate');
const promotion=fen('7k/P7/8/8/8/8/8/7K w - -');
assert.deepEqual(legalMoves(promotion).filter(m=>m.from===8).map(m=>m.promotion).sort(),[2,3,4,5],'All four promotions are legal moves');
for(const p of [2,3,4,5])assert.equal(movePiece(promotion,{from:8,to:0,promotion:p}).cells[0],p);
assert.throws(()=>movePiece(promotion,{from:8,to:0,promotion:6}),'Cannot promote to king');
assert.throws(()=>movePiece(newBoardGame(false),{from:58,to:30}),'Bishop cannot jump over pawns');
assert.equal(position(fen('7k/8/8/8/P7/8/8/7K b - a3')),position(fen('7k/8/8/8/P7/8/8/7K b - -')),'Uncapturable en passant does not affect repetition');
console.log('Chess audit passed: perft, all piece movement, blockers, checks, castling, en passant, promotion, mate, stalemate and repetition.');
