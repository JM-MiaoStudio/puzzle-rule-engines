import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleMoveScore, playVisible } from '../../src/match3/Match3Evaluation';
import { getLevel } from '../../src/match3/Levels';
import { Match3 } from '../../src/match3/Match3';
test('visible evaluation is independent of hidden refill RNG and does not mutate board',()=>{
  const a=new Match3({seed:10}),board=a.snapshot(),m=a.findMoves()[0];
  const copy=JSON.stringify(board);assert.equal(visibleMoveScore(board,m,'clear'),visibleMoveScore(board,m,'clear'));assert.equal(JSON.stringify(board),copy);
});
test('visible robot emits legal deterministic paths and finite effort',()=>{
  const level=getLevel(11),a=playVisible(level,'clear',42),b=playVisible(level,'clear',42);assert.deepEqual(a,b);
  assert.ok(a.path.length<=level.moves);assert.ok(a.path.length>0);assert.ok(a.goals[0].current>0);
});
