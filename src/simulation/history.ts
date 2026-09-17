import type { Generation } from '../types';
export const MAX_STORED_LAYERS = 500;
export class History {
  layers: Generation[] = [];
  constructor(public limit = 100) {}
  push(layer: Generation) { this.layers.push(layer); this.trim(); }
  trim() { this.layers.splice(0, Math.max(0, this.layers.length - this.limit)); }
  setLimit(limit: number) { this.limit = Math.max(1, Math.min(MAX_STORED_LAYERS, limit)); this.trim(); }
  get latest() { return this.layers[this.layers.length - 1]; }
  get cubes() { return this.layers.reduce((sum, g) => sum + g.living.length, 0); }
}
