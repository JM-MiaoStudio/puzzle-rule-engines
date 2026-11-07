import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Campaign, CAMPAIGN_KEY } from '../../src/match3/Campaign';

function memory(initial:string|null=null){let value=initial;return {getItem:()=>value,setItem:(_key:string,next:string)=>{value=next;},value:()=>value};}
test('a new campaign unlocks only the first level',()=>{const c=new Campaign(memory());assert.equal(c.unlocked,1);assert.deepEqual(c.completed,[]);assert.throws(()=>c.complete(2));});
test('completion persists and unlocks exactly the next level',()=>{
  const store=memory();const c=new Campaign(store);assert.equal(c.complete(1),true);
  assert.equal(c.unlocked,2);assert.deepEqual(new Campaign(store).completed,[1]);assert.equal(new Campaign(store).unlocked,2);
  assert.deepEqual(JSON.parse(store.value()!),{version:1,completed:[1]});
});
test('replaying a completed level cannot reduce or duplicate progress',()=>{
  const store=memory();const c=new Campaign(store);c.complete(1);c.complete(2);c.complete(1);
  assert.equal(c.unlocked,3);assert.deepEqual(c.completed,[1,2]);const copy=c.completed;copy.push(10);assert.deepEqual(c.completed,[1,2]);
});
test('malformed and noncontiguous progress cannot bypass locked levels',()=>{
  for(const input of ['not json','null',JSON.stringify({version:2,completed:[1,2,3]}),JSON.stringify({version:1,completed:[3,10]})])assert.equal(new Campaign(memory(input)).unlocked,1);
  const c=new Campaign(memory(JSON.stringify({version:1,completed:[3,1,2,2,0,99,-1,4.5]})));assert.equal(c.unlocked,4);assert.deepEqual(c.completed,[1,2,3,99]);
});
test('the last tutorial unlocks the generated eleventh level',()=>{const c=new Campaign(memory());for(let n=1;n<=10;n++)c.complete(n);assert.equal(c.unlocked,11);assert.equal(c.completed.length,10);c.complete(11);assert.equal(c.unlocked,12);});
test('a failed save keeps in-memory progress and can retry',()=>{
  let fail=true;const store=memory();const c=new Campaign({getItem:store.getItem,setItem:(k,v)=>{if(fail)throw Error('quota');store.setItem(k,v);}});
  assert.equal(c.complete(1),false);assert.equal(c.unlocked,2);assert.equal(c.needsSave,true);
  fail=false;assert.equal(c.save(),true);assert.equal(c.needsSave,false);assert.equal(new Campaign(store).unlocked,2);
});
test('read failure must not overwrite previously saved higher progress',()=>{
  let fail=true;const store=memory(JSON.stringify({version:1,completed:[1,2,3,4,5]}));
  const c=new Campaign({getItem:()=>{if(fail)throw Error('unavailable');return store.getItem();},setItem:store.setItem});
  assert.equal(c.complete(1),false);assert.equal(JSON.parse(store.value()!).completed.length,5);
  fail=false;assert.equal(c.save(),true);assert.equal(c.unlocked,6);assert.equal(new Campaign(store).unlocked,6);
});
test('retrying a failed read recovers progress without writing to storage',()=>{
  let fail=true;let writes=0;const store=memory(JSON.stringify({version:1,completed:[1,2,3]}));
  const c=new Campaign({getItem:()=>{if(fail)throw Error('unavailable');return store.getItem();},setItem:()=>{writes++;}});
  assert.equal(c.readFailed,true);fail=false;assert.equal(c.reload(),true);
  assert.equal(c.unlocked,4);assert.equal(c.readFailed,false);assert.equal(writes,0);
});
