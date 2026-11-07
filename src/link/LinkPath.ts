export interface Position{x:number;y:number}
export type Board=(number|null)[][];
export function findLink(board:Board,a:Position,b:Position):Position[]|null{
  const h=board.length,w=board[0]?.length??0,inside=(p:Position)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<w&&p.y>=0&&p.y<h;
  if(!w||board.some(r=>r.length!==w)||!inside(a)||!inside(b)||(a.x===b.x&&a.y===b.y)||board[a.y][a.x]===null||board[a.y][a.x]!==board[b.y][b.x])return null;
  type State={p:Position;dir:number;turns:number;path:Position[]};
  const queue:State[]=[{p:{...a},dir:-1,turns:0,path:[{...a}]}],seen=new Map<string,number>(),directions=[[1,0],[0,1],[-1,0],[0,-1]];
  while(queue.length){queue.sort((s,t)=>s.turns-t.turns||s.path.length-t.path.length);const current=queue.shift()!;
    for(let dir=0;dir<4;dir++){
      const p={x:current.p.x+directions[dir][0],y:current.p.y+directions[dir][1]},turns=current.turns+(current.dir!==-1&&current.dir!==dir?1:0);
      if(turns>2||p.x<-1||p.x>w||p.y<-1||p.y>h)continue;
      const target=p.x===b.x&&p.y===b.y;if(!target&&inside(p)&&board[p.y][p.x]!==null)continue;
      const cost=turns*10000+current.path.length,key=p.x+','+p.y+','+dir;if((seen.get(key)??Infinity)<=cost)continue;seen.set(key,cost);
      const path=current.path.concat([p]);queue.push({p,dir,turns,path});
    }
    if(current.p.x===b.x&&current.p.y===b.y){const corners=[current.path[0]];for(let i=1;i<current.path.length-1;i++){const p=current.path[i],before=current.path[i-1],next=current.path[i+1];if(p.x-before.x!==next.x-p.x||p.y-before.y!==next.y-p.y)corners.push(p);}corners.push(current.path[current.path.length-1]);return corners;}
  }
  return null;
}
export function findPairs(board:Board,limit=Infinity):{a:Position;b:Position;path:Position[]}[]{
  const cells:Position[]=[],result:{a:Position;b:Position;path:Position[]}[]=[];board.forEach((r,y)=>r.forEach((v,x)=>{if(v!==null)cells.push({x,y});}));
  for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){const a=cells[i],b=cells[j];if(board[a.y][a.x]!==board[b.y][b.x])continue;const path=findLink(board,a,b);if(path){result.push({a,b,path});if(result.length>=limit)return result;}}
  return result;
}
