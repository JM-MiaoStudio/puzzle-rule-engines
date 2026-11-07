import type { LevelDefinition } from './Levels';
/** IDs101..1000 introduce every certified seed; later balanced cycles permute the same900. */
export function match3QualityTemplateIndex(id:number):number {
  if(!Number.isInteger(id)||id<101||id>1000000)throw Error('Unknown quality level');
  if(id<=1000)return id-101;
  const offset=id-1001,cycle=Math.floor(offset/900),position=offset%900;
  //421 is coprime with900. The137 rotation also avoids repetition across cycle boundaries.
  return (position*421+cycle*137)%900;
}
/** ID, display name and version do not affect Match3/LevelSession execution. */
export function match3ConfigSignature(level:Pick<LevelDefinition,'seed'|'types'|'moves'|'goals'>):string {
  return JSON.stringify([level.seed,level.types,level.moves,level.goals.map(goal=>[goal.kind,goal.target])]);
}
