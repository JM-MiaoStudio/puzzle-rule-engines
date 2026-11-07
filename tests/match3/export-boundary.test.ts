import test from 'node:test';
import assert from 'node:assert/strict';
import { RoundSave } from '../../src/match3/RoundSave';
import { LevelSession } from '../../src/match3/LevelSession';
import { getLevel } from '../../src/match3/Levels';
test('local save allowlist omits unrelated context fields',()=>{
 const data=new Map<string,string>();const store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 const save=new RoundSave(store,'guest');
 save.save(new LevelSession(getLevel(1)),{runId:'synthetic',accountId:'guest',startedAt:1,extraBusinessData:'excluded'} as any);
 const saved=JSON.parse(data.get(save.key)!);
 assert.deepEqual(Object.keys(saved).sort(),['runId','accountId','startedAt','version','rulesVersion','levelId','seed','moves','savedAt'].sort());
 assert.equal(save.key.startsWith('puzzle-engine.'),true);
});

import { Match3 } from '../../src/match3/Match3';
test('catalog save rejects a custom initial board without replacing a prior save',()=>{
 const data=new Map<string,string>();const store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 const save=new RoundSave(store,'guest'),context={runId:'synthetic',accountId:'guest',startedAt:1};
 assert.equal(save.save(new LevelSession(getLevel(1)),context),true);const previous=data.get(save.key);
 const custom=new LevelSession(getLevel(1),{board:new Match3({seed:123,types:4}).snapshot()});
 assert.equal(save.save(custom,context),false);assert.equal(save.problem,'invalid');assert.equal(data.get(save.key),previous);
});
test('catalog save rejects altered numeric definitions but allows display text changes',()=>{
 const store={getItem:()=>null,setItem:(_k:string,_v:string)=>{}},save=new RoundSave(store,'guest'),context={runId:'synthetic',accountId:'guest',startedAt:1};
 for(const change of [{moves:999},{types:5},{goals:[{kind:null,target:1}]}]){
  const custom=new LevelSession({...getLevel(1),...change});assert.equal(save.save(custom,context),false);assert.equal(save.problem,'invalid');
 }
 assert.equal(save.save(new LevelSession({...getLevel(1),name:'Custom label',tip:'Custom hint'}),context),true);
});

test('legacy seed overrides still round-trip while current catalog seeds are enforced',()=>{
 const data=new Map<string,string>();const store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 const save=new RoundSave(store,'guest'),context={runId:'synthetic',accountId:'guest',startedAt:1};
 const legacy=new LevelSession(getLevel(101,'2026-11-04.v3'),{seed:345});const move=legacy.model.findMoves()[0];legacy.swap(move.a,move.b);
 assert.equal(save.save(legacy,context),true);assert.deepEqual(save.read()!.session.model.snapshot(),legacy.model.snapshot());
 const level=getLevel(101);assert.equal(save.save(new LevelSession(level,{seed:level.seed+1}),context),false);
});
