import type { ConwayGrid } from './ConwayGrid';
export type VictoryRule = 'sandbox' | 'last' | 'population' | 'births';
export interface MatchConfig { rule: VictoryRule; limit: number; }
export interface MatchResult { generation: number; winners: number[]; reason: 'elimination' | 'deadline' | 'extinction'; scores: number[]; }

/** Score is independent of retained history and simulation playback speed. */
export class Match {
  result: MatchResult | null = null;
  births: number[] = [];
  private participants: number[] = [];
  constructor(public config: MatchConfig) {}
  reset() { this.result=null; this.births=[]; this.participants=[]; }
  canStart(engine: ConwayGrid): boolean {
    return this.config.rule==='sandbox' || engine.current.id>0 || engine.current.factionStats.filter(s=>s.population>0).length>=2;
  }
  step(engine: ConwayGrid): boolean {
    if(this.result || !this.canStart(engine)) return false;
    if(!this.participants.length) this.participants=[...new Set(engine.initialFactions)].filter(id=>id>0);
    const current=engine.step();
    current.factionStats.forEach((s,i)=>{this.births[i]=(this.births[i]??0)+s.births;});
    if(this.config.rule==='sandbox') return true;
    const alive=current.factionStats.map((s,i)=>s.population?i+1:0).filter(Boolean);
    const scores=this.config.rule==='births' ? [...this.births] : current.factionStats.map(s=>s.population);
    if(!alive.length) this.result={generation:current.id,winners:[],reason:'extinction',scores};
    else if(this.config.rule==='last' && alive.length===1) this.result={generation:current.id,winners:alive,reason:'elimination',scores};
    else if(this.config.rule!=='last' && current.id>=this.config.limit) {
      const best=Math.max(...this.participants.map(id=>scores[id-1]));
      const winners=this.participants.filter(id=>scores[id-1]===best).sort((a,b)=>a-b);
      this.result={generation:current.id,winners,reason:'deadline',scores};
    }
    return true;
  }
}
