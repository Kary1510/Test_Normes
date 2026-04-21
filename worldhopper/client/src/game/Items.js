import * as THREE from 'three';
import { WORLDS, TILE_SIZE } from './constants.js';

function makeEmojiTexture(emoji, size = 96) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.font = `${size * 0.72}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export class ItemsManager {
  constructor(scene) {
    this.scene   = scene;
    this.items   = new Map();  // key → { mesh, light, collected }
    this.portal  = null;
    this.portalLight = null;
    this._t = 0;
  }

  /** Scan tilemap and build all items + portal for the given world. */
  load(worldId, collectedKeys = new Set()) {
    this.clear();
    const world = WORLDS[worldId];
    const map   = world.tilemap;

    const itemTex   = makeEmojiTexture(world.itemEmoji);
    const portalTex = makeEmojiTexture('🌀');

    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        const tile = map[r][c];
        const x = c * TILE_SIZE;
        const z = r * TILE_SIZE;
        const key = `${worldId}_${c}_${r}`;

        if (tile === '4' && !collectedKeys.has(key)) {
          this._addItem(key, x, z, world.ic, itemTex);
        } else if (tile === '3') {
          this._addPortal(x, z, world.pc, portalTex);
        }
      }
    }
  }

  _addItem(key, x, z, color, tex) {
    const mat  = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Sprite(mat);
    mesh.scale.set(0.55, 0.55, 0.55);
    mesh.position.set(x, 0.9, z);
    this.scene.add(mesh);

    const light = new THREE.PointLight(color, 0.9, 1.8);
    light.position.set(x, 0.9, z);
    this.scene.add(light);

    this.items.set(key, { mesh, light, collected: false });
  }

  _addPortal(x, z, color, tex) {
    const mat  = new THREE.SpriteMaterial({ map: tex, transparent: true });
    this.portal = new THREE.Sprite(mat);
    this.portal.scale.set(1.1, 1.1, 1.1);
    this.portal.position.set(x, 1.1, z);
    this.portal.userData = { x, z };
    this.scene.add(this.portal);

    this.portalLight = new THREE.PointLight(color, 2.0, 3.5);
    this.portalLight.position.set(x, 1.0, z);
    this.scene.add(this.portalLight);
  }

  /** Animate floating + spin. Call each frame with elapsed time. */
  update(t) {
    this._t = t;
    for (const [, item] of this.items) {
      if (!item.collected) {
        item.mesh.position.y = 0.9 + Math.sin(t * 2.2) * 0.12;
      }
    }
    if (this.portal) {
      this.portal.position.y = 1.1 + Math.sin(t * 1.4) * 0.08;
      this.portal.material.rotation = t * 1.2;
    }
    if (this.portalLight) {
      this.portalLight.intensity = 1.8 + Math.sin(t * 3) * 0.3;
    }
  }

  /**
   * Check proximity to player position.
   * Returns { type: 'item'|'portal', key? } or null.
   */
  checkProximity(px, pz) {
    // Items
    for (const [key, item] of this.items) {
      if (item.collected) continue;
      const dx = item.mesh.position.x - px;
      const dz = item.mesh.position.z - pz;
      if (Math.sqrt(dx * dx + dz * dz) < 0.65) {
        return { type: 'item', key };
      }
    }
    // Portal
    if (this.portal) {
      const { x, z } = this.portal.userData;
      const dx = x - px;
      const dz = z - pz;
      if (Math.sqrt(dx * dx + dz * dz) < 1.1) {
        return { type: 'portal' };
      }
    }
    return null;
  }

  /** Mark item as collected (hide it). */
  collect(key) {
    const item = this.items.get(key);
    if (!item || item.collected) return false;
    item.collected = true;
    this.scene.remove(item.mesh);
    this.scene.remove(item.light);
    item.mesh.material.dispose();
    return true;
  }

  clear() {
    for (const [, item] of this.items) {
      this.scene.remove(item.mesh);
      this.scene.remove(item.light);
      if (item.mesh.material.map) item.mesh.material.map.dispose();
      item.mesh.material.dispose();
    }
    this.items.clear();

    if (this.portal) {
      this.scene.remove(this.portal);
      if (this.portal.material.map) this.portal.material.map.dispose();
      this.portal.material.dispose();
      this.portal = null;
    }
    if (this.portalLight) {
      this.scene.remove(this.portalLight);
      this.portalLight = null;
    }
  }
}
