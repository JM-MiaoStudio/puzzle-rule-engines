import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Match3, type Board, type Special } from '../../src/match3/Match3';

// Fixtures are hand-authored; assertions do not call the engine's match finder.
const fixture = (rows: number[][]): Board => rows.map((r, y) => r.map((kind, x) => ({kind, special: 'none', id: y * 20 + x + 1})));
const latin = (w = 5, h = 5) => fixture(Array.from({length:h}, (_, y) => Array.from({length:w}, (_, x) => (x + y * 2) % 7 + 1)));
const put = (b: Board, x: number, y: number, kind: number, special: Special = 'none') => { b[y][x] = {...b[y][x],kind,special}; };

test('non-adjacent and out-of-range swaps leave every cell unchanged', () => {
  const m = new Match3({board:latin(6,4), seed:42}); const before=m.snapshot();
  for (const [a,b] of [[{x:-1,y:0},{x:0,y:0}],[{x:0,y:0},{x:2,y:0}],[{x:6,y:0},{x:5,y:0}]]) {
    assert.equal(m.swap(a,b).valid,false); assert.deepEqual(m.snapshot(),before);
  }
});
test('an adjacent swap without a match rolls back', () => {
  const m=new Match3({board:latin(),seed:8}); const before=m.snapshot();
  const r=m.swap({x:0,y:0},{x:1,y:0});assert.equal(r.valid,false);assert.deepEqual(m.snapshot(),before);
});
test('a row of three clears and leaves a full stable board', () => {
  const b=latin();put(b,0,0,1);put(b,1,0,1);put(b,2,0,2);put(b,2,1,1);
  const m=new Match3({board:b,seed:91});const r=m.swap({x:2,y:0},{x:2,y:1});
  assert.equal(r.valid,true); assert.deepEqual(r.cascades[0].cleared,[{x:0,y:0},{x:1,y:0},{x:2,y:0}]);
  assert.equal(r.after.length,5);assert.equal(r.after.flat().length,25);assert.deepEqual(m.matches(),[]);
});
test('a four-match creates a row special at the swapped destination', () => {
  const b=latin();[0,1,2].forEach(x=>put(b,x,0,1));put(b,3,0,2);put(b,3,1,1);
  const m=new Match3({board:b,seed:91});const r=m.swap({x:3,y:1},{x:3,y:0});
  assert.equal(r.valid,true);assert.equal(r.cascades[0].spawned[0].cell.special,'row');
  assert.deepEqual(r.cascades[0].spawned[0].position,{x:3,y:0});
});
test('five in a column creates a wild ability without taking occupation seven', () => {
  const b=latin();for(let y=0;y<5;y++)put(b,0,y,7);put(b,0,2,2);put(b,1,2,7);
  const r=new Match3({board:b,seed:32}).swap({x:1,y:2},{x:0,y:2});
  assert.equal(r.valid,true);assert.equal(r.cascades[0].spawned[0].cell.special,'wild');
  assert.equal(r.cascades[0].spawned[0].cell.kind,7);
});
test('a T match produces one area special', () => {
  const b=latin();for(const [x,y] of [[1,1],[3,1],[2,2],[2,3],[2,0]])put(b,x,y,6);put(b,2,1,1);
  const r=new Match3({board:b,seed:34}).swap({x:2,y:0},{x:2,y:1});
  assert.equal(r.valid,true);assert.equal(r.cascades[0].spawned[0].cell.special,'area');
});
test('row plus area activates without requiring an ordinary three-match', () => {
  const b=latin();put(b,1,2,1,'row');put(b,2,2,2,'area');
  const r=new Match3({board:b,seed:5}).swap({x:1,y:2},{x:2,y:2});
  assert.equal(r.valid,true);const hits=r.cascades[0].cleared;
  for(let y=1;y<=3;y++)for(let x=0;x<5;x++)assert.ok(hits.some(p=>p.x===x&&p.y===y));
  assert.equal(new Set(hits.map(p=>`${p.x},${p.y}`)).size,hits.length);
});
test('wild plus normal clears that occupation and both exchanged cells', () => {
  const b=latin();put(b,0,0,7,'wild');put(b,1,0,4);put(b,4,4,4);
  const r=new Match3({board:b,seed:5}).swap({x:0,y:0},{x:1,y:0});
  for(const p of [{x:0,y:0},{x:1,y:0},{x:4,y:4}]) assert.ok(r.cascades[0].cleared.some(h=>h.x===p.x&&h.y===p.y));
});
test('two wilds clear the entire board exactly once', () => {
  const b=latin();put(b,1,2,2,'wild');put(b,2,2,7,'wild');
  const r=new Match3({board:b,seed:10}).swap({x:1,y:2},{x:2,y:2});
  assert.equal(r.cascades[0].cleared.length,25);
});
test('a seventh occupation matches normally and does not clear unrelated tiles', () => {
  const b=latin();put(b,0,0,7);put(b,1,0,7);put(b,2,0,2);put(b,2,1,7);
  const r=new Match3({board:b,seed:44}).swap({x:2,y:0},{x:2,y:1});
  assert.deepEqual(r.cascades[0].cleared,[{x:0,y:0},{x:1,y:0},{x:2,y:0}]);
});
test('seeded generation and moves reproduce the same boards', () => {
  const a=new Match3({width:9,height:9,types:7,seed:19});const b=new Match3({width:9,height:9,types:7,seed:19});
  assert.deepEqual(a.snapshot(),b.snapshot());const move=a.findMoves()[0];
  assert.deepEqual(a.swap(move.a,move.b),b.swap(move.a,move.b));
});
test('dead boards recover to a stable playable board', () => {
  const b=fixture([[1,2,3],[2,3,1],[3,1,2]]);const m=new Match3({board:b,types:3,seed:33});
  assert.equal(m.findMoves().length,0);assert.equal(m.ensurePlayable(),true);
  assert.ok(m.findMoves().length>0);assert.deepEqual(m.matches(),[]);
});
test('randomized play stays stable, full and playable on rectangular boards', () => {
  for(let seed=1;seed<=40;seed++) {
    const m=new Match3({width:seed%2?7:9,height:seed%2?5:9,types:7,seed});
    for(let move=0;move<25;move++) {
      assert.deepEqual(m.matches(),[]);const choices=m.findMoves();assert.ok(choices.length);
      const r=m.swap(choices[move%choices.length].a,choices[move%choices.length].b);assert.equal(r.valid,true);
      const cells=m.snapshot().flat();assert.ok(cells.every(c=>c.kind>=1&&c.kind<=7));
      assert.equal(new Set(cells.map(c=>c.id)).size,cells.length);
    }
  }
});
test('special spawn results cannot mutate the live board', () => {
  const b=latin();[0,1,2].forEach(x=>put(b,x,0,1));put(b,3,0,2);put(b,3,1,1);
  const m=new Match3({board:b,seed:91});const r=m.swap({x:3,y:1},{x:3,y:0});const before=m.snapshot();
  r.cascades[0].spawned[0].cell.kind=99;r.cascades[0].spawned[0].position.x=99;
  assert.deepEqual(m.snapshot(),before);
});
test('a replay records only valid moves and reproduces a complete session', () => {
  const m=new Match3({seed:1103});m.swap({x:-1,y:0},{x:0,y:0});
  for(let i=0;i<12;i++){const move=m.findMoves()[0];m.swap(move.a,move.b);}
  const replay=m.getReplay();assert.equal(replay.seed,1103);assert.equal(replay.moves.length,12);
  const restored=new Match3(replay);for(const move of replay.moves)assert.equal(restored.swap(move.a,move.b).valid,true);
  assert.deepEqual(restored.snapshot(),m.snapshot());
  replay.moves[0].a.x=99;assert.notEqual(m.getReplay().moves[0].a.x,99);
});
