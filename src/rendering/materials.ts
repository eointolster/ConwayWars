import * as THREE from 'three';
import { teamInfo } from '../simulation/teams';
import type { ColourMode, Generation } from '../types';

const colour = new THREE.Color();
const ageStops = [
  { age: 0, colour: new THREE.Color('#ffe394') },
  { age: 1, colour: new THREE.Color('#78efb3') },
  { age: 5, colour: new THREE.Color('#31cfc8') },
  { age: 12, colour: new THREE.Color('#399cec') },
  { age: 25, colour: new THREE.Color('#7068db') },
  { age: 60, colour: new THREE.Color('#65588f') },
  { age: 150, colour: new THREE.Color('#3b476a') },
];

export function cellColour(mode: ColourMode, layer: Generation, index: number): THREE.Color {
  // Instance colours multiply the layer material. Keep age-mode instances neutral
  // so the palette can reach warm gold, blue and violet without a green tint.
  if (mode === 'faction') return colour.set(teamInfo(layer.factions[index]).colour);
  if (mode === 'age') return colour.set('white');
  if (mode === 'neighbours') return colour.setHSL(0.62 - layer.neighbours[index] * 0.065, 0.73, 0.57);
  if (mode === 'birth') return colour.set(layer.born[index] ? '#86f4c5' : '#a18aef');
  if (mode === 'generation') return colour.setHSL((layer.id * 0.027 + 0.42) % 1, 0.65, 0.6);
  return colour.set('#83efd0');
}

export function layerTint(mode: ColourMode, age: number): THREE.Color {
  if (mode === 'faction') return new THREE.Color().setScalar(0.23 + 0.77 * Math.exp(-Math.max(0, age) / 65));
  if (mode !== 'age') return new THREE.Color('white');
  const clampedAge = Math.max(0, age);
  for (let i = 1; i < ageStops.length; i++) {
    const previous = ageStops[i - 1], next = ageStops[i];
    if (clampedAge <= next.age) {
      const fraction = (clampedAge - previous.age) / (next.age - previous.age);
      return previous.colour.clone().lerp(next.colour, fraction);
    }
  }
  // Deep history stays opaque and readable rather than fading to black.
  return ageStops[ageStops.length - 1].colour.clone();
}
