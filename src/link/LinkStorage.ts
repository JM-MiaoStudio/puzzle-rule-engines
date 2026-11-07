import {LinkSession,type LinkReplay} from './LinkSession';import {isValidLinkLevelId} from './LinkLevels';
export const ROUND_KEY='puzzle-engine.link.round.v1.guest',COMPLETED_KEY='puzzle-engine.link.completed.v1.guest';
export function readLinkStorage(storage:{getItem:(key:string)=>string|null}){let saved:LinkReplay|undefined,completed:number[]=[];
  try{const raw=storage.getItem(ROUND_KEY);if(raw){const replay=JSON.parse(raw);LinkSession.restore(replay);saved=replay;}}catch{/* An invalid round does not erase separate completion records. */}
  try{const data=JSON.parse(storage.getItem(COMPLETED_KEY)??'[]');if(Array.isArray(data))completed=Array.from(new Set(data.filter(id=>isValidLinkLevelId(id))));}catch{/* An invalid completion list does not erase a valid round. */}
  return{saved,completed};
}
