import { MAX_LEVEL_ID } from './Levels';
export const CAMPAIGN_KEY='puzzle-engine.match3.campaign.v1';
export interface ProgressStorage { getItem(key:string):string|null; setItem(key:string,value:string):void }
function decode(raw:string|null):number[] {
  try {
    const record=JSON.parse(raw??'null');
    if(record?.version!==1||!Array.isArray(record.completed))return [];
    return Array.from(new Set<number>(record.completed.filter((id:unknown)=>typeof id==='number'&&Number.isInteger(id)&&id>=1&&id<=MAX_LEVEL_ID))).sort((a,b)=>a-b);
  } catch {return [];}
}
export class Campaign {
  private done:number[]=[];
  needsSave=false;
  readFailed=false;
  constructor(private storage:ProgressStorage,private key=CAMPAIGN_KEY) {
    try {this.done=decode(storage.getItem(this.key));}catch{this.readFailed=true;}
  }
  get completed():number[] {return this.done.slice();}
  get unlocked():number {let next=1;for(const id of this.done){if(id!==next)break;next++;}return Math.min(MAX_LEVEL_ID,next);}
  private merge(ids:number[]){this.done=Array.from(new Set(this.done.concat(ids))).sort((a,b)=>a-b);}
  reload():boolean {
    try {
      const existing=decode(this.storage.getItem(this.key));
      this.merge(existing);
      this.readFailed=false;return true;
    } catch {this.readFailed=true;return false;}
  }
  complete(id:number):boolean {
    if(!Number.isInteger(id)||id<1||id>MAX_LEVEL_ID||(id>this.unlocked&&!this.done.includes(id)))throw new Error('Cannot complete a locked level');
    this.merge([id]);
    this.needsSave=true;return this.save();
  }
  save():boolean {
    try {
      // Re-read and merge before writing, so a transient read failure or another
      // tab with higher progress cannot be overwritten by this tab's lower state.
      const existing=decode(this.storage.getItem(this.key));
      this.merge(existing);
      this.storage.setItem(this.key,JSON.stringify({version:1,completed:this.done}));
      this.needsSave=false;this.readFailed=false;return true;
    } catch {this.needsSave=true;return false;}
  }
  mergeCompleted(completed:number[]){this.merge(decode(JSON.stringify({version:1,completed})));this.needsSave=true;this.save();}
}
