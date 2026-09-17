import type { Boundary } from '../types';
export function neighbourCount(state: Uint8Array, size: number, x: number, z: number, boundary: Boundary): number {
  let n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dz) continue;
    let nx = x + dx, nz = z + dz;
    if (boundary === 'wrap') { nx = (nx + size) % size; nz = (nz + size) % size; }
    if (nx >= 0 && nx < size && nz >= 0 && nz < size) n += state[nz * size + nx];
  }
  return n;
}
export const willLive = (alive: number, neighbours: number): boolean => neighbours === 3 || (alive === 1 && neighbours === 2);
