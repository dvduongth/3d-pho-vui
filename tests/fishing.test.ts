import { strict as assert } from 'node:assert';
import { judgePull,needleAt } from '../src/fishing.ts';
assert.equal(needleAt(0,1.6),0);
assert.equal(needleAt(.8,1.6),.5);
assert.equal(needleAt(1.6,1.6),1);
assert.equal(needleAt(2.4,1.6),.5000000000000002);
assert.equal(judgePull(.1,.5,.12),null);
assert.equal(judgePull(.9,.5,.12),null);
assert.equal(judgePull(.5,.5,.12)?.species,'Cá lóc');
assert.equal(judgePull(.5,.5,.12)?.weight,3.2);
assert.deepEqual(judgePull(.37,.5,.12),judgePull(.63,.5,.12));
let prior=0;
for(let i=0;i<=100;i++){
 const result=judgePull(.25+i*.0025,.5,.12);
 assert.ok(result);
 assert.ok(result.weight>=prior);
 prior=result.weight;
}
console.log('Fishing checks passed: reflection, miss, perfect catch, symmetry, monotonic weight.');
