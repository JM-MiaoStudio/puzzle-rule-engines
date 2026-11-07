/** Engine-independent migration of the original match / gravity / special-piece model. */
export type Special = 'none' | 'row' | 'column' | 'area' | 'wild';
export interface Cell { id: number; kind: number; special: Special }
export interface Position { x: number; y: number }
export type Board = Cell[][];
export interface Move { a: Position; b: Position }
export interface Spawn { position: Position; cell: Cell }
export interface TriggeredEffect { position:Position; special:Exclude<Special,'none'>; radius?:number }
export interface Cascade { before: Board; cleared: Position[]; spawned: Spawn[]; after: Board; effects?:TriggeredEffect[] }
export interface MoveResult {
  valid: boolean; before: Board; swapped: Board; cascades: Cascade[];
  after: Board; cleared: number; shuffled: boolean;
}
export interface Options { width?: number; height?: number; types?: number; seed?: number; board?: Board }
export interface Replay extends Options { version: 1; seed: number; moves: Move[] }
interface Run { positions: Position[]; direction: 'row' | 'column' }
const key = (p: Position) => `${p.x},${p.y}`;
const same = (a: Position,b: Position) => a.x===b.x && a.y===b.y;
const ordered = (positions: Position[]) => positions.sort((a,b)=>a.y-b.y || a.x-b.x);

export class Match3 {
  readonly width: number;
  readonly height: number;
  readonly types: number;
  readonly seed: number;
  private board: Board;
  private state: number;
  private nextId = 1;
  private history:Move[]=[];
  private initialBoard:Board|undefined;

  constructor(options: Options = {}) {
    this.width = options.board?.[0]?.length ?? options.width ?? 9;
    this.height = options.board?.length ?? options.height ?? 9;
    this.types = options.types ?? 7;
    if (!Number.isInteger(this.width) || !Number.isInteger(this.height) || this.width<3 || this.height<3 || this.width>12 || this.height>12)
      throw new Error('Board dimensions must be integers from 3 to 12');
    if (!Number.isInteger(this.types) || this.types<3 || this.types>7) throw new Error('Use 3 to 7 tile types');
    this.seed = (options.seed ?? Date.now()) >>> 0 || 0x6d2b79f5;
    this.state = this.seed;
    if (options.board) {
      if (options.board.some(row=>row.length!==this.width || row.some(c=>!c || !Number.isInteger(c.kind) || c.kind<1 || c.kind>this.types || !['none','row','column','area','wild'].includes(c.special))))
        throw new Error('Invalid board data');
      // IDs are identities inside this game, never trusted from an external fixture.
      this.board = options.board.map(row=>row.map(c=>this.cell(c.kind,c.special)));
      this.initialBoard=this.snapshot();
    } else {
      this.board = this.generate();
      this.ensurePlayable();
    }
  }

  private random(): number {
    let x=this.state; x^=x<<13; x^=x>>>17; x^=x<<5;
    this.state=x>>>0; return this.state/4294967296;
  }
  private pickKind() { return 1+Math.floor(this.random()*this.types); }
  private cell(kind=this.pickKind(), special: Special='none'): Cell { return {kind,special,id:this.nextId++}; }
  snapshot(): Board { return this.board.map(row=>row.map(c=>({...c}))); }
  getReplay():Replay {
    return {version:1,width:this.width,height:this.height,types:this.types,seed:this.seed,
      ...(this.initialBoard?{board:this.initialBoard.map(r=>r.map(c=>({...c})))}:{}),
      moves:this.history.map(m=>({a:{...m.a},b:{...m.b}}))};
  }
  private inside(p: Position) { return !!p && Number.isInteger(p.x) && Number.isInteger(p.y) && p.x>=0 && p.x<this.width && p.y>=0 && p.y<this.height; }
  private exchange(a: Position,b: Position) { [this.board[a.y][a.x],this.board[b.y][b.x]]=[this.board[b.y][b.x],this.board[a.y][a.x]]; }

  private generate(): Board {
    const b: Board=[];
    for(let y=0;y<this.height;y++) {
      b[y]=[];
      for(let x=0;x<this.width;x++) {
        const allowed:number[]=[];
        for(let kind=1;kind<=this.types;kind++) {
          if(x>=2 && b[y][x-1].kind===kind && b[y][x-2].kind===kind) continue;
          if(y>=2 && b[y-1][x].kind===kind && b[y-2][x].kind===kind) continue;
          allowed.push(kind);
        }
        b[y][x]=this.cell(allowed[Math.floor(this.random()*allowed.length)]);
      }
    }
    return b;
  }

  private runs(): Run[] {
    const runs: Run[]=[];
    for(const direction of ['row','column'] as const) {
      const outer=direction==='row'?this.height:this.width, inner=direction==='row'?this.width:this.height;
      const at=(line:number,i:number):Position=>direction==='row'?{x:i,y:line}:{x:line,y:i};
      for(let line=0;line<outer;line++) {
        let start=0;
        while(start<inner) {
          const p=at(line,start), cell=this.board[p.y][p.x]; let end=start+1;
          if(cell.special==='wild') { start=end; continue; }
          while(end<inner) { const q=at(line,end), next=this.board[q.y][q.x]; if(next.special==='wild'||next.kind!==cell.kind)break;end++; }
          if(end-start>=3)runs.push({direction,positions:Array.from({length:end-start},(_,i)=>at(line,start+i))});
          start=end;
        }
      }
    }
    return runs;
  }

  private groups(): { positions: Position[]; runs: Run[] }[] {
    const groups: {positions:Position[];runs:Run[]}[]=[];
    for(const run of this.runs()) {
      const overlapping=groups.filter(g=>g.positions.some(p=>run.positions.some(q=>same(p,q))));
      const points=new Map<string,Position>();
      for(const p of run.positions)points.set(key(p),p);
      const joined=[run];
      for(const g of overlapping) { g.positions.forEach(p=>points.set(key(p),p));joined.push(...g.runs);groups.splice(groups.indexOf(g),1); }
      // Cocos 3.8.3's loose spread transform assumes arrays; Array.from keeps Map iterables correct.
      groups.push({positions:ordered(Array.from(points.values())),runs:joined});
    }
    return groups;
  }
  matches(): Position[][] { return this.groups().map(g=>g.positions); }

  private isCombo(a:Cell,b:Cell) { return a.special==='wild'||b.special==='wild'||(a.special!=='none'&&b.special!=='none'); }
  findMoves(): Move[] {
    const moves: Move[]=[];
    for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++) {
      const a={x,y};
      for(const b of [{x:x+1,y},{x,y:y+1}]) {
        if(!this.inside(b))continue;
        if(this.isCombo(this.board[y][x],this.board[b.y][b.x])) {moves.push({a,b});continue;}
        this.exchange(a,b);
        const valid=this.groups().some(g=>g.positions.some(p=>same(p,a)||same(p,b)));
        this.exchange(a,b);
        if(valid)moves.push({a,b});
      }
    }
    return moves;
  }

  /** Preserve pieces where possible; regenerate only when a dead layout cannot be permuted. */
  ensurePlayable(): boolean {
    if(this.findMoves().length)return false;
    const pieces=this.board.flat();
    for(let attempt=0;attempt<160;attempt++) {
      for(let i=pieces.length-1;i>0;i--) { const j=Math.floor(this.random()*(i+1));[pieces[i],pieces[j]]=[pieces[j],pieces[i]]; }
      this.board=Array.from({length:this.height},(_,y)=>pieces.slice(y*this.width,(y+1)*this.width));
      if(!this.matches().length&&this.findMoves().length)return true;
    }
    for(let attempt=0;attempt<160;attempt++) { this.board=this.generate();if(this.findMoves().length)return true; }
    throw new Error('Could not construct a playable board');
  }

  swap(a:Position,b:Position): MoveResult {
    const before=this.snapshot();
    const rejected=():MoveResult=>({valid:false,before,swapped:before,cascades:[],after:before,cleared:0,shuffled:false});
    if(!this.inside(a)||!this.inside(b)||Math.abs(a.x-b.x)+Math.abs(a.y-b.y)!==1)return rejected();
    this.exchange(a,b);
    const swapped=this.snapshot(), combo=this.isCombo(this.board[a.y][a.x],this.board[b.y][b.x]);
    if(!combo&&!this.groups().some(g=>g.positions.some(p=>same(p,a)||same(p,b)))) {this.exchange(a,b);return {...rejected(),swapped};}
    const cascades:Cascade[]=[];
    let first=true;
    while((first&&combo)||this.matches().length) {
      if(cascades.length>=128) { this.board=before;throw new Error('Cascade limit exceeded'); }
      cascades.push(this.resolve(first&&combo?{a,b}:undefined,first?[b,a]:[]));
      first=false;
    }
    const shuffled=this.ensurePlayable();
    this.history.push({a:{...a},b:{...b}});
    return {valid:true,before,swapped,cascades,after:this.snapshot(),cleared:cascades.reduce((n,c)=>n+c.cleared.length,0),shuffled};
  }

  private resolve(combo: Move|undefined, preferred:Position[]):Cascade {
    const before=this.snapshot(), clear=new Map<string,Position>(), consumed=new Set<number>();
    const effects:TriggeredEffect[]=[];
    const effect=(position:Position,special:TriggeredEffect['special'],radius?:number)=>{if(this.inside(position))effects.push({position:{...position},special,...(radius===undefined?{}:{radius})});};
    const add=(p:Position)=>{if(this.inside(p))clear.set(key(p),p);};
    const row=(y:number)=>{for(let x=0;x<this.width;x++)add({x,y});};
    const column=(x:number)=>{for(let y=0;y<this.height;y++)add({x,y});};
    const area=(p:Position,radius:number)=>{for(let y=p.y-radius;y<=p.y+radius;y++)for(let x=p.x-radius;x<=p.x+radius;x++)add({x,y});};
    const all=()=>{for(let y=0;y<this.height;y++)row(y);};
    const spawned:Spawn[]=[];
    if(combo) {
      const ca=this.board[combo.a.y][combo.a.x], cb=this.board[combo.b.y][combo.b.x];
      consumed.add(ca.id);consumed.add(cb.id);add(combo.a);add(combo.b);
      if(ca.special==='wild'&&cb.special==='wild'){all();effect(combo.b,'wild',4.5);}
      else if(ca.special==='wild'||cb.special==='wild') {
        effect(ca.special==='wild'?combo.a:combo.b,'wild',1.5);
        const other=ca.special==='wild'?cb:ca;
        for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++)if(this.board[y][x].kind===other.kind) {
          add({x,y});
          if(other.special!=='none')this.board[y][x].special=other.special;
        }
        // The exchanged special is consumed too, but its own effect must still fire.
        if(other.special!=='none')consumed.delete(other.id);
      } else if(ca.special==='area'&&cb.special==='area'){area(combo.b,2);effect(combo.b,'area',2);}
      else if(ca.special==='area'||cb.special==='area') {
        for(let d=-1;d<=1;d++){row(combo.b.y+d);column(combo.b.x+d);effect({x:combo.b.x,y:combo.b.y+d},'row');effect({x:combo.b.x+d,y:combo.b.y},'column');}
      } else {row(combo.b.y);column(combo.b.x);effect(combo.b,'row');effect(combo.b,'column');}
    }
    for(const group of this.groups()) {
      group.positions.forEach(add);
      // A combo consumes its effects; it does not also create free match specials.
      if(combo)continue;
      let special:Special='none';
      const longest=group.runs.reduce((best,r)=>r.positions.length>best.positions.length?r:best,group.runs[0]);
      if(longest.positions.length>=5)special='wild';
      else if(group.runs.some(r=>r.direction==='row')&&group.runs.some(r=>r.direction==='column'))special='area';
      else if(longest.positions.length===4)special=longest.direction;
      if(special!=='none') {
        const candidates=[...preferred,...group.positions];
        const anchor=candidates.find(p=>group.positions.some(q=>same(p,q))&&this.board[p.y][p.x].special==='none');
        if(anchor)spawned.push({position:{...anchor},cell:this.cell(this.board[anchor.y][anchor.x].kind,special)});
      }
    }
    // Expanding the queue lets chained effects hit each cell once, even at intersections.
    const queue=Array.from(clear.values());
    for(let i=0;i<queue.length;i++) {
      const p=queue[i],c=this.board[p.y][p.x];
      if(c.special==='none'||consumed.has(c.id))continue;
      consumed.add(c.id);const oldSize=clear.size;
      effect(p,c.special,c.special==='area'?1:undefined);
      if(c.special==='row')row(p.y);
      if(c.special==='column')column(p.x);
      if(c.special==='area')area(p,1);
      if(c.special==='wild') {const kind=this.pickKind();for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++)if(this.board[y][x].kind===kind)add({x,y});}
      if(clear.size>oldSize)for(const q of clear.values())if(!queue.some(v=>same(v,q)))queue.push(q);
    }
    const cleared=ordered(Array.from(clear.values()));
    const created=new Map(spawned.map(s=>[key(s.position),s.cell]));
    for(let x=0;x<this.width;x++) {
      const survivors:Cell[]=[];
      for(let y=this.height-1;y>=0;y--) {
        const replacement=created.get(key({x,y}));
        if(replacement)survivors.push(replacement);
        else if(!clear.has(key({x,y})))survivors.push(this.board[y][x]);
      }
      for(let y=this.height-1;y>=0;y--)this.board[y][x]=survivors[this.height-1-y]??this.cell();
    }
    return {before,cleared,spawned:spawned.map(s=>({position:{...s.position},cell:{...s.cell}})),after:this.snapshot(),effects};
  }
}
