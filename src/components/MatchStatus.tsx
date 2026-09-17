import type { Match } from '../simulation/match';
import { teamInfo } from '../simulation/teams';
export function MatchStatus({match,generation,valid,inspected,onReset}:{match:Match;generation:number;valid:boolean;inspected:number;onReset:()=>void}) {
  if(match.config.rule==='sandbox') return null;
  const result=match.result;
  const label=match.config.rule==='last'?'Last team alive':match.config.rule==='population'?'Most cells at deadline':'Most births by deadline';
  return <div className={`match-status ${result?'finished':''}`} role="status">
    <span>{result?'MATCH COMPLETE':label.toUpperCase()}</span>
    {result ? <><strong>{result.winners.length===1 ? `${teamInfo(result.winners[0]).name} wins` : result.winners.length ? `Draw: ${result.winners.map(t=>teamInfo(t).name).join(' & ')}` : 'Draw — all teams extinct'}</strong><p>{label}</p><p>Final generation {result.generation}{inspected!==result.generation?` · inspecting ${inspected}`:''}</p><p>{result.scores.map((score,i)=><span key={i} style={{color:teamInfo(i+1).colour}}>{teamInfo(i+1).name} {score} </span>)}</p><button onClick={onReset}>Replay from seed</button></> : <><strong>{match.config.rule==='last'?`Generation ${generation}`:`${generation} / ${match.config.limit} generations`}</strong><p>{valid?'The simulation pauses when the match ends.':'Paint or seed at least two teams to start.'}</p>{match.config.rule==='births'&&<p>{match.births.map((score,i)=><span key={i} style={{color:teamInfo(i+1).colour}}>{teamInfo(i+1).name} {score} </span>)}</p>}</>}
  </div>;
}
