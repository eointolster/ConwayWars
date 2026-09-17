import type { Generation } from '../types';
import { TEAMS } from '../simulation/teams';
interface Props { current: Generation; history: Generation[]; peak: number; cubes: number; speed: number; factions: boolean; teamCount: number; }
export function Statistics({current,history,peak,cubes,speed,factions,teamCount}: Props) {
  const teams=TEAMS.slice(0,teamCount);
  const max = Math.max(1,...history.map(g=>g.living.length));
  const pointsFor = (population: (g:Generation)=>number) => history.map((g,i)=>`${history.length === 1 ? 0 : i/(history.length-1)*240},${44-population(g)/max*40}`).join(' ');
  const share=(i:number)=>current.living.length?(current.factionStats[i]?.population??0)/current.living.length*100:0;
  return <div className={`statistics ${factions?'with-factions':''}`}>
    <div className="section-title">POPULATION / RETAINED HISTORY</div>
    <div className="population-number">{current.living.length.toLocaleString()}<span>living cells</span></div>
    <svg viewBox="0 0 240 48" role="img" aria-label={`${factions?'Team population':'Population'} over ${history.length} stored generations`}>
      {factions ? teams.map((team,i)=><polyline key={team.id} points={pointsFor(g=>g.factionStats[i]?.population??0)} fill="none" stroke={team.colour} strokeWidth="1.7" strokeDasharray={i?`${6-i} ${i+1}`:undefined}/>) : <polyline points={pointsFor(g=>g.living.length)} fill="none" stroke="#79edc5" strokeWidth="1.5"/>}
    </svg>
    {factions && <div className="faction-statistics">
      <table aria-label="Faction statistics"><thead><tr><th>Team</th><th>Cells</th><th>{current.id===0?'Seed':'+Born'}</th><th>−Died</th></tr></thead><tbody>
        {teams.map((t,i)=>{const s=current.factionStats[i]??{population:0,births:0,deaths:0};return <tr key={t.id}><th style={{color:t.colour}}>{t.name}</th><td>{s.population}</td><td>{s.births}</td><td>{s.deaths}</td></tr>;})}
      </tbody></table>
      <div className="contested-stat"><span>Contested births</span><b>{current.contestedBirths}</b></div>
      <div className="share-bar" aria-label={teams.map((t,i)=>`${t.name} ${share(i).toFixed(1)} percent`).join(', ')}>{teams.map((t,i)=><i key={t.id} style={{width:`${share(i)}%`,background:t.colour}}/>)}</div>
      <div className="share-label"><span>Share of living population</span></div>
    </div>}
    <div className="stat-grid"><div><span>Births</span><b className="mint">+{current.births}</b></div><div><span>Deaths</span><b>−{current.deaths}</b></div><div><span>Peak</span><b>{peak.toLocaleString()}</b></div><div><span>Stored layers</span><b>{history.length}</b></div><div><span>Stored cubes</span><b>{cubes.toLocaleString()}</b></div><div><span>Target rate</span><b>{speed}/s</b></div></div>
  </div>;
}
