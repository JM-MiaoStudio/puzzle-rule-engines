import { Match3, type Options, type Position, type MoveResult } from './Match3';
import { LEVEL_RULES_VERSION, type LevelDefinition } from './Levels';

export type RoundStatus='playing'|'won'|'lost';
export interface SessionSnapshot {
  levelId:number; movesUsed:number; remainingMoves:number; totalCleared:number;
  status:RoundStatus; goals:{kind:number|null;target:number;current:number}[];
}
export class LevelSession {
  readonly model:Match3;
  readonly level:LevelDefinition;
  readonly rulesVersion:string;
  private used=0;
  private total=0;
  private collected:number[]=Array(8).fill(0);
  private status:RoundStatus='playing';
  constructor(level:LevelDefinition,options:Pick<Options,'seed'|'board'>={}) {
    if(!Number.isInteger(level.moves)||level.moves<1||!level.goals.length||level.goals.some(g=>!Number.isInteger(g.target)||g.target<1||(g.kind!==null&&(!Number.isInteger(g.kind)||g.kind<1||g.kind>level.types))))throw new Error('Invalid level definition');
    this.level={...level,goals:level.goals.map(g=>({...g}))};
    this.rulesVersion=level.rulesVersion??LEVEL_RULES_VERSION;
    this.model=new Match3({width:9,height:9,types:level.types,seed:level.seed,...options});
  }
  snapshot():SessionSnapshot {
    return {levelId:this.level.id,movesUsed:this.used,remainingMoves:this.level.moves-this.used,totalCleared:this.total,status:this.status,
      goals:this.level.goals.map(g=>({...g,current:g.kind===null?this.total:this.collected[g.kind]}))};
  }
  swap(a:Position,b:Position):MoveResult|null {
    if(this.status!=='playing')return null;
    const result=this.model.swap(a,b);
    if(!result.valid)return result;
    this.used++;
    for(const wave of result.cascades)for(const p of wave.cleared){const cell=wave.before[p.y][p.x];this.total++;this.collected[cell.kind]++;}
    // The full cascade is settled first; completing the last move still wins.
    if(this.snapshot().goals.every(g=>g.current>=g.target))this.status='won';
    else if(this.used>=this.level.moves)this.status='lost';
    return result;
  }
}
