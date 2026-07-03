import * as THREE from 'three';
import { WORLDS, TILE_SIZE } from './constants.js';

const WALL_HEIGHT = 1.6;
const FLOOR_THICK = 0.18;

// ─── Themed wall decorations ──────────────────────────────────────────────────

function makeForestTree(dark) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d1a00 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.55, 7), trunkMat);
  trunk.position.y = 0.28;
  trunk.castShadow = true;
  g.add(trunk);

  const shades = dark
    ? [0x163d1c, 0x1a5022, 0x145428]
    : [0x236b2c, 0x2d8a38, 0x1f7030];
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.50 - i * 0.09, 0.58, 7),
      new THREE.MeshLambertMaterial({ color: shades[i] })
    );
    cone.position.y = 0.55 + i * 0.34;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

function makeSpaceCrystal() {
  const g = new THREE.Group();
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x070712 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.65, 6), baseMat);
  base.position.y = 0.33;
  base.castShadow = true;

  const crystalMat = new THREE.MeshLambertMaterial({
    color: 0x1a3a7a, emissive: 0x0a1a44, emissiveIntensity: 0.6,
  });
  // Main shard
  const main = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), crystalMat);
  main.position.y = 0.92;
  main.rotation.y = Math.random() * Math.PI;
  main.castShadow = true;

  // Two side shards
  for (let i = 0; i < 2; i++) {
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(0.10, 0.44, 5),
      new THREE.MeshLambertMaterial({ color: 0x0d2255, emissive: 0x06113a, emissiveIntensity: 0.5 })
    );
    shard.position.set(i === 0 ? -0.22 : 0.22, 0.72, 0.1);
    shard.rotation.z = i === 0 ? 0.4 : -0.4;
    shard.castShadow = true;
    g.add(shard);
  }

  const glow = new THREE.PointLight(0x4488ff, 0.6, 1.8);
  glow.position.y = 1.0;
  g.add(base, main, glow);
  return g;
}

function makeMedievalTower() {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x6a5a3a });
  const darkMat  = new THREE.MeshLambertMaterial({ color: 0x4a3a22 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.3, 8), stoneMat);
  body.position.y = 0.65;
  body.castShadow = true;

  // Battlement merlons
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.11), darkMat);
    m.position.set(Math.cos(a) * 0.24, 1.42, Math.sin(a) * 0.24);
    m.castShadow = true;
    g.add(m);
  }

  // Conical roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.38, 8),
    new THREE.MeshLambertMaterial({ color: 0x8b1a1a })
  );
  roof.position.y = 1.61;
  roof.castShadow = true;

  // Flag pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.45, 4),
    new THREE.MeshLambertMaterial({ color: 0xd4aa44 })
  );
  pole.position.y = 1.95;
  g.add(body, roof, pole);
  return g;
}

function makeVolcanoRock() {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshLambertMaterial({
    color: 0x1a0800, emissive: 0x3d0800, emissiveIntensity: 0.3,
  });
  const configs = [
    { r: 0.36, y: 0.28, ox: 0,     oz: 0,    ry: 0.4 },
    { r: 0.22, y: 0.22, ox: -0.28, oz: 0.1,  ry: 1.1 },
    { r: 0.18, y: 0.18, ox: 0.25,  oz: -0.1, ry: 0.8 },
  ];
  for (const c of configs) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 0), rockMat);
    rock.position.set(c.ox, c.y, c.oz);
    rock.rotation.set(c.ry, c.ry * 1.3, c.ry * 0.7);
    rock.castShadow = true;
    g.add(rock);
  }
  const glow = new THREE.PointLight(0xff2200, 0.5, 1.4);
  glow.position.y = 0.3;
  g.add(glow);
  return g;
}

// ─── Star field (space only) ──────────────────────────────────────────────────
function makeStarField() {
  const count = 600;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 120;
    pos[i * 3 + 1] = Math.random() * 35 + 4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, sizeAttenuation: true, transparent: true, opacity: 0.9 });
  return new THREE.Points(geo, mat);
}

// ─── World class ──────────────────────────────────────────────────────────────
export class World {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.voidTiles = new Set();
    this.lavaMats = [];
    this.currentWorldId = null;
  }

  load(worldId) {
    this.clear();
    this.currentWorldId = worldId;
    const world = WORLDS[worldId];
    const map   = world.tilemap;
    const rows  = map.length;
    const cols  = map[0].length;

    this.scene.fog        = new THREE.FogExp2(world.fog, world.fogDensity);
    this.scene.background = new THREE.Color(world.sky);

    const floorGeo = new THREE.BoxGeometry(TILE_SIZE, FLOOR_THICK, TILE_SIZE);
    const floorMat = new THREE.MeshLambertMaterial({ color: world.fc });

    const lavaMat = world.voidDanger && worldId === 'volcano'
      ? new THREE.MeshLambertMaterial({ color: 0xcc2200, emissive: 0xff1100, emissiveIntensity: 0.7 })
      : null;
    const voidMat = world.voidDanger && worldId === 'space'
      ? new THREE.MeshLambertMaterial({ color: 0x000820 })
      : null;

    if (lavaMat) this.lavaMats.push(lavaMat);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = map[r][c];
        const x = c * TILE_SIZE;
        const z = r * TILE_SIZE;

        if (tile === '0' || tile === '3' || tile === '4') {
          // Slight floor shade variation for texture feel
          const shade = (r + c) % 2 === 0
            ? floorMat
            : new THREE.MeshLambertMaterial({ color: new THREE.Color(world.fc).lerp(new THREE.Color(0x000000), 0.06) });
          this._addFloor(floorGeo, shade, x, z);

        } else if (tile === '1') {
          this._addFloor(floorGeo, floorMat, x, z);
          this._addDecoration(worldId, x, z);

        } else if (tile === '2') {
          this.voidTiles.add(`${c},${r}`);
          if (lavaMat) {
            const m = this._addFloor(floorGeo, lavaMat, x, z);
            m.position.y = -FLOOR_THICK / 2 - 0.08;
          } else if (voidMat) {
            this._addFloor(floorGeo, voidMat, x, z);
          }
        }
      }
    }

    // Star field for space
    if (worldId === 'space') {
      const stars = makeStarField();
      this.scene.add(stars);
      this.meshes.push(stars);
    }

    // Ambient light
    const ambient = new THREE.AmbientLight(world.amb, 1.0);
    this.scene.add(ambient);
    this.meshes.push(ambient);

    // Directional sun
    const sun = new THREE.DirectionalLight(world.sun, world.sunInt);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near   = 0.5;
    sun.shadow.camera.far    = 60;
    sun.shadow.camera.left   = -20;
    sun.shadow.camera.right  = 20;
    sun.shadow.camera.top    = 20;
    sun.shadow.camera.bottom = -20;
    this.scene.add(sun);
    this.meshes.push(sun);

    return { rows, cols };
  }

  _addFloor(geo, mat, x, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, -FLOOR_THICK / 2, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.meshes.push(mesh);
    return mesh;
  }

  _addDecoration(worldId, x, z) {
    let group;
    switch (worldId) {
      case 'forest':   group = makeForestTree(Math.random() > 0.5); break;
      case 'space':    group = makeSpaceCrystal(); break;
      case 'medieval': group = makeMedievalTower(); break;
      case 'volcano':  group = makeVolcanoRock(); break;
      default:         return;
    }
    group.position.set(x, 0, z);
    // Slight random rotation for variety
    group.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);
    this.scene.add(group);
    this.meshes.push(group);
  }

  animateLava(t) {
    for (const mat of this.lavaMats) {
      mat.emissiveIntensity = 0.5 + Math.sin(t * 2.5) * 0.25;
    }
  }

  isWalkable(x, z) {
    const world = WORLDS[this.currentWorldId];
    const map   = world.tilemap;
    const col = Math.round(x / TILE_SIZE);
    const row = Math.round(z / TILE_SIZE);
    if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return false;
    const t = map[row][col];
    return t === '0' || t === '3' || t === '4';
  }

  isVoid(x, z) {
    const col = Math.round(x / TILE_SIZE);
    const row = Math.round(z / TILE_SIZE);
    return this.voidTiles.has(`${col},${row}`);
  }

  clear() {
    for (const obj of this.meshes) {
      this.scene.remove(obj);
      if (obj.traverse) {
        obj.traverse((c) => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      } else {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    }
    this.meshes = [];
    this.voidTiles.clear();
    this.lavaMats = [];
  }
}
