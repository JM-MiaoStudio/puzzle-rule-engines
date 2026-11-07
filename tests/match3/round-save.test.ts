import test from 'node:test';
import assert from 'node:assert/strict';
import { RoundSave } from '../../src/match3/RoundSave';
import { LevelSession } from '../../src/match3/LevelSession';
import { getLevel } from '../../src/match3/Levels';
const memory=()=>{const data=new Map<string,string>();return{data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};};
test('saved move replays exact board, goals and remaining moves',()=>{
  const storage=memory(),save=new RoundSave(storage,'guest'),round=new LevelSession(getLevel(1));const move=round.model.findMoves()[0];round.swap(move.a,move.b);
  assert.equal(save.save(round,{runId:'one',accountId:'guest',startedAt:1000}),true);
  const restored=save.read()!;assert.deepEqual(restored.session.snapshot(),round.snapshot());assert.deepEqual(restored.session.model.snapshot(),round.model.snapshot());
});
test('accounts are isolated; outdated, malformed and invalid moves cannot restore',()=>{
  const storage=memory(),save=new RoundSave(storage,'alice'),round=new LevelSession(getLevel(1));save.save(round,{runId:'one',accountId:'alice',startedAt:1});assert.equal(new RoundSave(storage,'bob').read(),null);
  const raw=JSON.parse(storage.data.get(save.key)!);raw.rulesVersion='old';storage.data.set(save.key,JSON.stringify(raw));assert.equal(save.read(),null);assert.equal(save.problem,'outdated');
  raw.rulesVersion=save.rulesVersion;raw.moves=[{a:{x:0,y:0},b:{x:8,y:8}}];storage.data.set(save.key,JSON.stringify(raw));assert.equal(save.read(),null);assert.equal(save.problem,'invalid');
  storage.data.set(save.key,'{');assert.equal(save.read(),null);
});
test('failed write preserves previous save and can retry',()=>{
  const storage=memory(),save=new RoundSave(storage,'guest'),round=new LevelSession(getLevel(1));save.save(round,{runId:'one',accountId:'guest',startedAt:1});const prior=storage.data.get(save.key);
  const write=storage.setItem;storage.setItem=()=>{throw Error('quota');};const move=round.model.findMoves()[0];round.swap(move.a,move.b);
  assert.equal(save.save(round,{runId:'one',accountId:'guest',startedAt:1}),false);assert.equal(save.problem,'storage');assert.equal(storage.data.get(save.key),prior);
  storage.setItem=write;assert.equal(save.save(round,{runId:'one',accountId:'guest',startedAt:1}),true);
});
test('terminal result restores and clear is durable',()=>{
  const round=new LevelSession(getLevel(1)),storage=memory(),save=new RoundSave(storage,'guest');const move=round.model.findMoves()[0];while(round.snapshot().status==='playing'){const m=round.model.findMoves()[0];round.swap(m.a,m.b);}save.save(round,{runId:'one',accountId:'guest',startedAt:1});
  const restored=save.read()!;assert.notEqual(restored.session.snapshot().status,'playing');assert.equal(restored.session.swap(move.a,move.b),null);assert.equal(save.clear(),true);assert.equal(save.read(),null);
});
test('latest unsaved session survives leaving the board and retries without reverting to old disk state',()=>{
  const storage=memory(),save=new RoundSave(storage,'guest'),round=new LevelSession(getLevel(1)),context={runId:'one',accountId:'guest',startedAt:1};save.save(round,context);
  const write=storage.setItem;storage.setItem=()=>{throw Error('quota');};const move=round.model.findMoves()[0];round.swap(move.a,move.b);save.save(round,context);
  assert.deepEqual(save.read()!.session.snapshot(),round.snapshot());assert.equal(save.needsSave,true);storage.setItem=write;assert.equal(save.retry(),true);assert.equal(save.needsSave,false);assert.deepEqual(new RoundSave(storage,'guest').read()!.session.model.snapshot(),round.model.snapshot());
});
