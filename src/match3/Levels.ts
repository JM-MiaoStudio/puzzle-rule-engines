import { MATCH3_SEED_OVERRIDES, MATCH3_CHAPTER_TARGETS } from './Match3Catalog';
import { MATCH3_QUALITY_SEEDS } from './Match3QualityCatalog';
import { match3QualityTemplateIndex } from './Match3Quality';
export interface Goal { kind:number|null; target:number }
export interface LevelDefinition { id:number; name:string; types:number; moves:number; seed:number; tip:string; goals:Goal[]; rulesVersion?:string }
export const LEGACY_LEVEL_RULES_VERSION='2026-11-04.v2';
export const PREVIOUS_LEVEL_RULES_VERSION='2026-11-04.v3';
export const LEVEL_RULES_VERSION='2026-11-05.v4';
export const INITIAL_LEVEL_COUNT=100;
export const CERTIFIED_LEVEL_COUNT=1000;
export const MAX_LEVEL_ID=1000000;
export const LEVELS:readonly LevelDefinition[]=[
  {id:1,name:'Match-3 level 1',types:4,moves:14,seed:1200,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:null,target:100}]},
  {id:2,name:'Match-3 level 2',types:4,moves:16,seed:1297,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:1,target:30},{kind:null,target:100}]},
  {id:3,name:'Match-3 level 3',types:5,moves:18,seed:1394,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:2,target:24},{kind:3,target:24}]},
  {id:4,name:'Match-3 level 4',types:5,moves:18,seed:1491,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:null,target:140}]},
  {id:5,name:'Match-3 level 5',types:5,moves:20,seed:1588,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:5,target:30},{kind:null,target:140}]},
  {id:6,name:'Match-3 level 6',types:6,moves:22,seed:1685,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:null,target:170}]},
  {id:7,name:'Match-3 level 7',types:6,moves:26,seed:1782,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:6,target:28},{kind:1,target:24}]},
  {id:8,name:'Match-3 level 8',types:7,moves:28,seed:1879,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:7,target:28},{kind:null,target:140}]},
  {id:9,name:'Match-3 level 9',types:7,moves:30,seed:1976,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:4,target:24},{kind:2,target:24}]},
  {id:10,name:'Match-3 level 10',types:7,moves:34,seed:2073,tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:null,target:200},{kind:7,target:24},{kind:3,target:24}]}
];
// Legacy tutorials are immutable source definitions; callers always receive fresh copies.
for(const level of LEVELS){for(const goal of level.goals)Object.freeze(goal);Object.freeze(level.goals);Object.freeze(level);}
Object.freeze(LEVELS);
export function getLevel(id:number,version=LEVEL_RULES_VERSION):LevelDefinition {
  if(!Number.isInteger(id)||id<1||id>MAX_LEVEL_ID)throw new Error('Unknown level');
  if(version!==LEVEL_RULES_VERSION&&version!==PREVIOUS_LEVEL_RULES_VERSION&&version!==LEGACY_LEVEL_RULES_VERSION)throw new Error('Unknown level rules version');
  if(version===LEGACY_LEVEL_RULES_VERSION&&id>LEVELS.length)throw new Error('Unknown legacy level');
  const chapter=Math.min(8,Math.floor((id-11)/10));
  const seed=version===LEVEL_RULES_VERSION&&id>100?MATCH3_QUALITY_SEEDS[match3QualityTemplateIndex(id)]:(MATCH3_SEED_OVERRIDES[id]??(((Math.imul(id,2654435761)^0x4b1d5a77)>>>0)||1));
  if(id>100&&version===LEVEL_RULES_VERSION&&!seed)throw Error('Missing certified quality seed');
  const level=id<=LEVELS.length?LEVELS[id-1]:{
    id,name:`Match-3 level ${id}`,types:6,moves:30,
    seed,
    tip:'Swap adjacent tiles and complete every goal within the move budget.',goals:[{kind:null,target:MATCH3_CHAPTER_TARGETS[chapter]}]
  };
  return {...level,rulesVersion:version,goals:level.goals.map(g=>({...g}))};
}
