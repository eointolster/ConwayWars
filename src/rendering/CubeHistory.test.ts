import { describe, it, expect } from 'vitest';
import { CubeHistory, MAX_RENDERED_CUBES } from './CubeHistory';
import { ConwayGrid } from '../simulation/ConwayGrid';
import type { ViewOptions } from '../types';
const options:ViewOptions={colour:'age',smooth:false,duration:180,plane:true,grid:true,axes:false,guides:true};
function stable(){const state=new Uint8Array(32*32);[330,331,362,363].forEach(i=>state[i]=1);return new ConwayGrid(32,'finite',state,500);}
describe('physical history rendering',()=>{
 it('keeps present at zero and historical layers exactly one cube apart',()=>{const e=stable();for(let i=0;i<10;i++)e.step();const r=new CubeHistory();r.sync(e.history.layers,10,32,options);expect(r.count).toBe(44);for(const [id,layer]of r.layers)expect(layer.mesh.position.y).toBe(-(10-id));r.dispose();});
 it('interpolates historical movement without moving the present',()=>{const e=stable(),r=new CubeHistory(),smooth={...options,smooth:true};r.sync(e.history.layers,0,32,smooth);e.step();r.sync(e.history.layers,1,32,smooth);expect(r.layers.get(0)!.mesh.position.y).toBeCloseTo(0);r.animate(.09,smooth);expect(r.layers.get(0)!.mesh.position.y).toBeGreaterThan(-1);expect(r.layers.get(0)!.mesh.position.y).toBeLessThan(0);expect(r.layers.get(1)!.mesh.position.y).toBeCloseTo(0);r.animate(.09,smooth);expect(r.layers.get(0)!.mesh.position.y).toBe(-1);r.dispose();});
 it('scrubs without destroying simulation history and removes hidden render layers',()=>{const e=stable(),r=new CubeHistory();for(let i=0;i<10;i++)e.step();r.sync(e.history.layers,10,32,options);r.sync(e.history.layers,3,32,options);expect(r.layers.size).toBe(4);expect(e.history.layers).toHaveLength(11);expect(r.layers.get(3)!.mesh.position.y).toBeCloseTo(0);r.sync(e.history.layers,10,32,options);expect(r.layers.size).toBe(11);r.dispose();});
 it('enforces the cube cap while preserving all stored snapshots',()=>{const e=new ConwayGrid(128,'finite',new Uint8Array(128*128).fill(1),500);const layers=Array.from({length:25},(_,id)=>({...e.current,id}));const r=new CubeHistory();r.sync(layers,24,128,options);expect(r.count).toBe(MAX_RENDERED_CUBES);expect(r.omitted).toBe(25*128*128-MAX_RENDERED_CUBES);expect(layers).toHaveLength(25);expect(r.layers.has(24)).toBe(true);expect(r.layers.has(0)).toBe(false);r.dispose();});
});
