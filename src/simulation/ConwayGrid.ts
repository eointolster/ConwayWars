import type { Boundary, Faction, FactionStats, Generation } from '../types';
import { History } from './history';
import { neighbourCount, willLive } from './rules';
import { birthFaction } from './factions';

function snapshot(id: number, state: Uint8Array, neighbours: Uint8Array, born: Uint8Array, factions: Uint8Array, teamCount: number, previous?: Generation, contestedBirths = 0): Generation {
  const indexes: number[] = [];
  const factionStats: FactionStats[] = Array.from({length:teamCount},()=>({population:0,births:0,deaths:0}));
  let births = 0, deaths = 0;
  for (let i = 0; i < state.length; i++) {
    if (state[i]) {
      indexes.push(i);
      const stats = factionStats[factions[i] - 1];
      stats.population++;
      if (born[i]) { stats.births++; births++; }
    } else if (previous?.state[i]) {
      factionStats[previous.factions[i] - 1].deaths++;
      deaths++;
    }
  }
  return { id, state, living: Uint16Array.from(indexes), neighbours, born, births, deaths, factions, factionStats, contestedBirths };
}

export class ConwayGrid {
  history: History;
  initial: Uint8Array;
  initialFactions: Uint8Array;
  peak = 0;

  constructor(public size: number, public boundary: Boundary, state: Uint8Array = new Uint8Array(size * size), limit = 100, factions?: Uint8Array, public teamCount = Math.max(2, ...(factions ?? []))) {
    this.teamCount = Math.max(2, Math.min(5, this.teamCount));
    this.history = new History(limit);
    this.initial = state.slice();
    // A binary seed without ownership is a single red colony. Never encode
    // faction IDs in state: Conway neighbour counts must remain binary.
    this.initialFactions = Uint8Array.from(state, (alive, i) => alive ? (factions?.[i] && factions[i] <= this.teamCount && factions[i] <= 5 ? factions[i] : 1) : 0);
    this.reset();
  }
  get current() { return this.history.latest; }

  reset() {
    const state = this.initial.slice();
    const neighbours = Uint8Array.from(state, (_, i) => neighbourCount(state, this.size, i % this.size, Math.floor(i / this.size), this.boundary));
    const layer = snapshot(0, state, neighbours, state.slice(), this.initialFactions.slice(), this.teamCount);
    this.history.layers = [layer];
    this.peak = layer.living.length;
  }

  edit(index: number, faction?: Faction | 0) {
    if (this.current.id !== 0 || (faction !== undefined && faction > this.teamCount) || index < 0 || index >= this.initial.length) return;
    if (faction === undefined) {
      this.initial[index] ^= 1;
      this.initialFactions[index] = this.initial[index] ? 1 : 0;
    } else {
      // Same faction toggles off; the other faction repaints; erase always clears.
      const owner = this.initialFactions[index] === faction ? 0 : faction;
      this.initial[index] = Number(owner !== 0);
      this.initialFactions[index] = owner;
    }
    this.reset();
  }

  step(): Generation {
    const previous = this.current;
    const state = new Uint8Array(this.size * this.size);
    const neighbours = new Uint8Array(state.length), born = new Uint8Array(state.length), factions = new Uint8Array(state.length);
    let contestedBirths = 0;
    for (let i = 0; i < state.length; i++) {
      const x = i % this.size, z = Math.floor(i / this.size);
      const n = neighbourCount(previous.state, this.size, x, z, this.boundary);
      neighbours[i] = n;
      state[i] = Number(willLive(previous.state[i], n));
      if (!state[i]) continue;
      if (previous.state[i]) factions[i] = previous.factions[i];
      else {
        born[i] = 1;
        const inherited = birthFaction(previous.factions, this.size, x, z, this.boundary, previous.id + 1);
        factions[i] = inherited.faction;
        if (inherited.contested) contestedBirths++;
      }
    }
    const layer = snapshot(previous.id + 1, state, neighbours, born, factions, this.teamCount, previous, contestedBirths);
    this.history.push(layer);
    this.peak = Math.max(this.peak, layer.living.length);
    return layer;
  }
}
