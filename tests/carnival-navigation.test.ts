import assert from 'node:assert/strict';
import {newCarnival,selectStall,begin,resolve,parseCarnival} from '../src/carnival.ts';
const c=newCarnival();c.tickets=10;selectStall(c,1);begin(c,1);resolve(c,'play',0,()=>10);
const ring=structuredClone(c.attempt);assert.equal(ring?.step,1);
for(const target of [2,3,4,5,0]){
 assert.equal(selectStall(c,target),true);assert.equal(c.attempt,null,'selected game must not use ring attempt');
 const before=c.tickets;assert.equal(begin(c,target),true);assert.equal(c.attempt?.stall,target);assert.equal(c.tickets,before-1);
}
const afterPurchases=c.tickets;
selectStall(c,1);assert.deepEqual(c.attempt,ring);assert.equal(c.tickets,afterPurchases,'resuming must not charge again');
const restored=parseCarnival(JSON.parse(JSON.stringify(c)));assert.ok(restored);
for(const target of [5,4,3,2,0,1]){assert.equal(selectStall(restored,target),true);assert.equal(restored.attempt?.stall,target);assert.equal(restored.tickets,afterPurchases);}
assert.equal(restored.attempt?.step,1,'ring progress survives switching and reload');
const snapshot=structuredClone(restored);assert.equal(selectStall(restored,99),false);assert.deepEqual(restored,snapshot);
const bad={...c,pausedAttempts:[ring,ring]};assert.equal(parseCarnival(bad),null,'duplicate paid attempts rejected');
console.log('Navigation passed: six distinct games, suspended turns, no extra ticket charges, save/reload, invalid selection.');
