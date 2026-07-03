import * as THREE from 'three';

// ─── Ambient world particles ──────────────────────────────────────────────────

const WORLD_AMBIENT = {
  forest: {
    color: 0x88ff66, count: 50,
    rangeXZ: 18, minY: 0.3, maxY: 2.8,
    size: 0.07, opacity: 0.7,
    drift: 0.006, rise: 0.007,
  },
  space: {
    color: 0x88bbff, count: 90,
    rangeXZ: 22, minY: 2, maxY: 10,
    size: 0.10, opacity: 0.55,
    drift: 0.002, rise: 0.002,
  },
  medieval: {
    color: 0xffd966, count: 35,
    rangeXZ: 18, minY: 0.4, maxY: 3.5,
    size: 0.065, opacity: 0.6,
    drift: 0.004, rise: 0.005,
  },
  volcano: {
    color: 0xff5500, count: 60,
    rangeXZ: 18, minY: 0.2, maxY: 4.5,
    size: 0.09, opacity: 0.65,
    drift: 0.007, rise: 0.010,
  },
};

export class ParticleSystem {
  constructor(scene) {
    this.scene    = scene;
    this._ambient = null;
    this._bursts  = [];
    this._t       = 0;
  }

  /** Load ambient particles for the given world. */
  loadAmbient(worldId) {
    this.clearAmbient();
    const cfg = WORLD_AMBIENT[worldId];
    if (!cfg) return;

    const count = cfg.count;
    const pos   = new Float32Array(count * 3);
    const vel   = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * cfg.rangeXZ;
      pos[i * 3 + 1] = cfg.minY + Math.random() * (cfg.maxY - cfg.minY);
      pos[i * 3 + 2] = (Math.random() - 0.5) * cfg.rangeXZ;
      vel.push({
        x: (Math.random() - 0.5) * cfg.drift,
        y: Math.random() * cfg.rise,
        z: (Math.random() - 0.5) * cfg.drift,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: cfg.color,
      size: cfg.size,
      transparent: true,
      opacity: cfg.opacity,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this._ambient = { points, vel, cfg, count };
  }

  /**
   * Spawn a burst of particles at (x, y, z) in the given color.
   * Call on item collection.
   */
  burst(x, y, z, color) {
    const count = 18;
    const pos   = new Float32Array(count * 3); // all start at 0
    const geo   = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color,
      size: 0.18,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    points.position.set(x, y, z);
    this.scene.add(points);

    const vel = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 0.14,
      y: Math.random() * 0.12 + 0.05,
      z: (Math.random() - 0.5) * 0.14,
    }));

    this._bursts.push({ points, mat, vel, life: 1.0 });
  }

  /** Update each frame. dt ≈ 0.016 */
  update(dt) {
    this._t += dt;

    // ── Ambient ──────────────────────────────────────────────────────────────
    if (this._ambient) {
      const { points, vel, cfg, count } = this._ambient;
      const pos = points.geometry.attributes.position.array;

      for (let i = 0; i < count; i++) {
        pos[i * 3]     += vel[i].x + Math.sin(this._t * 0.9 + i) * 0.002;
        pos[i * 3 + 1] += vel[i].y;
        pos[i * 3 + 2] += vel[i].z + Math.cos(this._t * 0.7 + i) * 0.002;

        // Wrap height
        if (pos[i * 3 + 1] > cfg.maxY) {
          pos[i * 3 + 1] = cfg.minY;
          pos[i * 3]     = (Math.random() - 0.5) * cfg.rangeXZ;
          pos[i * 3 + 2] = (Math.random() - 0.5) * cfg.rangeXZ;
        }
        // Bounce XZ
        if (Math.abs(pos[i * 3])     > cfg.rangeXZ / 2) vel[i].x *= -1;
        if (Math.abs(pos[i * 3 + 2]) > cfg.rangeXZ / 2) vel[i].z *= -1;
      }
      points.geometry.attributes.position.needsUpdate = true;
    }

    // ── Bursts ───────────────────────────────────────────────────────────────
    this._bursts = this._bursts.filter((b) => {
      b.life -= dt * 1.6;
      if (b.life <= 0) {
        this.scene.remove(b.points);
        b.mat.dispose();
        b.points.geometry.dispose();
        return false;
      }
      const pos = b.points.geometry.attributes.position.array;
      for (let i = 0; i < b.vel.length; i++) {
        b.vel[i].y -= 0.004; // gravity drag
        pos[i * 3]     += b.vel[i].x;
        pos[i * 3 + 1] += b.vel[i].y;
        pos[i * 3 + 2] += b.vel[i].z;
      }
      b.points.geometry.attributes.position.needsUpdate = true;
      b.mat.opacity = Math.max(0, b.life);
      b.mat.size    = 0.18 * (0.5 + b.life * 0.5);
      return true;
    });
  }

  clearAmbient() {
    if (this._ambient) {
      this.scene.remove(this._ambient.points);
      this._ambient.points.geometry.dispose();
      this._ambient.points.material.dispose();
      this._ambient = null;
    }
  }

  dispose() {
    this.clearAmbient();
    for (const b of this._bursts) {
      this.scene.remove(b.points);
      b.mat.dispose();
      b.points.geometry.dispose();
    }
    this._bursts = [];
  }
}
