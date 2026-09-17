import { Match, type MatchConfig } from './simulation/match';
import { TEAMS } from './simulation/teams';
import { MatchStatus } from './components/MatchStatus';
import { useEffect, useRef, useState } from 'react';
import { ConwayGrid } from './simulation/ConwayGrid';
import { patternGrid } from './simulation/patterns';
import { arenaGrid, isArena } from './simulation/arenas';
import { splitFactions } from './simulation/factions';
import { randomGrid } from './simulation/seededRandom';
import { ConwayScene } from './rendering/ConwayScene';
import { Controls } from './components/Controls';
import { Statistics } from './components/Statistics';
import { Timeline } from './components/Timeline';
import type { Boundary, CameraView, ViewOptions, SimulationMode, Faction } from './types';
const initialPattern = patternGrid('R-pentomino',48);
export default function App() {
  const [engine,setEngine] = useState(()=>new ConwayGrid(48,'finite',initialPattern.state));
  const [mode,setMode] = useState<SimulationMode>('classic');
  const [teamCount,setTeamCount] = useState(2);
  const [victory,setVictory] = useState<MatchConfig>({rule:'sandbox',limit:500});
  const [match,setMatch] = useState(()=>new Match({rule:'sandbox',limit:500}));
  const [paint,setPaint] = useState<Faction | 0>(1);
  const manualClock = useRef(false);
  const manualRemainder = useRef(0);
  const [revision,setRevision] = useState(0);
  const [playing,setPlaying] = useState(false);
  const [speed,setSpeed] = useState(5);
  const [density,setDensity] = useState(0.28);
  const [seed,setSeed] = useState(428719);
  const [pattern,setPattern] = useState('R-pentomino');
  const [selected,setSelected] = useState<number|null>(null);
  const [options,setOptions] = useState<ViewOptions>({colour:'age',smooth:true,duration:180,plane:true,grid:true,axes:false,guides:true});
  const [cameraAction,setCameraAction] = useState<{view:CameraView;serial:number}>({view:'iso',serial:0});
  const [toast,setToast] = useState('');
  const camera = (view: CameraView) => setCameraAction(a=>({view,serial:a.serial+1}));
  const refresh = () => setRevision(v=>v+1);
  const activeGeneration = selected ?? engine.current.id;
  const current = engine.history.layers.find(g=>g.id===activeGeneration) ?? engine.current;
  const present = selected === null || selected === engine.current.id;
  const start = (state: Uint8Array, size=engine.size, boundary:Boundary=engine.boundary, factions?: Uint8Array, limit=engine.history.limit, count=teamCount) => {
    manualClock.current=false; manualRemainder.current=0;
    const owners = factions ?? Uint8Array.from(state,v=>v ? (mode==='factions' && paint>0 ? paint : 1) : 0);
    setPlaying(false); setSelected(null); setEngine(new ConwayGrid(size,boundary,state,limit,owners,count)); setMatch(new Match(victory)); refresh();
  };
  const choosePattern = (name: string, size=engine.size, boundary=engine.boundary, count=teamCount) => {
    if (isArena(name)) {
      const arenaTeams=name==='Colony ring'?count:2;
      const result=arenaGrid(name,size,arenaTeams);
      setTeamCount(arenaTeams); if(paint>arenaTeams)setPaint(1);
      setMode('factions'); setPattern(name); setOptions(o=>({...o,colour:'faction'}));
      const gun = name==='Opposing glider guns';
      start(result.state,result.size,boundary,result.factions,gun?500:engine.history.limit,arenaTeams);
      setToast(gun ? `Opposing guns: ${result.size} × ${result.size}, retaining 500 layers. Streams meet along the diagonal.` : result.size!==size ? `Arena grid increased to ${result.size} × ${result.size}.` : `${arenaTeams} teams obey identical B3/S23 rules.`);
    } else {
      const result = patternGrid(name,size); setPattern(name); start(result.state,result.size,boundary);
      if (result.size!==size) setToast('The glider gun needs more room. Grid increased to 48 × 48.');
    }
    camera('iso');
  };
  const changeMode = (next: SimulationMode) => {
    if(next===mode) return;
    if(next==='factions') choosePattern(teamCount>2?'Colony ring':'Opposing gliders');
    else {
      setMode('classic'); setPattern('R-pentomino'); setOptions(o=>({...o,colour:'age'}));
      const result=patternGrid('R-pentomino',engine.size);
      start(result.state,result.size,engine.boundary,result.state.slice()); camera('iso');
    }
  };
  const randomise = (size=engine.size) => {
    const state=randomGrid(size,density,seed); setPattern('Custom');
    start(state,size,engine.boundary,mode==='factions'?splitFactions(state,size,teamCount):undefined);
  };
  const reset = () => { manualClock.current=false; manualRemainder.current=0; setPlaying(false); setSelected(null); engine.reset(); match.reset(); refresh(); };
  const canAdvance = mode==='classic' || (!match.result && match.canStart(engine));
  const advanceOne = () => {
    const advanced=mode==='classic' ? (engine.step(),true) : match.step(engine);
    if(match.result) setPlaying(false);
    return advanced;
  };
  const changeVictory = (config: MatchConfig) => { setVictory(config); setMatch(new Match(config)); };
  const changeTeamCount = (count: number) => {setPaint(1);choosePattern('Colony ring',engine.size,engine.boundary,count);};
  const step = () => { if (!present || !canAdvance) return; setPlaying(false); advanceOne(); setSelected(null); refresh(); };
  const play = () => { if (present && canAdvance) { manualClock.current=false; setPlaying(p=>!p); } };
  const actions = useRef({play,step,reset}); actions.current={play,step,reset};
  useEffect(()=> {
    if (!playing) return;
    // A fixed timestep, independent of requestAnimationFrame. Cap catch-up to keep input responsive.
    const interval = 1000/speed; let deadline = performance.now()+interval;
    const timer = window.setInterval(()=> {
      if(manualClock.current) return;
      if(document.hidden) { deadline=performance.now()+interval; return; }
      const now=performance.now(); let ticks=0;
      while(now>=deadline && ticks<4) { if(!advanceOne()) break; deadline+=interval; ticks++; if(match.result) break; }
      if(ticks===4 && now>=deadline) deadline=now+interval;
      if(ticks) refresh();
    }, Math.min(interval,16));
    return ()=>clearInterval(timer);
  },[playing,speed,engine,match,mode]);
  useEffect(()=> {
    const handler=(event:KeyboardEvent)=> {
      const tag=(event.target as HTMLElement).tagName;
      if(['INPUT','SELECT','TEXTAREA'].includes(tag)||event.ctrlKey||event.metaKey||event.altKey) return;
      if(event.code==='Space' && tag!=='BUTTON') { event.preventDefault(); actions.current.play(); }
      if(event.key.toLowerCase()==='n') actions.current.step();
      if(event.key.toLowerCase()==='r') actions.current.reset();
    };
    window.addEventListener('keydown',handler); return ()=>window.removeEventListener('keydown',handler);
  },[]);
  useEffect(()=> {
    window.render_game_to_text = () => JSON.stringify({
      mode, pattern, playing, colour:options.colour, grid:engine.size, boundary:engine.boundary,
      coordinates:'Cell (x,z), origin top-left; cubes centred on grid. Y = -(inspected generation - cube generation).',
      generation:engine.current.id, inspectedGeneration:current.id, population:current.living.length,
      teamCount, factions:Object.fromEntries(TEAMS.slice(0,teamCount).map((t,i)=>[t.name.toLowerCase(),current.factionStats[i]])), match:{config:victory,result:match.result,births:match.births}, contestedBirths:current.contestedBirths,
      storedLayers:engine.history.layers.length, storedCubes:engine.history.cubes,
      historyRange:[engine.history.layers[0].id,engine.current.id], paint,
      cells:[...current.living.slice(0,200)].map(i=>({x:i%engine.size,z:Math.floor(i/engine.size),faction:current.factions[i]})),
      cellsOmitted:Math.max(0,current.living.length-200),
    });
    window.advanceTime = async (ms: number) => {
      if(!Number.isFinite(ms) || ms<0 || !present) return;
      manualClock.current=true;
      manualRemainder.current+=Math.min(ms,100000)*speed/1000;
      const ticks=Math.min(500,Math.floor(manualRemainder.current+1e-9));
      manualRemainder.current-=ticks;
      for(let i=0;i<ticks;i++) {if(!advanceOne())break;}
      if(ticks) refresh();
      await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    };
    return ()=> { delete window.render_game_to_text; delete window.advanceTime; };
  },[engine,revision,current,mode,pattern,playing,options.colour,paint,present,speed,teamCount,victory,match]);
  useEffect(()=>{ if(!toast) return; const timer=setTimeout(()=>setToast(''),5000); return ()=>clearTimeout(timer); },[toast]);
  return <div className="app-shell">
    <header className="header"><div className="brand"><div className="brand-mark"><i/><i/><i/><i/><i/></div><div><h1>CONWAY<span>WARS</span></h1><p>A PHYSICAL HISTORY OF TIME</p></div></div><div className="header-note">2D LIFE <span>×</span> 3D HISTORY</div><div className="local-status"><i/> LOCAL EXPERIMENT <span>01</span></div></header>
    <main><Controls size={engine.size} boundary={engine.boundary} limit={engine.history.limit} density={density} seed={seed} speed={speed} options={options} initial={engine.current.id===0&&!playing} pattern={pattern} teamCount={teamCount} onTeamCount={changeTeamCount} victory={victory} onVictory={changeVictory} matchLocked={engine.current.id>0 || playing} mode={mode} paint={paint} onMode={changeMode} onPaint={setPaint}
      onSize={size=>{if(pattern!=='Custom')choosePattern(pattern,size);else randomise(size);}}
      onBoundary={boundary=>start(engine.initial,engine.size,boundary,engine.initialFactions)}
      onLimit={limit=>{engine.history.setLimit(limit);if(selected!==null&&selected<engine.history.layers[0].id)setSelected(engine.history.layers[0].id);refresh();}}
      onDensity={setDensity} onSeed={setSeed} onSpeed={setSpeed} onOptions={setOptions} onPattern={choosePattern}
      onClear={()=>{setPattern('Custom');start(new Uint8Array(engine.size**2));}}
      onRandom={()=>randomise()}
      onInvert={()=>{setPattern('Custom');start(Uint8Array.from(engine.current.state,v=>1-v));}}/>
      <div className="workspace"><div className="scene-area">
        <ConwayScene history={engine.history.layers} selected={current.id} size={engine.size} options={options} showFactions={mode==='factions' || options.colour==='faction'} editable={engine.current.id===0&&!playing} revision={revision} cameraAction={cameraAction} onEdit={index=>{engine.edit(index,mode==='factions'?paint:undefined);setPattern('Custom');refresh();}}/>
        <div className="scene-heading"><div className="eyebrow"><i className={playing?'live-dot active':'live-dot'}/>{playing?'SIMULATION RUNNING':!present?'INSPECTING HISTORY':engine.current.id===0?'EDIT INITIAL STATE':'SIMULATION PAUSED'}</div><h2>Life, layered in time.</h2><p>{mode==='factions'?`${teamCount} teams. Shared rules. Competing ancestry.`:'Each generation leaves a trace.'}</p></div>
        <div className="generation-readout"><span>GENERATION</span><strong>{current.id.toString().padStart(3,'0')}</strong><small>{engine.size} × {engine.size} · {engine.boundary==='wrap'?'TOROIDAL':'FINITE'}</small></div>
        <div className="camera-controls"><button title="Reset camera to isometric view" onClick={()=>camera('iso')}>↺ Reset view</button><div className="segmented">{(['iso','top','side'] as const).map(view=><button key={view} onClick={()=>camera(view)}>{view==='iso'?'Isometric':view==='top'?'Top':'Side'}</button>)}</div><button className="fit-button" onClick={()=>camera('fit')}>⛶ Fit structure</button></div>
        <Statistics teamCount={teamCount} factions={mode==='factions' || options.colour==='faction'} current={current} history={engine.history.layers} peak={engine.peak} cubes={engine.history.cubes} speed={speed}/>
        <div className="time-key"><span><i/> PRESENT <b>Y = 0</b></span><div className="time-line"/><span>↓ PAST <b>−1 / TICK</b></span></div>
        <div className="scene-footer"><span>DRAG to orbit <i>·</i> SCROLL to zoom <i>·</i> RIGHT DRAG to pan</span><span className="colour-legend"><i className={`legend-${options.colour}`} style={options.colour==='faction'?{background:`linear-gradient(90deg,${TEAMS.slice(0,teamCount).map(t=>t.colour).join(',')})`}:undefined}/>{options.colour==='faction'?`${TEAMS.slice(0,teamCount).map(t=>t.name).join(' / ')} · present → past`:options.colour==='age'?'Gold: present → mint → blue → violet: past':options.colour==='birth'?'Mint: birth · violet: survival':options.colour==='neighbours'?'Blue: 0 → coral: 8 neighbours':options.colour==='generation'?'Colour cycles every ~37 generations':'Uniform colour'}</span></div>
        {mode==='factions' && <MatchStatus match={match} generation={engine.current.id} valid={match.canStart(engine)} inspected={current.id} onReset={reset}/>}
        {toast&&<div className="toast" role="status">{toast}</div>}
      </div>
      <div className="bottom-bar"><div className="transport"><button className="play-button" disabled={!present || !canAdvance} onClick={play}>{playing?'Ⅱ Pause':'▶ Play'}<kbd>SPACE</kbd></button><button disabled={!present || !canAdvance} onClick={step}>Step once <kbd>N</kbd></button><button onClick={reset}>↺ Reset <kbd>R</kbd></button></div><Timeline first={engine.history.layers[0].id} present={engine.current.id} selected={current.id} onSelect={id=>{setPlaying(false);setSelected(id===engine.current.id?null:id);}} onPresent={()=>setSelected(null)}/></div>
      </div>
    </main><footer className="app-footer"><span>CONWAY’S GAME OF LIFE / B3·S23</span><span>TOP IS PRESENT. DOWN IS PAST.</span><span>BUILT FOR EXPLORATION</span></footer>
  </div>;
}
