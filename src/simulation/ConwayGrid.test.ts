import { describe, expect, it } from 'vitest';
import { ConwayGrid } from './ConwayGrid';
import { willLive, neighbourCount } from './rules';
import { randomGrid } from './seededRandom';
import { patternGrid, patterns } from './patterns';
function grid(size: number, cells: number[][]) {
  const state = new Uint8Array(size*size);
  cells.forEach(([x,y])=>state[y*size+x]=1);return state;
}
function coords(engine: ConwayGrid) { return [...engine.current.living].map(i=>[i%engine.size,Math.floor(i/engine.size)]); }
describe('B3/S23',()=>{
  it('underpopulation kills living cells with 0 or 1 neighbours',()=>{expect(willLive(1,0)).toBe(false);expect(willLive(1,1)).toBe(false);});
  it('survival needs 2 or 3 neighbours',()=>{expect(willLive(1,2)).toBe(true);expect(willLive(1,3)).toBe(true);});
  it('overpopulation kills with 4 through 8 neighbours',()=>{for(let n=4;n<=8;n++)expect(willLive(1,n)).toBe(false);});
  it('reproduction occurs only with 3 neighbours',()=>{for(let n=0;n<=8;n++)expect(willLive(0,n)).toBe(n===3);});
  it('block still life remains stable',()=>{const state=grid(8,[[3,3],[4,3],[3,4],[4,4]]);const e=new ConwayGrid(8,'finite',state);for(let i=0;i<20;i++)expect(e.step().state).toEqual(state);expect(e.current.births).toBe(0);expect(e.current.deaths).toBe(0);});
  it('blinker oscillates with correct birth and survival metadata',()=>{const state=grid(7,[[2,3],[3,3],[4,3]]);const e=new ConwayGrid(7,'finite',state);e.step();expect(coords(e)).toEqual([[3,2],[3,3],[3,4]]);expect(e.current.births).toBe(2);expect(e.current.deaths).toBe(2);expect(e.current.born[3*7+3]).toBe(0);expect(e.current.born[2*7+3]).toBe(1);expect(e.current.neighbours[2*7+3]).toBe(3);expect(e.step().state).toEqual(state);});
  it('glider translates by one cell in both axes every four steps',()=>{const e=new ConwayGrid(10,'finite',grid(10,[[2,1],[3,2],[1,3],[2,3],[3,3]]));for(let i=0;i<4;i++)e.step();expect(coords(e)).toEqual([[3,2],[4,3],[2,4],[3,4],[4,4]]);});
  it('finite boundaries treat out-of-grid cells as dead',()=>{const state=grid(5,[[4,4],[0,4],[4,0]]);expect(neighbourCount(state,5,0,0,'finite')).toBe(0);const e=new ConwayGrid(5,'finite',state);expect(e.step().living.length).toBe(0);});
  it('toroidal boundaries wrap both axes',()=>{const state=grid(5,[[4,4],[0,4],[4,0]]);expect(neighbourCount(state,5,0,0,'wrap')).toBe(3);const e=new ConwayGrid(5,'wrap',state);expect(coordsAfter(e)).toEqual([[0,0],[4,0],[0,4],[4,4]]);});
  it('seeded random grids are deterministic and seed-dependent',()=>{expect(randomGrid(48,.28,428719)).toEqual(randomGrid(48,.28,428719));expect(randomGrid(48,.28,428719)).not.toEqual(randomGrid(48,.28,428720));});
  it('stepping N generations gives identical immutable history',()=>{const state=randomGrid(32,.3,98);const a=new ConwayGrid(32,'wrap',state),b=new ConwayGrid(32,'wrap',state);for(let i=0;i<30;i++){a.step();b.step();}expect(a.history.layers).toEqual(b.history.layers);expect(a.history.layers[0].state).toEqual(state);expect(a.history.layers).toHaveLength(31);});
  it('reset restores the edited initial state even after history eviction',()=>{const e=new ConwayGrid(8,'finite',grid(8,[[2,2],[3,2],[4,2]]),3);e.edit(5);const initial=e.current.state.slice();for(let i=0;i<8;i++)e.step();expect(e.history.layers.map(g=>g.id)).toEqual([6,7,8]);e.reset();expect(e.current.id).toBe(0);expect(e.current.state).toEqual(initial);expect(e.history.layers).toHaveLength(1);});
  it('history limits retain newest layers and enforce memory limit',()=>{const e=new ConwayGrid(8,'finite',undefined,5);for(let i=0;i<9;i++)e.step();e.history.setLimit(2);expect(e.history.layers.map(g=>g.id)).toEqual([8,9]);e.history.setLimit(100000);expect(e.history.limit).toBe(500);});
  it('editing later generations is rejected',()=>{const e=new ConwayGrid(8,'finite');e.step();e.edit(0);expect(e.current.state[0]).toBe(0);});
  it('all patterns have expected populations and fit safely',()=>{const populations=[5,5,7,7,48,36];Object.keys(patterns).forEach((name,i)=>{const p=patternGrid(name,32);expect(p.state.reduce((a,b)=>a+b,0)).toBe(populations[i]);if(name==='Gosper Glider Gun')expect(p.size).toBe(48);});});
  it('pulsar repeats after three generations',()=>{const p=patternGrid('Pulsar',48);const e=new ConwayGrid(p.size,'finite',p.state);e.step();e.step();expect(e.step().state).toEqual(p.state);});
});
function coordsAfter(e:ConwayGrid){e.step();return coords(e);}
