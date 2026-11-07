/** Offline validation only. The policy sees the visible board, never refill RNG or future cascades. */
import { LevelSession } from './LevelSession';
import type { LevelDefinition } from './Levels';
import type { Board, Move } from './Match3';
export type VisiblePolicy='clear'|'special'|'mixed';
export function visibleMoveScore(board:Board,move:Move,policy:VisiblePolicy):number {
  const b=board.map(row=>row.slice()),{a,b:p}=move,ca=b[a.y][a.x],cb=b[p.y][p.x];
  b[a.y][a.x]=cb;b[p.y][p.x]=ca;
  const h=b.length,w=b[0].length,clear=new Set<number>();let spawnValue=0;
  const add=(x:number,y:number)=>{if(x>=0&&x<w&&y>=0&&y<h)clear.add(y*w+x);};
  if(ca.special==='wild'||cb.special==='wild'){
    const kind=ca.special==='wild'?cb.kind:ca.kind;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(b[y][x].kind===kind||ca.special==='wild'&&cb.special==='wild')add(x,y);
    add(a.x,a.y);add(p.x,p.y);
    if(ca.special!=='none'&&cb.special!=='none')spawnValue+=10;
  }else if(ca.special!=='none'&&cb.special!=='none'){
    // Reward visible special combinations; no hidden tile is sampled.
    add(a.x,a.y);add(p.x,p.y);spawnValue+=12;
  }
  for(const vertical of [false,true])for(let line=0;line<(vertical?w:h);line++){
    const cell=(i:number)=>vertical?b[i][line]:b[line][i];const length=vertical?h:w;
    for(let start=0;start<length;){let end=start+1;while(end<length&&cell(end).kind===cell(start).kind&&cell(start).special!=='wild'&&cell(end).special!=='wild')end++;
      if(end-start>=3){for(let i=start;i<end;i++)add(vertical?line:i,vertical?i:line);if(end-start>=4)spawnValue+=end-start>=5?8:4;}
      start=end;
    }
  }
  // Approximate only the first visible wave. Effects may chain, but there is no refill simulation.
  const processed=new Set<number>();
  for(const key of clear){if(processed.has(key))continue;processed.add(key);const x=key%w,y=Math.floor(key/w),s=b[y][x].special;
    if(s==='row')for(let xx=0;xx<w;xx++)add(xx,y);
    if(s==='column')for(let yy=0;yy<h;yy++)add(x,yy);
    if(s==='area')for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)add(xx,yy);
  }
  return clear.size+spawnValue*(policy==='special'?2:policy==='mixed'?1:.25);
}
export function playVisible(level:LevelDefinition,policy:VisiblePolicy,tieSeed:number){
  const session=new LevelSession(level),path:Move[]=[];let state=tieSeed>>>0||1;
  const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
  while(session.snapshot().status==='playing'){
    const board=session.model.snapshot(),moves=session.model.findMoves();let best=moves[0],score=-Infinity;
    for(const move of moves){const value=visibleMoveScore(board,move,policy)+(policy==='mixed'?random()*4:random()*.001);if(value>score){score=value;best=move;}}
    if(!best)throw Error('No playable move during offline evaluation');
    if(!session.swap(best.a,best.b)?.valid)throw Error('Robot selected an illegal move');path.push(best);
  }
  const snapshot=session.snapshot();return{policy,tieSeed,status:snapshot.status,movesUsed:path.length,remaining:snapshot.remainingMoves,goals:snapshot.goals,path};
}
