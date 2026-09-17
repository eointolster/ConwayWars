import { teamInfo } from '../simulation/teams';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CameraView, Generation, ViewOptions } from '../types';
import { CubeHistory } from './CubeHistory';
import { frameCamera } from './camera';
interface Props {
  history: Generation[]; selected: number; size: number; options: ViewOptions; editable: boolean;
  revision: number; showFactions: boolean; cameraAction: { view: CameraView; serial: number }; onEdit: (index: number) => void;
}
export function ConwayScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props); latest.current = props;
  const runtime = useRef<{ cubes: CubeHistory; camera: THREE.PerspectiveCamera; controls: OrbitControls; update: () => void } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; layer: Generation; index: number } | null>(null);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setError('WebGL could not start. Enable hardware acceleration in your browser and reload.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor('#091216', 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 4000);
    let dirty = true;
    const invalidate = () => { dirty = true; };
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', invalidate);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 3; controls.maxDistance = 2400;
    scene.add(new THREE.HemisphereLight('#dafff6', '#203347', 2.2));
    const sun = new THREE.DirectionalLight('#fff2dc', 3.2); sun.position.set(25, 55, 35); scene.add(sun);
    const rim = new THREE.DirectionalLight('#629bdd', 2); rim.position.set(-40, 5, -20); scene.add(rim);
    const cubes = new CubeHistory(); scene.add(cubes.group);
    const helpers = new THREE.Group(); scene.add(helpers);
    let helperKey = '';
    function clearHelpers() {
      for (const child of [...helpers.children]) {
        helpers.remove(child);
        const obj = child as THREE.Mesh;
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(mat => { if (mat) { (mat as THREE.SpriteMaterial).map?.dispose(); mat.dispose(); } });
      }
    }
    const update = () => {
      dirty = true;
      const p = latest.current;
      cubes.sync(p.history, p.selected, p.size, p.options);
      setWarning(cubes.omitted ? `Rendering limit: ${cubes.omitted.toLocaleString()} older cubes hidden. Reduce history depth to see the full stored structure.` : '');
      const depth = p.selected - (p.history[0]?.id ?? 0);
      const key = JSON.stringify([p.size, depth, p.selected, p.options.plane, p.options.grid, p.options.axes, p.options.guides]);
      if (key === helperKey) return;
      helperKey = key; clearHelpers();
      if (p.options.plane) {
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(p.size, p.size), new THREE.MeshBasicMaterial({ color: '#70d9bc', transparent: true, opacity: 0.035, side: THREE.DoubleSide, depthWrite: false }));
        plane.rotation.x = -Math.PI / 2; plane.position.y = -0.48; helpers.add(plane);
        const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-p.size/2,0,-p.size/2),new THREE.Vector3(p.size/2,0,-p.size/2),new THREE.Vector3(p.size/2,0,p.size/2),new THREE.Vector3(-p.size/2,0,p.size/2)]),new THREE.LineBasicMaterial({color:'#4d927f',transparent:true,opacity:0.55})); helpers.add(outline);
      }
      if (p.options.grid) {
        const grid = new THREE.GridHelper(p.size, p.size, '#335f59', '#24413f'); grid.position.y = -0.49;
        (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = 0.36; helpers.add(grid);
      }
      if (p.options.axes) helpers.add(new THREE.AxesHelper(p.size * 0.65));
      if (p.options.guides) {
        const interval = depth > 150 ? 50 : depth > 60 ? 25 : 10;
        for (let id = Math.ceil((p.history[0]?.id ?? 0)/interval)*interval; id <= p.selected; id += interval) {
          const y = -(p.selected-id);
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-p.size/2-2,y,-p.size/2),new THREE.Vector3(-p.size/2-2,y,p.size/2)]), new THREE.LineBasicMaterial({color:'#42636b',transparent:true,opacity:0.45})); helpers.add(line);
          const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
          const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#9cb8bb'; ctx.font = '24px monospace'; ctx.fillText(`GEN ${id}`, 8, 40);
          const texture = new THREE.CanvasTexture(canvas);
          const label = new THREE.Sprite(new THREE.SpriteMaterial({map:texture, transparent:true, depthTest:false})); label.position.set(-p.size/2-7,y,p.size/2); label.scale.set(10,2.5,1); helpers.add(label);
        }
      }
    };
    runtime.current = { cubes, camera, controls, update };
    const resize = () => { dirty = true; camera.aspect = element.clientWidth / element.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(element.clientWidth, element.clientHeight); };
    const observer = new ResizeObserver(resize); observer.observe(element); resize(); update();
    frameCamera(camera, controls, new THREE.Box3(new THREE.Vector3(-props.size/2,-8,-props.size/2),new THREE.Vector3(props.size/2,0,props.size/2)), 'iso');
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const setRay = (event: PointerEvent) => { const rect = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1); raycaster.setFromCamera(pointer,camera); };
    let downX = 0, downY = 0, downButton = 0, dragging = false, lastHover = 0;
    const down = (event: PointerEvent) => { downX = event.clientX; downY = event.clientY; downButton = event.button; dragging = true; setHover(null); };
    const up = (event: PointerEvent) => {
      dragging = false;
      if (downButton !== 0 || Math.hypot(event.clientX-downX,event.clientY-downY)>4 || !latest.current.editable) return;
      setRay(event); const point = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),point)) return;
      const size = latest.current.size, x = Math.floor(point.x+size/2), z = Math.floor(point.z+size/2);
      if(x>=0 && x<size && z>=0 && z<size) latest.current.onEdit(z*size+x);
    };
    const move = (event: PointerEvent) => {
      if (dragging || performance.now()-lastHover<130) return; lastHover=performance.now(); setRay(event);
      const hits = raycaster.intersectObjects(cubes.group.children, false);
      const hit = hits[0];
      if (hit?.instanceId !== undefined) {
        const layer = hit.object.userData.generation as Generation;
        const rect = element.getBoundingClientRect();
        setHover({x:Math.min(event.clientX-rect.left+16,rect.width-230),y:Math.min(event.clientY-rect.top+16,rect.height-170),layer,index:layer.living[hit.instanceId]});
      } else setHover(null);
    };
    const leave = () => { dragging = false; setHover(null); };
    renderer.domElement.addEventListener('pointerdown',down); renderer.domElement.addEventListener('pointerup',up); renderer.domElement.addEventListener('pointermove',move); renderer.domElement.addEventListener('pointerleave',leave);
    let frame = 0, last = performance.now();
    const render = (time: number) => {
      const moving = cubes.animate(Math.min(0.1,(time-last)/1000),latest.current.options);
      last=time; controls.update();
      if (dirty || moving) { renderer.render(scene,camera); dirty=false; }
      frame=requestAnimationFrame(render);
    };
    frame=requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); cubes.dispose(); clearHelpers(); renderer.dispose(); renderer.domElement.remove(); runtime.current=null; };
  }, []);
  useEffect(() => { runtime.current?.update(); setHover(null); }, [props.revision, props.selected, props.size, props.options]);
  useEffect(() => {
    const r = runtime.current; if (!r || !props.cameraAction.serial) return;
    const box = props.editable ? new THREE.Box3(new THREE.Vector3(-props.size/2,-1,-props.size/2),new THREE.Vector3(props.size/2,0,props.size/2)) : r.cubes.bounds;
    frameCamera(r.camera,r.controls,box,props.cameraAction.view);
  }, [props.cameraAction]);
  return <div className="scene-host" ref={host} aria-label="Interactive 3D Conway history. Drag to orbit, scroll to zoom, right drag to pan.">
    {error && <div className="scene-warning">{error}</div>}
    {warning && <div className="scene-warning">{warning}</div>}
    {hover && <div className="cube-tooltip" style={{left:hover.x,top:hover.y}}><strong>Cell {hover.index%props.size}, {Math.floor(hover.index/props.size)}</strong>{props.showFactions && <span style={{color:teamInfo(hover.layer.factions[hover.index]).colour}}>{teamInfo(hover.layer.factions[hover.index]).name} faction</span>}<span>Generation {hover.layer.id} · Age {props.selected-hover.layer.id}</span><span>Alive · {hover.layer.id===0 ? 'Initial seed' : hover.layer.born[hover.index] ? 'Newborn' : 'Survivor'}</span><span>Neighbours {hover.layer.neighbours[hover.index]}{hover.layer.id === 0 ? ' (initial grid)' : ' (parent grid)'}</span></div>}
  </div>;
}
