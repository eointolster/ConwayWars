export type Boundary = 'finite' | 'wrap';
export type ColourMode = 'age' | 'solid' | 'generation' | 'neighbours' | 'birth' | 'faction';
export type Faction = 1 | 2 | 3 | 4 | 5;
export type SimulationMode = 'classic' | 'factions';
export interface FactionStats { population: number; births: number; deaths: number; }
/** Compact immutable snapshot. Extra per-cell channels can be added without changing rules. */
export interface Generation {
  id: number;
  state: Uint8Array;
  living: Uint16Array;
  factions: Uint8Array; // 0 = dead, 1–5 = team IDs
  factionStats: FactionStats[];
  contestedBirths: number;
  neighbours: Uint8Array;
  born: Uint8Array;
  births: number;
  deaths: number;
}
export interface ViewOptions {
  colour: ColourMode; smooth: boolean; duration: number;
  plane: boolean; grid: boolean; axes: boolean; guides: boolean;
}
export type CameraView = 'iso' | 'top' | 'side' | 'fit';
