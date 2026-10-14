import assert from 'node:assert/strict';
import {newBoardGame,legalMoves,movePiece,inCheck,boardResult} from '../src/puzzle-chess.ts';
import {adjacent,newSliding,matches,linePath,clearRows,newOAn,sowOAn,ownPits,fits,pieces,rotate} from '../src/puzzle-rules.ts';
const start=newBoardGame(false);assert.equal(legalMoves(start).length,20);assert.equal(legalMoves(start).reduce((sum,m)=>sum+legalMoves(movePiece(start,m)).length,0),400);
let mate=newBoardGame(false);for(const [from,to] of [[53,45],[12,28],[54,38],[3,39]]){const m=legalMoves(mate).find(m=>m.from===from&&m.to===to);assert.ok(m);mate=movePiece(mate,m);}assert.equal(boardResult(mate),'lose','Fool’s mate ends correctly');
const castle=newBoardGame(false);castle.cells.fill(0);castle.cells[60]=6;castle.cells[63]=4;castle.cells[4]=-6;assert.ok(legalMoves(castle).some(m=>m.from===60&&m.to===62));const castled=movePiece(castle,{from:60,to:62});assert.equal(castled.cells[61],4);assert.equal(castled.cells[63],0);
const ep=newBoardGame(false);ep.cells.fill(0);ep.cells[60]=6;ep.cells[4]=-6;ep.cells[28]=1;ep.cells[27]=-1;ep.ep=19;assert.ok(legalMoves(ep).some(m=>m.from===28&&m.to===19));assert.equal(movePiece(ep,{from:28,to:19}).cells[27],0);
const chinese=newBoardGame(true);assert.equal(legalMoves(chinese).length,44);
const face=newBoardGame(true);face.cells.fill(0);face.cells[4]=-6;face.cells[85]=6;assert.equal(inCheck(face),true,'facing generals prohibited');face.cells[49]=4;assert.equal(inCheck(face),false);assert.equal(legalMoves(face).some(m=>m.from===49&&m.to===48),false,'cannot expose general');
for(let i=0;i<20;i++){const b=newSliding();let inversions=0;for(let a=0;a<9;a++)for(let c=a+1;c<9;c++)if(b[a]&&b[c]&&b[a]>b[c])inversions++;assert.equal(inversions%2,0,'sliding board is solvable');assert.equal(new Set(b).size,9);}
assert.equal(adjacent(2,3,3),false,'no row wrapping');assert.deepEqual(matches([1,1,1,2,3,4,2,3,4],3,3),[0,1,2]);
const line=Array(81).fill(0);line[0]=1;assert.equal(linePath(line,0,80),true);line[1]=2;line[9]=2;assert.equal(linePath(line,0,80),false);
const grid=Array(180).fill(0);grid.fill(1,170);const cleared=clearRows(grid);assert.equal(cleared.count,1);assert.equal(cleared.grid.length,180);assert.equal(cleared.grid.some(Boolean),false);assert.equal(fits(grid,pieces[0],8,0),false);assert.equal(rotate(pieces[0]).length,4);
let oan=newOAn();const unchanged=sowOAn(oan,0,1);assert.equal(unchanged,oan,'cannot sow a quan');
for(let turn=0;turn<150&&!oan.done;turn++){const options=ownPits(oan.turn).filter(i=>oan.pits[i]);assert.ok(options.length);oan=sowOAn(oan,options[turn%options.length],turn%2?1:-1);assert.equal(oan.pits.reduce((a,b)=>a+b,0)+oan.scores.reduce((a,b)=>a+b,0)-oan.debt.reduce((a,b)=>a+b,0),70,'seeds and debt conserved');}
console.log('Puzzle checks passed: chess legal moves/mate/castling/en-passant, xiangqi checks, solvable sliding, matches, Lines paths, blocks, ô ăn quan.');
