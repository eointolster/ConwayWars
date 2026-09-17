import { patterns } from './patterns';
import type { Faction } from '../types';

export const arenas = ['Opposing gliders', 'Opposing glider guns', 'R-pentomino vs Acorn', 'Colony ring'] as const;
export type ArenaName = typeof arenas[number];
export const isArena = (name: string): name is ArenaName => (arenas as readonly string[]).includes(name);

export function arenaGrid(name: ArenaName, requestedSize: number, teamCount = 2) {
  const minimum = name === 'Opposing glider guns' ? 96 : 48;
  const size = Math.max(minimum, requestedSize);
  const state = new Uint8Array(size * size), factions = new Uint8Array(size * size);
  const place = (rows: string[], ox: number, oz: number, faction: Faction, rotate = false) => {
    const width = Math.max(...rows.map(row => row.length)), height = rows.length;
    rows.forEach((row, z) => [...row].forEach((cell, x) => {
      if (cell !== 'O') return;
      const px = ox + (rotate ? width - 1 - x : x), pz = oz + (rotate ? height - 1 - z : z);
      const index = pz * size + px;
      if (px < 0 || pz < 0 || px >= size || pz >= size || state[index]) throw new Error('Arena placement overlaps or exceeds grid');
      state[index] = 1; factions[index] = faction;
    }));
  };
  if (name === 'Colony ring') {
    const count = Math.max(2,Math.min(5,teamCount));
    const mid = (size-1)/2;
    for(let team=1;team<=count;team++) {
      const angle=-Math.PI/2+(team-1)*Math.PI*2/count;
      place(patterns['R-pentomino'], Math.round(mid+10*Math.cos(angle))-1, Math.round(mid+10*Math.sin(angle))-1, team as Faction, team%2===0);
    }
  } else if (name === 'Opposing gliders') {
    // A glider travels diagonally. A 180-degree opponent approaches on the
    // same diagonal, so these really collide rather than run in parallel.
    const offset = Math.floor(size / 2) - 8;
    place(patterns.Glider, offset, offset, 1);
    place(patterns.Glider, size - offset - 3, size - offset - 3, 2, true);
  } else if (name === 'Opposing glider guns') {
    // Standard Gosper output travels SE along z-x ~= -17 in local space.
    // Offset the first gun by +17 in z and centrally reflect its opponent.
    // Both streams then travel through the arena's central diagonal.
    const x = 6, z = 23;
    place(patterns['Gosper Glider Gun'], x, z, 1);
    place(patterns['Gosper Glider Gun'], size - x - 36, size - z - 9, 2, true);
  } else {
    const mid = Math.floor(size / 2);
    place(patterns['R-pentomino'], mid - 10, mid - 2, 1);
    place(patterns.Acorn, mid + 4, mid - 2, 2, true);
  }
  return { size, state, factions };
}
