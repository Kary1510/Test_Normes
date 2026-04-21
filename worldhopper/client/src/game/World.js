import * as THREE from 'three';
import { WORLDS, TILE_SIZE } from './constants.js';

const WALL_HEIGHT = 1.6;
const FLOOR_THICK = 0.18;

export class World {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.voidTiles = new Set(); // "col,row" keys
    this.currentWorldId = null;
  }

  /** Build (or rebuild) the scene for a given worldId. */
  load(worldId) {
    this.clear();
    this.currentWorldId = worldId;
    const world = WORLDS[worldId];
    const map = world.tilemap;
    const rows = map.length;
    const cols = map[0].length;

    // Fog
    this.scene.fog = new THREE.FogExp2(world.fog, world.fogDensity);
    this.scene.background = new THREE.Color(world.sky);

    // Reusable geometries / materials per tile type
    const floorGeo  = new THREE.BoxGeometry(TILE_SIZE, FLOOR_THICK, TILE_SIZE);
    const wallGeo   = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
    const floorMat  = new THREE.MeshLambertMaterial({ color: world.fc });
    const wallMat   = new THREE.MeshLambertMaterial({ color: world.wc });

    // Lava / void floor for vol / space visual
    const dangerMat = world.voidDanger
      ? new THREE.MeshLambertMaterial({ color: worldId === 'volcano' ? 0xff3300 : 0x001133, emissive: worldId === 'volcano' ? 0xff1100 : 0x002266, emissiveIntensity: 0.5 })
      : null;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = map[r][c];
        const x = c * TILE_SIZE;
        const z = r * TILE_SIZE;

        if (tile === '0') {
          this._addMesh(floorGeo, floorMat, x, -FLOOR_THICK / 2, z);
        } else if (tile === '1') {
          // floor below wall
          this._addMesh(floorGeo, floorMat, x, -FLOOR_THICK / 2, z);
          // wall block
          const wall = this._addMesh(wallGeo, wallMat, x, WALL_HEIGHT / 2, z);
          wall.castShadow = true;
        } else if (tile === '2') {
          // void/danger — visual only for voidDanger worlds, nothing walkable
          this.voidTiles.add(`${c},${r}`);
          if (dangerMat) {
            this._addMesh(floorGeo, dangerMat, x, -FLOOR_THICK / 2 - 0.1, z);
          }
        } else if (tile === '3') {
          // portal tile — just add floor; Items.js will add portal object
          this._addMesh(floorGeo, floorMat, x, -FLOOR_THICK / 2, z);
        } else if (tile === '4') {
          // item tile — add floor; Items.js will add floating collectible
          this._addMesh(floorGeo, floorMat, x, -FLOOR_THICK / 2, z);
        }
      }
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
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left  = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top   = 20;
    sun.shadow.camera.bottom = -20;
    this.scene.add(sun);
    this.meshes.push(sun);

    return { rows, cols };
  }

  _addMesh(geo, mat, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.meshes.push(mesh);
    return mesh;
  }

  /** Returns true if the tile at world-position (x, z) is walkable floor. */
  isWalkable(x, z) {
    const world = WORLDS[this.currentWorldId];
    const map   = world.tilemap;
    const col = Math.round(x / TILE_SIZE);
    const row = Math.round(z / TILE_SIZE);
    if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return false;
    const t = map[row][col];
    return t === '0' || t === '3' || t === '4';
  }

  /** Returns true if tile is a void/danger (fall) tile. */
  isVoid(x, z) {
    const col = Math.round(x / TILE_SIZE);
    const row = Math.round(z / TILE_SIZE);
    return this.voidTiles.has(`${col},${row}`);
  }

  clear() {
    for (const obj of this.meshes) {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
    this.meshes = [];
    this.voidTiles.clear();
  }
}
