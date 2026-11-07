import { getLevel, LEVEL_RULES_VERSION, PREVIOUS_LEVEL_RULES_VERSION, LEGACY_LEVEL_RULES_VERSION } from './Levels';
import { LevelSession } from './LevelSession';
import type { Move } from './Match3';
import type { ProgressStorage } from './Campaign';
export interface RoundContext {runId:string;accountId:string;startedAt:number}
export interface SavedRound extends RoundContext {version:1;rulesVersion:string;levelId:number;seed:number;moves:Move[];savedAt:number}
export class RoundSave {
  readonly key:string;
  readonly rulesVersion=LEVEL_RULES_VERSION;
  problem:'storage'|'invalid'|'outdated'|null=null;
  private memory:{record:SavedRound;session:LevelSession}|undefined;
  get needsSave(){return !!this.memory;}
  constructor(private storage:ProgressStorage,readonly accountId:string){this.key='puzzle-engine.match3.round.v1.'+encodeURIComponent(accountId);}
  save(session:LevelSession,context:RoundContext):boolean {
    if(context.accountId!==this.accountId)throw Error('Round account mismatch');
    const replay=session.model.getReplay();
    const catalog=getLevel(session.level.id,session.rulesVersion);
    // This adapter replays catalog rounds; custom boards/definitions need their own format.
    if(replay.board!==undefined||session.level.types!==catalog.types||session.level.moves!==catalog.moves||JSON.stringify(session.level.goals)!==JSON.stringify(catalog.goals)){this.problem='invalid';return false;}
    if(session.rulesVersion===LEVEL_RULES_VERSION&&replay.seed!==getLevel(session.level.id,session.rulesVersion).seed){this.problem='invalid';return false;}
    const record:SavedRound={runId:context.runId,accountId:context.accountId,startedAt:context.startedAt,version:1,rulesVersion:session.rulesVersion,levelId:session.level.id,seed:replay.seed,moves:replay.moves,savedAt:Date.now()};
    try{this.storage.setItem(this.key,JSON.stringify(record));this.memory=undefined;this.problem=null;return true;}catch{this.memory={record,session};this.problem='storage';return false;}
  }
  read():{record:SavedRound;session:LevelSession}|null {
    if(this.memory){this.problem='storage';return this.memory;}
    let raw:string|null;try{raw=this.storage.getItem(this.key);}catch{this.problem='storage';return null;}
    try{
      if(!raw||raw==='null'){this.problem=null;return null;}
      if(raw.length>50000)throw Error('Oversized save');
      const r=JSON.parse(raw) as SavedRound;
      if(r?.rulesVersion!==this.rulesVersion&&r?.rulesVersion!==PREVIOUS_LEVEL_RULES_VERSION&&r?.rulesVersion!==LEGACY_LEVEL_RULES_VERSION){this.problem='outdated';return null;}
      if(r.version!==1||r.accountId!==this.accountId||typeof r.runId!=='string'||!r.runId||r.runId.length>160||!Number.isFinite(r.startedAt)||!Number.isInteger(r.seed)||r.seed<1||r.seed>0xffffffff||!Array.isArray(r.moves))throw Error('Invalid save');
      const level=getLevel(r.levelId,r.rulesVersion);if(r.moves.length>level.moves)throw Error('Too many moves');
      if(r.rulesVersion===LEVEL_RULES_VERSION&&r.seed!==level.seed)throw Error('Uncertified seed');
      const session=new LevelSession(level,{seed:r.seed});
      for(const move of r.moves){
        for(const p of [move.a,move.b])if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.x>8||p.y<0||p.y>8)throw Error('Invalid coordinate');
        if(!session.swap(move.a,move.b)?.valid)throw Error('Invalid or terminal move');
      }
      this.problem=null;return{record:r,session};
    }catch{this.problem='invalid';return null;}
  }
  retry(){if(this.memory)return this.save(this.memory.session,this.memory.record);this.read();return this.problem!=='storage';}
  clear():boolean{try{this.storage.setItem(this.key,'null');this.memory=undefined;this.problem=null;return true;}catch{this.problem='storage';return false;}}
}
