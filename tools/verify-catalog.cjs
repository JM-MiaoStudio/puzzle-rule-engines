'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {link,match3,ENGINE_VERSION}=require('../dist');
const sha=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Independent corner enumeration, not the engine's direction-state path search.
function oracle(board,a,z){
 const h=board.length,w=board[0].length;
 if(board[a.y][a.x]===null||board[a.y][a.x]!==board[z.y][z.x])return false;
 const clear=(p,q)=>{
  if(p.x!==q.x&&p.y!==q.y)return false;
  const dx=Math.sign(q.x-p.x),dy=Math.sign(q.y-p.y);let x=p.x,y=p.y;
  while(true){if(x>=0&&x<w&&y>=0&&y<h&&board[y][x]!==null&&!(x===a.x&&y===a.y)&&!(x===z.x&&y===z.y))return false;
   if(x===q.x&&y===q.y)return true;x+=dx;y+=dy;
  }
 };
 if(clear(a,z))return true;
 for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++)if(clear(a,{x,y})&&clear({x,y},z))return true;
 for(let x=-1;x<=w;x++)if(clear(a,{x,y:a.y})&&clear({x,y:a.y},{x,y:z.y})&&clear({x,y:z.y},z))return true;
 for(let y=-1;y<=h;y++)if(clear(a,{x:a.x,y})&&clear({x:a.x,y},{x:z.x,y})&&clear({x:z.x,y},z))return true;
 return false;
}
const started=Date.now();
const report={engineVersion:ENGINE_VERSION,node:process.version,link:{rulesVersion:link.LINK_RULES_VERSION,cases:0,pairs:0,ids:[],caseHashes:[]},match3:{rulesVersion:match3.LEVEL_RULES_VERSION,cases:0,won:0,lost:0,caseHashes:[],failedHeuristicIds:[]}};
const ids=[...Array.from({length:1000},(_,i)=>i+1),1001,10000,999999,1000000];
for(const id of ids){
 const level=link.linkLevel(id),made=link.generateBoard(level,level.seed),board=made.board.map(r=>r.slice()),session=new link.LinkSession(id);
 for(const [index,pair] of made.solution.entries()){
  assert.ok(oracle(board,pair.a,pair.b),'Independent witness: '+id);
  assert.ok(session.act({type:'pair',a:pair.a,b:pair.b}));
  board[pair.a.y][pair.a.x]=null;board[pair.b.y][pair.b.x]=null;
  if(index===Math.floor(made.solution.length/2))assert.deepEqual(link.LinkSession.restore(JSON.parse(JSON.stringify(session.getReplay()))).snapshot(),session.snapshot());
 }
 assert.ok(board.flat().every(v=>v===null));assert.equal(session.snapshot().status,'won');
 assert.deepEqual(link.LinkSession.restore(session.getReplay()).snapshot(),session.snapshot());
 report.link.cases++;report.link.pairs+=made.solution.length;report.link.ids.push(id);report.link.caseHashes.push(sha([id,made.solution,session.snapshot()]));
 if(id%100===0)console.log('Link witnesses and saves verified through '+id);
}
const matchIds=[...Array.from({length:1000},(_,i)=>i+1),1001,10000,999999,1000000];
for(const id of matchIds){
 const level=match3.getLevel(id),result=match3.playVisible(level,'special',1),session=new match3.LevelSession(level);
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},save=new match3.RoundSave(storage,'synthetic');
 for(const [index,move] of result.path.entries()){
  assert.ok(session.swap(move.a,move.b)?.valid,'Legal heuristic move: '+id);
  if(index===Math.floor(result.path.length/2)){
   assert.equal(save.save(session,{runId:'synthetic-'+id,accountId:'synthetic',startedAt:1}),true);
   const restored=save.read();assert.ok(restored);assert.deepEqual(restored.session.model.snapshot(),session.model.snapshot());assert.deepEqual(restored.session.snapshot(),session.snapshot());
  }
 }
 assert.equal(session.snapshot().status,result.status);assert.deepEqual(session.snapshot().goals,result.goals);assert.ok(result.path.length<=level.moves);
 assert.equal(save.save(session,{runId:'synthetic-'+id,accountId:'synthetic',startedAt:1}),true);
 const restored=save.read();assert.ok(restored);assert.deepEqual(restored.session.model.snapshot(),session.model.snapshot());assert.deepEqual(restored.session.snapshot(),session.snapshot());
 report.match3.cases++;report.match3[result.status]++;if(result.status!=='won')report.match3.failedHeuristicIds.push(id);
 report.match3.caseHashes.push(sha([id,result.path,session.snapshot(),session.model.snapshot()]));
 if(id%100===0)console.log('Match-3 legal playback and saves verified through '+id);
}
report.link.digest=sha(report.link.caseHashes);delete report.link.caseHashes;
report.match3.digest=sha(report.match3.caseHashes);delete report.match3.caseHashes;
report.elapsedMs=Date.now()-started;report.generatedAt=new Date().toISOString();
report.note='Synthetic reachability and exact replay/save checks, not human difficulty testing. The match-3 special policy is heuristic; a lost attempt does not prove impossibility. IDs beyond 1000 reuse the 900 high-stage seed templates.';
fs.mkdirSync('verification',{recursive:true});fs.writeFileSync('verification/catalog-summary.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({linkCases:report.link.cases,linkPairs:report.link.pairs,match3Cases:report.match3.cases,match3Won:report.match3.won,match3Lost:report.match3.lost,elapsedMs:report.elapsedMs}));
