import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, getLevel, type LevelDefinition } from '../../src/match3/Levels';
import { LevelSession } from '../../src/match3/LevelSession';
import type { Board } from '../../src/match3/Match3';

const board=():Board=>Array.from({length:5},(_,y)=>Array.from({length:5},(_,x)=>({id:y*5+x,kind:(x+y*2)%7+1,special:'none'})));
const triple=()=>{const b=board();b[0][0].kind=1;b[0][1].kind=1;b[0][2].kind=2;b[1][2].kind=1;return b;};
const definition=(moves=2,goals:LevelDefinition['goals']=[{kind:null,target:999}]):LevelDefinition=>({id:1,name:'测试',types:7,moves,seed:91,tip:'',goals});

test('invalid swaps do not use moves or advance a level goal',()=>{
  const s=new LevelSession(definition(),{board:board()});const before=s.snapshot();
  assert.equal(s.swap({x:0,y:0},{x:1,y:0})?.valid,false);assert.deepEqual(s.snapshot(),before);
});
test('one valid exchange uses one move regardless of cascade count',()=>{
  const s=new LevelSession(definition(3),{seed:13});const move=s.model.findMoves()[0];const r=s.swap(move.a,move.b)!;
  assert.equal(r.valid,true);assert.ok(r.cascades.length>1);assert.equal(s.snapshot().remainingMoves,2);assert.equal(s.snapshot().movesUsed,1);
});
test('last-move goal completion wins rather than fails',()=>{
  const s=new LevelSession(definition(1,[{kind:null,target:3}]),{board:triple()});
  s.swap({x:2,y:0},{x:2,y:1});const result=s.snapshot();
  assert.equal(result.remainingMoves,0);assert.equal(result.status,'won');assert.ok(result.goals[0].current>=3);
});
test('running out of moves with incomplete goals loses',()=>{
  const s=new LevelSession(definition(1),{board:triple()});s.swap({x:2,y:0},{x:2,y:1});assert.equal(s.snapshot().status,'lost');
});
test('a finished round rejects more swaps without changing board or counters',()=>{
  const s=new LevelSession(definition(1),{board:triple()});s.swap({x:2,y:0},{x:2,y:1});
  const before=s.model.snapshot(),state=s.snapshot();const move=s.model.findMoves()[0];
  assert.equal(s.swap(move.a,move.b),null);assert.deepEqual(s.model.snapshot(),before);assert.deepEqual(s.snapshot(),state);
});
test('occupation collection uses the removed pieces, not their refill positions',()=>{
  const s=new LevelSession(definition(2,[{kind:1,target:3},{kind:7,target:1}]),{board:triple()});
  s.swap({x:2,y:0},{x:2,y:1});const result=s.snapshot();
  assert.equal(result.goals[0].current,3);assert.equal(result.goals[1].current,0);assert.equal(result.status,'playing');
  result.goals[0].current=999;assert.equal(s.snapshot().goals[0].current,3);
});
test('all authored levels have attainable occupation targets and a stable opening',()=>{
  assert.equal(LEVELS.length,10);
  for(let id=1;id<=10;id++){
    const level=getLevel(id);assert.ok(level.goals.every(g=>g.target>0&&(g.kind===null||g.kind<=level.types)));
    const s=new LevelSession(level);assert.deepEqual(s.model.matches(),[]);assert.ok(s.model.findMoves().length);assert.equal(s.snapshot().status,'playing');
  }
  assert.throws(()=>getLevel(0));assert.equal(getLevel(11).id,11);
});
