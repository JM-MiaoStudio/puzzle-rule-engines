export const LEGACY_LINK_RULES_VERSION='link.2026-11-04.v1';
export const TOOL_LINK_RULES_VERSION='link.2026-11-04.v2';
export const IP_LINK_RULES_VERSION='link.2026-11-04.v3';
export const LINK_RULES_VERSION='link.2026-11-04.v4';
export const LINK_INITIAL_LEVEL_COUNT=100;
export const MAX_LINK_LEVEL_ID=1_000_000;
export const isValidLinkLevelId=(id:number)=>Number.isInteger(id)&&id>=1&&id<=MAX_LINK_LEVEL_ID;
export interface LinkLevel{id:number;name:string;cols:number;rows:number;seed:number;holes?:{x:number;y:number}[];lesson:string;toolIds:number[];generation?:{chapter:number;phase:number}}
const BASE_LEVELS:Omit<LinkLevel,'toolIds'>[]=[
 {id:1,name:'Link level 1',cols:4,rows:4,seed:1101,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:2,name:'Link level 2',cols:4,rows:6,seed:2202,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:3,name:'Link level 3',cols:6,rows:4,seed:3303,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:4,name:'Link level 4',cols:6,rows:6,seed:4404,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:5,name:'Link level 5',cols:6,rows:6,seed:5505,holes:[{x:2,y:2},{x:3,y:2},{x:2,y:3},{x:3,y:3}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:6,name:'Link level 6',cols:6,rows:8,seed:6606,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:7,name:'Link level 7',cols:6,rows:8,seed:7707,holes:[{x:2,y:3},{x:3,y:3},{x:2,y:4},{x:3,y:4}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:8,name:'Link level 8',cols:6,rows:8,seed:8808,holes:[{x:0,y:1},{x:1,y:1},{x:4,y:3},{x:5,y:3},{x:0,y:5},{x:1,y:5}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:9,name:'Link level 9',cols:8,rows:8,seed:9909,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:10,name:'Link level 10',cols:8,rows:10,seed:101010,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:11,name:'Link level 11',cols:8,rows:8,seed:111111,holes:[{x:3,y:3},{x:4,y:3},{x:3,y:4},{x:4,y:4}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:12,name:'Link level 12',cols:8,rows:8,seed:121212,holes:[{x:0,y:0},{x:1,y:0},{x:6,y:7},{x:7,y:7}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:13,name:'Link level 13',cols:8,rows:10,seed:131313,holes:[{x:0,y:0},{x:1,y:0},{x:6,y:9},{x:7,y:9}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:14,name:'Link level 14',cols:8,rows:10,seed:141414,holes:[{x:3,y:3},{x:4,y:3},{x:3,y:4},{x:4,y:4},{x:3,y:5},{x:4,y:5},{x:3,y:6},{x:4,y:6}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:15,name:'Link level 15',cols:8,rows:10,seed:151515,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:16,name:'Link level 16',cols:8,rows:10,seed:161616,holes:[{x:3,y:2},{x:4,y:2},{x:3,y:3},{x:4,y:3},{x:3,y:6},{x:4,y:6},{x:3,y:7},{x:4,y:7}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:17,name:'Link level 17',cols:8,rows:10,seed:171717,holes:[{x:0,y:3},{x:1,y:3},{x:0,y:6},{x:1,y:6},{x:6,y:1},{x:7,y:1},{x:6,y:8},{x:7,y:8}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:18,name:'Link level 18',cols:8,rows:10,seed:181818,holes:[{x:3,y:1},{x:4,y:1},{x:3,y:2},{x:4,y:2},{x:3,y:3},{x:4,y:3},{x:3,y:6},{x:4,y:6},{x:3,y:7},{x:4,y:7},{x:3,y:8},{x:4,y:8}],lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:19,name:'Link level 19',cols:8,rows:10,seed:191919,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
 {id:20,name:'Link level 20',cols:8,rows:10,seed:202020,lesson:'Connect identical tiles with at most two turns; the outer border is allowed.'},
];
const TOOL_COUNTS=[4,4,6,8,8,8,10,10,12,12,14,14,16,16,18,18,18,18,18,18];
const COUNTS=[4,4,5,5,5,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7];
export const LINK_LEVELS:LinkLevel[]=BASE_LEVELS.map((level,i)=>({...level,toolIds:Array.from({length:COUNTS[i]},(_,i)=>i+1)}));
export function linkLevel(id:number,version=LINK_RULES_VERSION):LinkLevel{
 if(![LINK_RULES_VERSION,IP_LINK_RULES_VERSION,TOOL_LINK_RULES_VERSION,LEGACY_LINK_RULES_VERSION].includes(version))throw Error('规则版本不正确');
 if(!isValidLinkLevelId(id)||(version===LEGACY_LINK_RULES_VERSION&&id>10)||(version!==LINK_RULES_VERSION&&id>20))throw Error('关卡不存在');
 if(id<=20){const level=LINK_LEVELS[id-1];return version===LEGACY_LINK_RULES_VERSION?{...level,toolIds:[1,2,3,4]}:version===TOOL_LINK_RULES_VERSION?{...level,toolIds:Array.from({length:TOOL_COUNTS[id-1]},(_,i)=>i+1)}:level;}
 const chapter=Math.floor((id-21)/20),phase=Math.min(chapter,3),holes:{x:number;y:number}[]=[];
 // Paired gaps preserve an even population. All chapters fit the original phone board.
 for(let y=0;y<10;y++)for(const x of[2,3,4,5]){
  if((phase===0&&(x<4||y%2===1))||(phase===1&&x<4)||(phase===2&&x<4&&[2,3,6,7].includes(y)))holes.push({x,y});
 }
 const names=['Open layout','Corridors','Dense layout','Advanced layout'];
 return{id,name:names[phase]+' '+String((id-21)%20+1),cols:8,rows:10,seed:(Math.imul(id,2654435761)^0x4c494e4b)>>>0,holes,lesson:'Use empty cells and the outside border; hints and shuffles are available.',toolIds:[1,2,3,4,5,6,7],generation:{chapter,phase}};
}
