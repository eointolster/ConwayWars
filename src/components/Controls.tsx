import { TEAMS } from '../simulation/teams';
import type { MatchConfig, VictoryRule } from '../simulation/match';
import type { Boundary, ViewOptions, ColourMode, SimulationMode, Faction } from '../types';
import { patterns } from '../simulation/patterns';
import { arenas } from '../simulation/arenas';
interface Props {
  teamCount: number; onTeamCount: (count: number) => void; victory: MatchConfig; onVictory: (config: MatchConfig) => void; matchLocked: boolean;
  mode: SimulationMode; paint: Faction | 0; onMode: (mode: SimulationMode) => void; onPaint: (faction: Faction | 0) => void;
  size: number; boundary: Boundary; limit: number; density: number; seed: number; speed: number;
  options: ViewOptions; initial: boolean; pattern: string;
  onSize: (n: number) => void; onBoundary: (b: Boundary) => void; onLimit: (n: number) => void;
  onDensity: (n: number) => void; onSeed: (n: number) => void; onSpeed: (n: number) => void;
  onOptions: (options: ViewOptions) => void; onPattern: (name: string) => void;
  onClear: () => void; onRandom: () => void; onInvert: () => void;
}
export function Controls(p: Props) {
  const toggle = (key: 'smooth' | 'plane' | 'grid' | 'axes' | 'guides', label: string) => <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={p.options[key]} onChange={e=>p.onOptions({...p.options,[key]:e.target.checked})}/></label>;
  return <aside className="controls">
    <section><div className="section-title"><span>01 / INITIAL CONDITIONS</span><span className="tiny-badge">2D</span></div>
      <div className="mode-picker" aria-label="Simulation mode"><button aria-pressed={p.mode==='classic'} onClick={()=>p.onMode('classic')}>Classic</button><button data-mode="factions" aria-pressed={p.mode==='factions'} onClick={()=>p.onMode('factions')}>Teams</button></div>
      {p.mode==='factions' && <label className="field inline-field">Teams<select aria-label="Team count" value={p.teamCount} onChange={e=>p.onTeamCount(+e.target.value)}>{[2,3,4,5].map(n=><option key={n} value={n}>{n} teams</option>)}</select></label>}
      <label className="field">Starting pattern<select value={p.pattern} onChange={e=>p.onPattern(e.target.value)}><option value="Custom" disabled>Custom / random</option><optgroup label="Team arenas">{arenas.map(name=><option key={name}>{name}</option>)}</optgroup><optgroup label="Classic patterns">{Object.keys(patterns).map(name=><option key={name}>{name}</option>)}</optgroup></select></label>
      <div className="two-cols"><label className="field">Grid<select aria-label="Grid size" value={p.size} onChange={e=>p.onSize(+e.target.value)}>{[32,48,64,96,128].map(n=><option key={n} value={n}>{n} × {n}</option>)}</select></label><label className="field">Boundary<select value={p.boundary} onChange={e=>p.onBoundary(e.target.value as Boundary)}><option value="finite">Finite</option><option value="wrap">Toroidal</option></select></label></div>
      <p className="field-note">Pattern, team count, grid, boundary, and mode changes start a new history.</p>
      {p.mode==='factions' && <div className="paint-controls"><span>PAINT FACTION</span><div className="button-row">{TEAMS.slice(0,p.teamCount).map(t=><button key={t.id} aria-pressed={p.paint===t.id} style={{color:t.colour}} onClick={()=>p.onPaint(t.id)}>{t.name}</button>)}<button aria-pressed={p.paint===0} onClick={()=>p.onPaint(0)}>Erase</button></div><p className="field-note">Same colour toggles off; another colour repaints. Randomise divides the grid into team bands.</p></div>}
      <label className="range-label">Random density <b>{Math.round(p.density*100)}%</b><input aria-label="Random density" type="range" min="5" max="80" value={Math.round(p.density*100)} onChange={e=>p.onDensity(+e.target.value/100)}/></label>
      <label className="seed-field"><span>SEED</span><input aria-label="Random seed" type="number" min="0" max="4294967295" value={p.seed} onChange={e=>p.onSeed(Math.max(0,Math.min(4294967295,Math.floor(+e.target.value))))}/></label>
      <div className="button-row"><button onClick={p.onClear}>Clear</button><button onClick={p.onRandom}>Randomise</button><button onClick={p.onInvert}>Invert</button></div>
      <p className="field-note">{p.initial ? 'Click the top grid to edit generation 0. Top view helps.' : 'Reset to edit the initial grid. Clear, randomise, or invert starts a new history.'}</p>
    </section>
    {p.mode==='factions' && <section><div className="section-title">MATCH RULES</div>
      <label className="field">Victory condition<select aria-label="Victory condition" disabled={p.matchLocked} value={p.victory.rule} onChange={e=>p.onVictory({...p.victory,rule:e.target.value as VictoryRule})}><option value="sandbox">Sandbox — no ending</option><option value="last">Last team alive</option><option value="population">Most cells at deadline</option><option value="births">Most births by deadline</option></select></label>
      {['population','births'].includes(p.victory.rule) && <label className="field">Generation limit<input className="number-input" aria-label="Generation limit" type="number" min="1" max="10000" disabled={p.matchLocked} value={p.victory.limit} onChange={e=>p.onVictory({...p.victory,limit:Math.max(1,Math.min(10000,Math.floor(+e.target.value)||1))})}/></label>}
      <p className="field-note">{p.matchLocked?'Reset to change match rules.':'Uses generations, not wall-clock seconds. Tied scores share a draw; total extinction is a draw.'}</p>
    </section>}
    <section><div className="section-title">02 / TIME & HISTORY</div>
      <label className="range-label">Simulation speed <b>{p.speed} ticks/s</b><input aria-label="Simulation speed" type="range" min="1" max="60" value={p.speed} onChange={e=>p.onSpeed(+e.target.value)}/></label>
      <div className="speed-presets">{[1,2,5,10,20,30,60].map(n=><button className={n===p.speed?'active':''} key={n} onClick={()=>p.onSpeed(n)}>{n}</button>)}</div>
      <label className="field inline-field">Retain history<select aria-label="History depth" value={p.limit} onChange={e=>p.onLimit(+e.target.value)}>{[25,50,100,200,500].map(n=><option key={n} value={n}>{n} layers</option>)}</select></label>
      {toggle('smooth','Smooth history movement')}
      <label className="range-label small">Transition <b>{p.options.duration} ms</b><input aria-label="Animation duration" disabled={!p.options.smooth} type="range" min="50" max="300" step="10" value={p.options.duration} onChange={e=>p.onOptions({...p.options,duration:+e.target.value})}/></label>
    </section>
    <section><div className="section-title">03 / APPEARANCE</div>
      <label className="field inline-field">Colour by<select value={p.options.colour} onChange={e=>p.onOptions({...p.options,colour:e.target.value as ColourMode})}><option value="faction">Faction + age</option><option value="age">Age</option><option value="solid">Solid</option><option value="generation">Generation</option><option value="neighbours">Neighbours</option><option value="birth">Birth / survival</option></select></label>
      <div className="toggle-grid">{toggle('plane','Current plane')}{toggle('grid','Grid lines')}{toggle('axes','Axes')}{toggle('guides','Layer guides')}</div>
    </section>
    <div className="rule-card"><span className="rule-symbol">B3 / S23</span><p>Two dimensions of life.<br/>One dimension of time.</p><small>Born with 3 neighbours.<br/>Survive with 2 or 3.{p.mode==='factions' && <><br/>Survivors keep their faction.<br/>Majority inherits births.<br/>Three-way ties use a deterministic choice.</>}</small></div>
  </aside>;
}
