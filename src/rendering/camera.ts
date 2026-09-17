import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CameraView } from '../types';
export function frameCamera(camera: THREE.PerspectiveCamera, controls: OrbitControls, box: THREE.Box3, view: CameraView) {
  if (view === 'top') box = new THREE.Box3(new THREE.Vector3(box.min.x, 0, box.min.z), new THREE.Vector3(box.max.x, 0, box.max.z));
  const centre = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(4, size.length() / 2);
  const halfFov = Math.min(camera.fov * Math.PI / 360, Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect));
  const distance = radius / Math.sin(halfFov) * 1.12;
  let direction = new THREE.Vector3(1, 0.78, 1.15);
  if (view === 'top') direction.set(0, 1, 0.0001);
  if (view === 'side') direction.set(0, 0, 1);
  if (view === 'fit') direction.copy(camera.position).sub(controls.target);
  camera.position.copy(centre).add(direction.normalize().multiplyScalar(distance));
  controls.target.copy(centre); camera.far = Math.max(3000, distance * 4); camera.updateProjectionMatrix(); controls.update();
}
