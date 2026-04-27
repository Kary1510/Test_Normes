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
    this.scene  = scene;
    this.items  = new Map();
    this.portal = null;
    this.portalLight = null;
    this.portalRingMesh = null;
    this._t = 0;
  }

  load(worldId, collectedKeys = new Set()) {
    this.clear();
    const world = WORLDS[worldId];
    const map   = world.tilemap;
    const itemTex = makeEmojiTexture(world.itemEmoji, 128);

    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        const tile = map[r][c];
        const x = c * TILE_SIZE;
        const z = r * TILE_SIZE;
        const key = `${worldId}_${c}_${r}`;

        if (tile === '4' && !collectedKeys.has(key)) {
          this._addItem(key, x, z, world.ic, world.pc, itemTex);
        } else if (tile === '3') {
          this._addPortal(x, z, world.pc);
        }
      }
    }
  }

  _addItem(key, x, z, itemColor, glowColor, tex) {
    // Emoji sprite
    const mat  = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Sprite(mat);
    mesh.scale.set(0.58, 0.58, 0.58);
    mesh.position.set(x, 1.0, z);
    this.scene.add(mesh);

    // Ground glow ring
    const ringGeo = new THREE.TorusGeometry(0.28, 0.028, 6, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: itemColor, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.02, z);
    this.scene.add(ring);

    // Point light
    const light = new THREE.PointLight(itemColor, 0.9, 1.8);
    light.position.set(x, 1.0, z);
    this.scene.add(light);

    this.items.set(key, { mesh, ring, ringMat, light, collected: false, baseY: 1.0 });
  }

  _addPortal(x, z, color) {
    const group = new THREE.Group();

    // Outer spinning ring
    const outerRingGeo = new THREE.TorusGeometry(0.72, 0.07, 10, 48);
    const outerRingMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2;

    // Inner ring (counter-rotating)
    const innerRingGeo = new THREE.TorusGeometry(0.48, 0.045, 8, 36);
    const innerRingMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;

    // Translucent portal disc
    const discGeo = new THREE.CircleGeometry(0.64, 48);
    const discMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.18, side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;

    // Swirl emoji above
    const spriteMat = new THREE.SpriteMaterial({ map: makeEmojiTexture('🌀', 128), transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.65, 0.65, 0.65);
    sprite.position.y = 1.0;

    // Energy orbs orbiting the portal
    const orbMat = new THREE.MeshBasicMaterial({ color });
    for (let i = 0; i < 4; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), orbMat);
      const a = (i / 4) * Math.PI * 2;
      orb.position.set(Math.cos(a) * 0.72, 0, Math.sin(a) * 0.72);
      orb.userData.orbAngle = a;
      group.add(orb);
    }

    group.add(outerRing, innerRing, disc, sprite);
    group.position.set(x, 0.18, z);
    group.userData = { x, z };
    this.scene.add(group);

    this.portal         = group;
    this.portalRingMesh = { outer: outerRing, inner: innerRing, discMat };
    this.portalLight    = new THREE.PointLight(color, 2.2, 4.0);
    this.portalLight.position.set(x, 0.9, z);
    this.scene.add(this.portalLight);
  }

  update(t) {
    this._t = t;

    // Animate items — float + ring pulse
    for (const [, item] of this.items) {
      if (!item.collected) {
        item.mesh.position.y = item.baseY + Math.sin(t * 2.2) * 0.13;
        item.ringMat.opacity = 0.35 + Math.sin(t * 3) * 0.25;
        item.ring.scale.setScalar(0.9 + Math.sin(t * 2) * 0.1);
      }
    }

    // Animate portal
    if (this.portal && this.portalRingMesh) {
      const { outer, inner, discMat } = this.portalRingMesh;
      outer.rotation.z = t * 1.4;
      inner.rotation.z = -t * 2.1;
      discMat.opacity  = 0.12 + Math.sin(t * 2.5) * 0.08;
      this.portal.position.y = 0.18 + Math.sin(t * 1.3) * 0.07;

      // Orbit energy orbs
      this.portal.children.forEach((child) => {
        if (child.userData.orbAngle !== undefined) {
          const a = child.userData.orbAngle + t * 2.2;
          child.position.set(Math.cos(a) * 0.72, Math.sin(t * 2 + child.userData.orbAngle) * 0.15, Math.sin(a) * 0.72);
        }
      });
    }
    if (this.portalLight) {
      this.portalLight.intensity = 2.0 + Math.sin(t * 3.5) * 0.4;
    }
  }

  checkProximity(px, pz) {
    for (const [key, item] of this.items) {
      if (item.collected) continue;
      const dx = item.mesh.position.x - px;
      const dz = item.mesh.position.z - pz;
      if (Math.sqrt(dx * dx + dz * dz) < 0.65) return { type: 'item', key };
    }
    if (this.portal) {
      const { x, z } = this.portal.userData;
      const dx = x - px;
      const dz = z - pz;
      if (Math.sqrt(dx * dx + dz * dz) < 1.1) return { type: 'portal' };
    }
    return null;
  }

  collect(key) {
    const item = this.items.get(key);
    if (!item || item.collected) return false;
    item.collected = true;
    this.scene.remove(item.mesh);
    this.scene.remove(item.ring);
    this.scene.remove(item.light);
    item.mesh.material.dispose();
    item.ringMat.dispose();
    return true;
  }

  getItemPosition(key) {
    const item = this.items.get(key);
    if (!item) return null;
    return item.mesh.position.clone();
  }

  clear() {
    for (const [, item] of this.items) {
      this.scene.remove(item.mesh);
      this.scene.remove(item.ring);
      this.scene.remove(item.light);
      if (item.mesh.material.map) item.mesh.material.map.dispose();
      item.mesh.material.dispose();
      item.ringMat.dispose();
    }
    this.items.clear();

    if (this.portal) {
      this.scene.remove(this.portal);
      this.portal.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      this.portal = null;
      this.portalRingMesh = null;
    }
    if (this.portalLight) {
      this.scene.remove(this.portalLight);
      this.portalLight = null;
    }
  }
}
