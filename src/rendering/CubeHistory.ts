import * as THREE from 'three';
import type { Generation, ViewOptions } from '../types';
import { cellColour, layerTint } from './materials';
export const MAX_RENDERED_CUBES = 350_000;
interface RenderLayer { mesh: THREE.InstancedMesh; data: Generation; target: number; start: number; elapsed: number; }
export class CubeHistory {
  group = new THREE.Group();
  layers = new Map<number, RenderLayer>();
  geometry = new THREE.BoxGeometry(0.89, 0.89, 0.89);
  bounds = new THREE.Box3();
  count = 0;
  omitted = 0;
  private mode = '';
  sync(history: Generation[], selected: number, size: number, options: ViewOptions) {
    let remaining = MAX_RENDERED_CUBES;
    const included = history.filter(g => g.id <= selected).reverse();
    const wanted = new Set<number>();
    this.count = 0; this.omitted = 0; this.bounds.makeEmpty();
    for (const data of included) {
      const count = Math.min(remaining, data.living.length);
      this.omitted += data.living.length - count; remaining -= count; this.count += count;
      if (!count) continue;
      wanted.add(data.id);
      let entry = this.layers.get(data.id);
      if (entry && (entry.data !== data || entry.mesh.count !== count)) { this.remove(data.id); entry = undefined; }
      if (!entry) {
        const material = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.12 });
        const mesh = new THREE.InstancedMesh(this.geometry, material, count);
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < count; i++) {
          const index = data.living[i];
          matrix.makeTranslation(index % size - (size - 1) / 2, 0, Math.floor(index / size) - (size - 1) / 2);
          mesh.setMatrixAt(i, matrix); mesh.setColorAt(i, cellColour(options.colour, data, index));
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere(); mesh.computeBoundingBox(); mesh.userData.generation = data;
        mesh.position.y = -(selected - data.id);
        this.group.add(mesh);
        entry = { mesh, data, target: mesh.position.y, start: mesh.position.y, elapsed: 1 };
        this.layers.set(data.id, entry);
      } else if (this.mode !== options.colour) {
        for (let i = 0; i < count; i++) entry.mesh.setColorAt(i, cellColour(options.colour, data, data.living[i]));
        entry.mesh.instanceColor!.needsUpdate = true;
      }
      const age = selected - data.id;
      const target = -age;
      if (entry.target !== target) { entry.start = entry.mesh.position.y; entry.elapsed = 0; entry.target = target; }
      if (!options.smooth || age === 0 || Math.abs(entry.start - target) > 4) { entry.mesh.position.y = target; entry.start = target; entry.elapsed = 1; }
      const material = entry.mesh.material as THREE.MeshStandardMaterial;
      material.color.copy(layerTint(options.colour, age));
      // Faction hue comes from instance colours: a green emissive overlay would
      // make red/blue look misleading. Brightness alone marks their present.
      material.emissive.set(age === 0 && options.colour !== 'faction' ? (options.colour === 'age' ? '#ffd16a' : '#48ba92') : '#000000');
      material.emissiveIntensity = 0.22;
      const box = entry.mesh.boundingBox!.clone();
      box.translate(new THREE.Vector3(0, -age, 0));
      this.bounds.union(box);
    }
    for (const id of this.layers.keys()) if (!wanted.has(id)) this.remove(id);
    this.mode = options.colour;
    if (this.bounds.isEmpty()) this.bounds.set(new THREE.Vector3(-size/2, -1, -size/2), new THREE.Vector3(size/2, 0, size/2));
    else this.bounds.expandByScalar(1.5);
  }
  animate(delta: number, options: ViewOptions) {
    let changed = false;
    for (const entry of this.layers.values()) {
      entry.elapsed += delta;
      const t = options.smooth ? Math.min(1, entry.elapsed / (options.duration / 1000)) : 1;
      const y = THREE.MathUtils.lerp(entry.start, entry.target, 1 - (1-t)**3);
      if (entry.mesh.position.y !== y) changed = true;
      entry.mesh.position.y = y;
    }
    return changed;
  }
  remove(id: number) {
    const entry = this.layers.get(id)!; this.group.remove(entry.mesh);
    (entry.mesh.material as THREE.Material).dispose(); entry.mesh.dispose(); this.layers.delete(id);
  }
  dispose() { for (const id of this.layers.keys()) this.remove(id); this.geometry.dispose(); }
}
