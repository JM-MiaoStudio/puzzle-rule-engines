import {findLink,findPairs,type Board,type Position} from './LinkPath';import type {LinkLevel} from './LinkLevels';
export interface Pair{a:Position;b:Position}
export class Random{state:number;constructor(seed:number){this.state=(seed>>>0)||0x9e3779b9;}next(){let x=this.state;x^=x<<13;x^=x>>>17;x^=x<<5;this.state=x>>>0;return this.state/4294967296;}int(n:number){return Math.floor(this.next()*n);}shuffle<T>(a:T[]){for(let i=a.length-1;i>0;i--){const j=this.int(i+1),v=a[i];a[i]=a[j];a[j]=v;}return a;}}
export const cloneBoard=(board:Board)=>board.map(row=>row.slice());
export function generateBoard(level:LinkLevel,seed:number){
  if(level.generation)return generateChapterBoard(level,seed);
  const random=new Random(seed),work:Board=Array.from({length:level.rows},(_,y)=>Array.from({length:level.cols},(_,x)=>level.holes?.some(h=>h.x===x&&h.y===y)?null:1)),board=work.map(r=>r.map(()=>null)) as Board,solution:Pair[]=[];
  let cells:Position[]=[];work.forEach((r,y)=>r.forEach((v,x)=>{if(v!==null)cells.push({x,y});}));if(cells.length%2)throw Error('棋盘必须包含偶数张工具');
  if(!level.toolIds.length||new Set(level.toolIds).size!==level.toolIds.length||level.toolIds.some(id=>!Number.isInteger(id)||id<1||id>18))throw Error('工具配置不正确');
  const kinds=random.shuffle(Array.from({length:cells.length/2},(_,i)=>level.toolIds[i%level.toolIds.length]));
  while(cells.length){let pair:Pair|undefined;for(let attempt=0;attempt<64;attempt++){const a=cells[random.int(cells.length)],b=cells[random.int(cells.length)];if(findLink(work,a,b)){pair={a,b};break;}}pair??=findPairs(work,1)[0];if(!pair)throw Error('布局无法生成完整通关路径');const kind=kinds[solution.length];for(const p of[pair.a,pair.b]){board[p.y][p.x]=kind;work[p.y][p.x]=null;}solution.push({a:{...pair.a},b:{...pair.b}});cells=cells.filter(p=>work[p.y][p.x]!==null);}
  return{board,solution,randomState:random.state};
}
export function shuffleBoard(source:Board,seed:number){const random=new Random(seed),board=cloneBoard(source),positions:Position[]=[],values:number[]=[];board.forEach((r,y)=>r.forEach((v,x)=>{if(v!==null){positions.push({x,y});values.push(v);}}));if(!positions.length)return{board,randomState:random.state};
  const fill=(list:number[])=>positions.forEach((p,i)=>{board[p.y][p.x]=list[i];});
  for(let attempt=0;attempt<24;attempt++){random.shuffle(values);fill(values);if(findPairs(board,1).length)return{board,randomState:random.state};}
  const geometry=source.map(r=>r.map(v=>v===null?null:1)),pair=findPairs(geometry,1)[0];if(!pair)throw Error('无法恢复可玩布局');const counts=new Map<number,number>();values.forEach(v=>counts.set(v,(counts.get(v)??0)+1));const kind=Array.from(counts).find(([,count])=>count>=2)?.[0];if(kind===undefined)throw Error('剩余工具无法配对');const rest=values.slice();rest.splice(rest.indexOf(kind),1);rest.splice(rest.indexOf(kind),1);for(const p of positions){board[p.y][p.x]=(p.x===pair.a.x&&p.y===pair.a.y)||(p.x===pair.b.x&&p.y===pair.b.y)?kind:rest.pop()!;}return{board,randomState:random.state};
}

/** Fixed budget: <=40 rounds x48 candidate paths plus one bounded geometry scan.
 * Geometry constructs a complete witness; identities are assigned afterwards.
 * Version v4 only: legacy/tutorial boards never use this generator.
 */
function generateChapterBoard(level:LinkLevel,seed:number){
 const random=new Random(seed),work:Board=Array.from({length:level.rows},(_,y)=>Array.from({length:level.cols},(_,x)=>level.holes?.some(h=>h.x===x&&h.y===y)?null:1));
 const board=work.map(row=>row.map(()=>null)) as Board,solution:Pair[]=[],phase=level.generation!.phase;
 let cells:Position[]=[];work.forEach((row,y)=>row.forEach((v,x)=>{if(v!==null)cells.push({x,y});}));
 if(cells.length%2||cells.length>80||!level.toolIds.length)throw Error('生成关卡配置不正确');
 const kinds=random.shuffle(Array.from({length:cells.length/2},(_,i)=>level.toolIds[i%level.toolIds.length]));
 while(cells.length){
  let pair:Pair|undefined,best=-Infinity;
  if(phase===0){for(const a of cells){const b={x:a.x+1,y:a.y};if(b.x<level.cols&&work[b.y][b.x]!==null){pair={a,b};break;}}}
  else for(let attempt=0;attempt<48;attempt++){
   const a=cells[random.int(cells.length)],b=cells[random.int(cells.length)],path=findLink(work,a,b);if(!path)continue;
   const distance=Math.abs(a.x-b.x)+Math.abs(a.y-b.y),score=(path.length-2)*(phase-1)*4+distance*(phase===1?.15:1)+random.next();
   if(score>best){pair={a,b};best=score;}
  }
  pair??=findPairs(work,1)[0];if(!pair)throw Error('布局无法生成完整通关路径');
  const kind=kinds[solution.length];for(const p of[pair.a,pair.b]){board[p.y][p.x]=kind;work[p.y][p.x]=null;}
  solution.push({a:{...pair.a},b:{...pair.b}});cells=cells.filter(p=>work[p.y][p.x]!==null);
 }
 return{board,solution,randomState:random.state};
}
