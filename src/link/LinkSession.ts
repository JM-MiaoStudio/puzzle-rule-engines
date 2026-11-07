import {findLink,findPairs,type Board,type Position} from './LinkPath';import {generateBoard,shuffleBoard,cloneBoard} from './LinkBoard';import {linkLevel,LINK_RULES_VERSION,IP_LINK_RULES_VERSION,LEGACY_LINK_RULES_VERSION,TOOL_LINK_RULES_VERSION} from './LinkLevels';
export type LinkAction={type:'pair';a:Position;b:Position}|{type:'hint'}|{type:'shuffle'};
export type ReplayAction=LinkAction&{repeat?:number};
export interface LinkReplay{levelId:number;seed:number;rulesVersion:string;actions:ReplayAction[]}
export class LinkSession{
  private board:Board;private randomState:number;private actions:ReplayAction[]=[];private hints=0;private shuffles=0;private autoShuffles=0;readonly total:number;
  constructor(readonly levelId:number,readonly seed=linkLevel(levelId).seed,readonly rulesVersion=LINK_RULES_VERSION){const made=generateBoard(linkLevel(levelId,rulesVersion),seed);this.board=made.board;this.randomState=made.randomState;this.total=this.board.flat().filter(v=>v!==null).length;}
  snapshot(){const remaining=this.board.flat().filter(v=>v!==null).length;return{levelId:this.levelId,seed:this.seed,rulesVersion:this.rulesVersion,board:cloneBoard(this.board),remaining,total:this.total,pairs:(this.total-remaining)/2,hints:this.hints,shuffles:this.shuffles,autoShuffles:this.autoShuffles,status:remaining?'playing' as const:'won' as const,randomState:this.randomState};}
  act(action:LinkAction):{path:Position[];shuffled:boolean}|null{if(!this.snapshot().remaining)return null;let path:Position[]=[],shuffled=false;
    if(action.type==='pair'){const link=findLink(this.board,action.a,action.b);if(!link)return null;path=link;this.board[action.a.y][action.a.x]=null;this.board[action.b.y][action.b.x]=null;if(this.board.flat().some(v=>v!==null)&&!findPairs(this.board,1).length){this.shuffle();this.autoShuffles++;shuffled=true;}}
    else if(action.type==='hint'){path=findPairs(this.board,1)[0]?.path??[];this.hints++;}
    else if(action.type==='shuffle'){this.shuffle();this.shuffles++;shuffled=true;}
    else return null;
    this.record(action);return{path,shuffled};
  }
  private shuffle(){const result=shuffleBoard(this.board,this.randomState);this.board=result.board;this.randomState=result.randomState;}
  private record(action:LinkAction,repeat=1){const last=this.actions[this.actions.length-1];if(action.type!=='pair'&&last?.type===action.type)last.repeat=(last.repeat??1)+repeat;else{const canonical:LinkAction=action.type==='pair'?{type:'pair',a:{x:action.a.x,y:action.a.y},b:{x:action.b.x,y:action.b.y}}:{type:action.type};this.actions.push({...canonical,...(repeat>1?{repeat}:{})});}}
  getReplay():LinkReplay{return{levelId:this.levelId,seed:this.seed,rulesVersion:this.rulesVersion,actions:JSON.parse(JSON.stringify(this.actions))};}
  static restore(replay:LinkReplay){if(!replay||![LINK_RULES_VERSION,IP_LINK_RULES_VERSION,LEGACY_LINK_RULES_VERSION,TOOL_LINK_RULES_VERSION].includes(replay.rulesVersion)||!Number.isInteger(replay.seed)||!Array.isArray(replay.actions))throw Error('存档版本或数据不正确');const s=new LinkSession(replay.levelId,replay.seed,replay.rulesVersion);for(const action of replay.actions){const repeat=action?.repeat??1;if(!action||!Number.isSafeInteger(repeat)||repeat<1||(action.type==='pair'&&repeat!==1)||s.snapshot().status==='won')throw Error('存档操作无法重放');if(action.type==='hint'){s.hints+=repeat;s.record({type:'hint'},repeat);}else{for(let i=0;i<repeat;i++)if(!s.act(action))throw Error('存档操作无法重放');}}return s;}
}
