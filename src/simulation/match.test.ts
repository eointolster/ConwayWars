import { describe, expect, it } from 'vitest';
import { ConwayGrid } from './ConwayGrid';
import { Match } from './match';
import { arenaGrid } from './arenas';
import { birthFaction, splitFactions } from './factions';
import { randomGrid } from './seededRandom';

function fixture(blue: 'block'|'blinker'|'single' = 'block', teams=2) {
  const state=new Uint8Array(32*32), owners=new Uint8Array(32*32);
  const cell=(x:number,z:number,team:number)=>{state[z*32+x]=1;owners[z*32+x]=team;};
  [[3,3],[4,3],[3,4],[4,4]].forEach(([x,z])=>cell(x,z,1));
  const cells=blue==='single'?[[20,20]]:blue==='blinker'?[[19,20],[20,20],[21,20]]:[[20,20],[21,20],[20,21],[21,21]];
  cells.forEach(([x,z])=>cell(x,z,2));
  return new ConwayGrid(32,'finite',state,2,owners,teams);
}

describe('up to five teams',()=>{
  it('three-way ties select a parent reproducibly without fixed team priority',()=>{
    const parents=new Uint8Array(64);parents[2*8+2]=3;parents[2*8+3]=4;parents[2*8+4]=5;
    const chosen=new Set<number>();
    for(let g=0;g<100;g++) {
      const a=birthFaction(parents,8,3,3,'finite',g),b=birthFaction(parents,8,3,3,'finite',g);
      expect(a).toEqual(b);expect([3,4,5]).toContain(a.faction);expect(a.contested).toBe(true);chosen.add(a.faction);
    }
    expect([...chosen].sort()).toEqual([3,4,5]);
    parents[2*8+3]=5;expect(birthFaction(parents,8,3,3,'finite',1).faction).toBe(5);
  });
  it('all team counts receive equal non-overlapping seeds in the colony ring',()=>{
    for(let teams=2;teams<=5;teams++) {
      const p=arenaGrid('Colony ring',32,teams),e=new ConwayGrid(p.size,'finite',p.state,100,p.factions,teams);
      expect(e.current.factionStats.map(s=>s.population)).toEqual(Array(teams).fill(5));
    }
  });
  it('five-team evolution preserves binary Conway geometry and ownership through resets',()=>{
    for(const boundary of ['finite','wrap'] as const) {
      const state=randomGrid(32,.3,92),owners=splitFactions(state,32,5);
      const plain=new ConwayGrid(32,boundary,state),e=new ConwayGrid(32,boundary,state,25,owners,5),copy=new ConwayGrid(32,boundary,state,25,owners,5);
      for(let i=0;i<60;i++) {
        const g=e.step();expect(g.state).toEqual(plain.step().state);expect(g.factions).toEqual(copy.step().factions);
        expect(g.factionStats.reduce((sum,s)=>sum+s.population,0)).toBe(g.living.length);
        for(const index of g.living)expect(g.factions[index]).toBeGreaterThan(0);
      }
      e.reset();expect(e.current.factions).toEqual(owners);
      e.edit(0,5);expect(e.current.factions[0]).toBe(owners[0]===5?0:5);
    }
  });
});

describe('victory conditions',()=>{
  it('last team alive wins after simultaneous Conway evolution',()=>{
    const e=fixture('single'),m=new Match({rule:'last',limit:500});
    expect(m.step(e)).toBe(true);expect(m.result).toMatchObject({generation:1,winners:[1],reason:'elimination'});
    expect(m.step(e)).toBe(false);expect(e.current.id).toBe(1);
  });
  it('a timed population match stops exactly at its deadline',()=>{
    const e=fixture('blinker'),m=new Match({rule:'population',limit:7});
    for(let i=0;i<6;i++){m.step(e);expect(m.result).toBeNull();}m.step(e);
    expect(m.result).toMatchObject({generation:7,winners:[1],scores:[4,3],reason:'deadline'});
    for(let i=0;i<10;i++)expect(m.step(e)).toBe(false);expect(e.current.id).toBe(7);
  });
  it('cumulative births exclude seeded cells and survive history eviction',()=>{
    const e=fixture('blinker'),m=new Match({rule:'births',limit:10});
    for(let i=0;i<10;i++)m.step(e);
    expect(e.history.layers).toHaveLength(2);expect(m.result).toMatchObject({winners:[2],scores:[0,20]});
    e.reset();m.reset();expect(m.result).toBeNull();expect(m.births).toEqual([]);m.step(e);expect(m.births).toEqual([0,2]);
  });
  it('equal scores draw only among participating teams',()=>{
    const e=fixture('block',5),m=new Match({rule:'births',limit:2});m.step(e);m.step(e);
    expect(m.result?.winners).toEqual([1,2]);expect(m.result?.scores).toEqual([0,0,0,0,0]);
  });
  it('simultaneous extinction ends in a draw',()=>{
    const state=new Uint8Array(64),owners=new Uint8Array(64);state[0]=state[63]=1;owners[0]=1;owners[63]=5;
    for(const rule of ['last','population','births'] as const) {
      const e=new ConwayGrid(8,'finite',state,100,owners,5),m=new Match({rule,limit:50});m.step(e);
      expect(m.result).toMatchObject({generation:1,winners:[],reason:'extinction'});
    }
  });
  it('needs two populated teams for matches while sandbox stays unrestricted',()=>{
    const e=new ConwayGrid(8,'finite'),m=new Match({rule:'last',limit:10});
    expect(m.canStart(e)).toBe(false);expect(m.step(e)).toBe(false);expect(e.current.id).toBe(0);
    const sandbox=new Match({rule:'sandbox',limit:1});for(let i=0;i<5;i++)sandbox.step(e);
    expect(e.current.id).toBe(5);expect(sandbox.result).toBeNull();
  });
  it('a stable multi-team last-survivor match remains ongoing',()=>{
    const e=fixture(),m=new Match({rule:'last',limit:2});for(let i=0;i<10;i++)m.step(e);expect(m.result).toBeNull();
  });
});
