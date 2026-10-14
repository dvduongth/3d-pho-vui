import assert from 'node:assert/strict';
import {forceAt,skillResult} from '../src/carnival-skill.ts';
import {newCarnival,begin,resolve} from '../src/carnival.ts';
assert.equal(forceAt(0,1.6),0);assert.equal(forceAt(.8,1.6),.5);assert.equal(forceAt(1.6,1.6),1);assert.ok(Math.abs(forceAt(2.4,1.6)-.5)<1e-10);
for(let n=1;n<=20;n++){const ideal=skillResult(.5,n),poor=skillResult(0,n);assert.equal(ideal.base,20);assert.equal(poor.base,0);assert.ok(ideal.deviation>=-3&&ideal.deviation<=3);assert.equal(skillResult(.3,n).base,skillResult(.7,n).base);assert.ok(Math.abs(skillResult(.3,n).accuracy-skillResult(.7,n).accuracy)<1e-12);}
const fresh=()=>{const c=newCarnival();c.tickets=1;begin(c,0);return c;};
const perfect=fresh(),poor=fresh();
assert.equal(resolve(perfect,'play',0,()=>10,.5)?.total,20);assert.equal(perfect.big,1);
assert.equal(resolve(poor,'play',0,()=>10,0)?.total,0);assert.equal(poor.big,0);
const borrowed=fresh();const result=resolve(borrowed,'play',2,sides=>sides===20?10:3,.5);assert.equal(result?.total,26);assert.equal(borrowed.luck,-1);
const debted=fresh();debted.luck=-1;assert.equal(resolve(debted,'play',0,sides=>sides===20?10:2,.5)?.total,18);assert.equal(debted.luck,0);
const invalid=fresh();assert.throws(()=>resolve(invalid,'play',2,()=>10,NaN));assert.equal(invalid.luck,1,'invalid timing never spends Luck');
console.log('Skill checks passed: timing reflection, precision, bounded randomness, Luck composition, debt, invalid inputs.');
