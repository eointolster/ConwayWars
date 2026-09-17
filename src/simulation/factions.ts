import type { Boundary, Faction } from '../types';

/** Used only for births: the B3 rule guarantees exactly three living parents. */
export function birthFaction(factions: Uint8Array, size: number, x: number, z: number, boundary: Boundary, generation = 0): { faction: Faction; contested: boolean } {
  const parents: number[] = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dz) continue;
    let nx = x + dx, nz = z + dz;
    if (boundary === 'wrap') { nx = (nx + size) % size; nz = (nz + size) % size; }
    if (nx < 0 || nx >= size || nz < 0 || nz >= size) continue;
    const faction = factions[nz * size + nx];
    if (faction) parents.push(faction);
  }
  parents.sort((a,b)=>a-b);
  const majority = parents.find((team,i)=>team===parents[i+1]);
  // Three distinct parents: reproducible spatial/generation hash chooses one
  // of the sorted parent teams. No team ID or neighbour traversal gets priority.
  let hash = Math.imul(x + 1, 0x9e3779b1) ^ Math.imul(z + 1, 0x85ebca6b) ^ Math.imul(generation + 1, 0xc2b2ae35);
  hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  hash ^= hash >>> 15;
  return { faction: (majority ?? parents[(hash >>> 0) % parents.length]) as Faction, contested: parents[0] !== parents[parents.length-1] };
}

/** Deterministic vertical team bands without changing seeded binary occupancy. */
export function splitFactions(state: Uint8Array, size: number, teamCount = 2): Uint8Array {
  return Uint8Array.from(state, (alive, i) => alive ? (Math.floor((i % size) * teamCount / size) + 1) : 0);
}
