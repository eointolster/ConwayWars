import { describe, expect, it } from 'vitest';
import { ConwayGrid } from './ConwayGrid';
import { arenaGrid, arenas } from './arenas';
import { randomGrid } from './seededRandom';
import { splitFactions } from './factions';

function seed(cells: [number,number,number][], size=8, boundary:'finite'|'wrap'='finite') {
  const state=new Uint8Array(size*size), owners=new Uint8Array(size*size);
  cells.forEach(([x,z,f])=>{state[z*size+x]=1;owners[z*size+x]=f;});
  return new ConwayGrid(size,boundary,state,25,owners);
}

describe('two factions with unchanged Conway geometry',()=>{
  it('newborns inherit either majority and count mixed-parent births',()=>{
    for(const majority of [1,2]) {
      const e=seed([[2,2,majority],[3,2,majority],[4,2,3-majority]]);
      const g=e.step();
      expect(g.state[3*8+3]).toBe(1);
      expect(g.factions[3*8+3]).toBe(majority);
      expect(g.born[3*8+3]).toBe(1);
      expect(g.contestedBirths).toBe(2);
      expect(g.factionStats[majority-1].births).toBe(2);
    }
  });
  it('survivors keep ownership even when all their neighbours are opponents',()=>{
    const e=seed([[3,3,2],[2,3,1],[4,3,1]]);const g=e.step();
    expect(g.factions[3*8+3]).toBe(2);expect(g.born[3*8+3]).toBe(0);
    expect(g.factionStats.map(s=>s.deaths)).toEqual([2,0]);
    expect(g.factionStats.map(s=>s.population)).toEqual([2,1]);
  });
  it('single-faction births are not contested and dead cells have no faction',()=>{
    const e=seed([[2,3,2],[3,3,2],[4,3,2],[6,6,1]]);const g=e.step();
    expect(g.contestedBirths).toBe(0);expect(g.factions[6*8+6]).toBe(0);
    expect(g.factionStats[0].deaths).toBe(1);expect(g.factionStats[1].population).toBe(3);
  });
  it('faction inheritance wraps across both toroidal boundaries',()=>{
    const e=seed([[7,7,2],[0,7,2],[7,0,1]],8,'wrap');const g=e.step();
    expect(g.state[0]).toBe(1);expect(g.factions[0]).toBe(2);expect(g.contestedBirths).toBe(1);
  });
  it('ownership never changes binary evolution, statistics balance, and history is deterministic',()=>{
    for(const boundary of ['finite','wrap'] as const) {
      const state=randomGrid(32,.3,428719),owners=splitFactions(state,32);
      const classic=new ConwayGrid(32,boundary,state),a=new ConwayGrid(32,boundary,state,100,owners),b=new ConwayGrid(32,boundary,state,100,owners);
      let previous=a.current;
      for(let i=0;i<100;i++) {
        const g=a.step();b.step();expect(g.state).toEqual(classic.step().state);
        expect(g.factionStats.reduce((n,s)=>n+s.population,0)).toBe(g.living.length);
        expect(g.factionStats.reduce((n,s)=>n+s.births,0)).toBe(g.births);
        expect(g.factionStats.reduce((n,s)=>n+s.deaths,0)).toBe(g.deaths);
        g.factionStats.forEach((stats,team)=>expect(stats.population).toBe(previous.factionStats[team].population+stats.births-stats.deaths));
        previous=g;
      }
      expect(a.history.layers).toEqual(b.history.layers);
    }
  });
  it('painting, recolouring, erasing, and reset preserve the correct ownership',()=>{
    const e=seed([]);e.edit(10,2);expect(e.current.factions[10]).toBe(2);
    e.edit(10,1);expect(e.current.factions[10]).toBe(1);expect(e.current.state[10]).toBe(1);
    e.edit(10,1);expect(e.current.state[10]).toBe(0);
    e.edit(10,2);e.edit(11,1);e.edit(11,0);expect(e.current.state[11]).toBe(0);
    const saved=e.current;for(let i=0;i<30;i++)e.step();e.reset();
    expect(e.current.factions).toEqual(saved.factions);expect(e.current.state).toEqual(saved.state);
    expect(saved.factions[10]).toBe(2);
  });
});

describe('arena geometry',()=>{
  it('fits two colonies without overlap and uses the required minimum size',()=>{
    const populations=[[5,5],[36,36],[5,7],[5,5]];
    arenas.forEach((name,i)=>{
      const p=arenaGrid(name,32),e=new ConwayGrid(p.size,'finite',p.state,100,p.factions);
      expect(p.size).toBe(name==='Opposing glider guns'?96:48);
      expect(e.current.factionStats.map(s=>s.population)).toEqual(populations[i]);
    });
  });
  it('opposing gliders approach and collide with mixed-parent births',()=>{
    const p=arenaGrid('Opposing gliders',48),e=new ConwayGrid(p.size,'finite',p.state,100,p.factions);
    let contested=0;
    for(let i=0;i<80;i++)contested+=e.step().contestedBirths;
    expect(contested).toBeGreaterThan(0);
    expect(e.current.living.length).not.toBe(10);
  });
  it('opposing guns interact in 500 generations and retain both factions in history',()=>{
    const p=arenaGrid('Opposing glider guns',96);
    const e=new ConwayGrid(p.size,'finite',p.state,500,p.factions);
    const isolated=[1,2].map(team=>new ConwayGrid(p.size,'finite',Uint8Array.from(p.state,(v,i)=>p.factions[i]===team?v:0),1));
    let contested=0,diverged=false;
    for(let tick=0;tick<500;tick++) {
      const g=e.step();contested+=g.contestedBirths;const a=isolated[0].step(),b=isolated[1].step();
      if(g.state.some((v,i)=>v!==Number(a.state[i]||b.state[i])))diverged=true;
    }
    console.info('Gun arena 500 generations', {contested,diverged,populations:e.current.factionStats.map(s=>s.population),cubes:e.history.cubes});
    expect(diverged).toBe(true);expect(contested).toBeGreaterThan(0);
    expect(e.current.id).toBe(500);expect(e.history.layers).toHaveLength(500);
    expect(e.history.layers.some(g=>g.factionStats.every(s=>s.population>0))).toBe(true);
  });
  it('R-pentomino and Acorn eventually share contested births',()=>{
    const p=arenaGrid('R-pentomino vs Acorn',48),e=new ConwayGrid(p.size,'finite',p.state,25,p.factions);
    let contested=0;for(let i=0;i<250;i++)contested+=e.step().contestedBirths;
    expect(contested).toBeGreaterThan(0);
  });
});
