import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevel, LEVELS, INITIAL_LEVEL_COUNT, MAX_LEVEL_ID, LEVEL_RULES_VERSION } from '../../src/match3/Levels';
import { Campaign } from '../../src/match3/Campaign';
import { RoundSave } from '../../src/match3/RoundSave';
import { LevelSession } from '../../src/match3/LevelSession';
const memory=(initial:string|null=null)=>{let value=initial;return{getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;},value:()=>value};};
test('generated catalog is deterministic, bounded and isolated from caller mutation',()=>{
  assert.equal(INITIAL_LEVEL_COUNT,100);assert.equal(MAX_LEVEL_ID,1000000);assert.equal(LEVELS.length,10);
  for(const id of [11,100,101,10000,MAX_LEVEL_ID]){const a=getLevel(id);assert.deepEqual(a,getLevel(id));a.goals[0].target=1;assert.notEqual(getLevel(id).goals[0].target,1);assert.ok(a.moves<=40&&a.types<=7);}
  for(const id of [0,-1,1.5,NaN,Infinity,1000001])assert.throws(()=>getLevel(id));
});
test('legacy version only replays frozen tutorial levels',()=>{
  for(let id=1;id<=10;id++){const old=getLevel(id,'2026-11-04.v2');const current=getLevel(id);assert.deepEqual({...old,rulesVersion:undefined},{...current,rulesVersion:undefined});}
  assert.throws(()=>getLevel(11,'2026-11-04.v2'));assert.throws(()=>getLevel(1,'future'));assert.notEqual(LEVEL_RULES_VERSION,'2026-11-04.v2');
});
test('campaign continues at 11 and retains sparse progress on merge',()=>{
  const s=memory(JSON.stringify({version:1,completed:[1,2,3,4,5,6,7,8,9,10,40,10000]})),c=new Campaign(s);
  assert.equal(c.unlocked,11);c.complete(11);assert.equal(c.unlocked,12);assert.ok(c.completed.includes(10000));
  c.mergeCompleted([1,50]);assert.ok(c.completed.includes(40));assert.ok(c.completed.includes(50));assert.equal(c.unlocked,12);
});
test('legacy saved round retains exact rules version after resume and resave',()=>{
  const s=memory(),save=new RoundSave(s,'guest'),round=new LevelSession(getLevel(3,'2026-11-04.v2'));
  const m=round.model.findMoves()[0];round.swap(m.a,m.b);save.save(round,{runId:'legacy',accountId:'guest',startedAt:1});
  assert.equal(JSON.parse(s.value()!).rulesVersion,'2026-11-04.v2');const resumed=save.read()!;assert.ok(resumed);
  assert.deepEqual(resumed.session.model.snapshot(),round.model.snapshot());save.save(resumed.session,resumed.record);assert.equal(JSON.parse(s.value()!).rulesVersion,'2026-11-04.v2');
});
test('generated saved round restores beyond initial catalog',()=>{
  const s=memory(),save=new RoundSave(s,'guest'),round=new LevelSession(getLevel(10000));save.save(round,{runId:'new',accountId:'guest',startedAt:1});
  assert.equal(save.read()!.session.level.id,10000);assert.equal(JSON.parse(s.value()!).rulesVersion,LEVEL_RULES_VERSION);
});
test('exported tutorial definitions cannot be mutated between replays',()=>{
  assert.ok(Object.isFrozen(LEVELS));assert.ok(Object.isFrozen(LEVELS[0]));assert.ok(Object.isFrozen(LEVELS[0].goals));assert.ok(Object.isFrozen(LEVELS[0].goals[0]));
});
test('tutorial numeric definitions remain exactly the released v2 values',()=>{
  assert.deepEqual(LEVELS.map(l=>[l.types,l.moves,l.seed,l.goals.map(g=>[g.kind,g.target])]),[
    [4,14,1200,[[null,100]]],[4,16,1297,[[1,30],[null,100]]],[5,18,1394,[[2,24],[3,24]]],
    [5,18,1491,[[null,140]]],[5,20,1588,[[5,30],[null,140]]],[6,22,1685,[[null,170]]],
    [6,26,1782,[[6,28],[1,24]]],[7,28,1879,[[7,28],[null,140]]],[7,30,1976,[[4,24],[2,24]]],
    [7,34,2073,[[null,200],[7,24],[3,24]]]
  ]);
});
test('legacy version cannot be forged for a generated saved round',()=>{
  const s=memory(),save=new RoundSave(s,'guest');save.save(new LevelSession(getLevel(11)),{runId:'new',accountId:'guest',startedAt:1});
  const raw=JSON.parse(s.value()!);raw.rulesVersion='2026-11-04.v2';s.setItem('',JSON.stringify(raw));assert.equal(save.read(),null);assert.equal(save.problem,'invalid');
});
test('sparse save and read failure merge unions rather than comparing completion counts',()=>{
  const s=memory(JSON.stringify({version:1,completed:[1,5,10000]})),c=new Campaign(s);s.setItem('',JSON.stringify({version:1,completed:[1,2,40]}));
  assert.equal(c.reload(),true);assert.deepEqual(c.completed,[1,2,5,40,10000]);c.save();assert.deepEqual(JSON.parse(s.value()!).completed,c.completed);
});
