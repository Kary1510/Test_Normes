import * as THREE from 'three';
import { World }          from './World.js';
import { Player, RemotePlayer } from './Player.js';
import { GameCamera }     from './Camera.js';
import { ItemsManager }   from './Items.js';
import { ParticleSystem } from './Particles.js';
import { WORLDS, EV }     from './constants.js';

export class GameEngine {
  constructor({ canvas, skinId, worldId, socket, onCollect, onWorldChange, onToast }) {
    this.canvas          = canvas;
    this.socket          = socket;
    this.onCollect       = onCollect;
    this.onWorldChange   = onWorldChange;
    this.onToast         = onToast;
    this._collectedKeys  = new Set();
    this._remotePlayers  = new Map();
    this._raf            = null;
    this._t              = 0;
    this._lastEmit       = 0;

    // ── Renderer ─────────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled   = true;
    this.renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // ── Scene objects ─────────────────────────────────────────────────────────
    this.scene     = new THREE.Scene();
    this.camCtrl   = new GameCamera(this.renderer);
    this.world     = new World(this.scene);
    this.items     = new ItemsManager(this.scene);
    this.particles = new ParticleSystem(this.scene);
    this.player    = new Player(this.scene, this.world, skinId);

    this._loadWorld(worldId);
    this._bindResize();
    this._bindSocket();
    this._loop();
  }

  _loadWorld(worldId) {
    this._currentWorldId = worldId;
    this.world.load(worldId);
    this.items.load(worldId, this._collectedKeys);
    this.particles.loadAmbient(worldId);

    // Spawn player at first open floor tile
    const map = WORLDS[worldId].tilemap;
    for (let r = 1; r < map.length - 1; r++) {
      for (let c = 1; c < map[r].length - 1; c++) {
        if (map[r][c] === '0') {
          this.player.position.set(c, 0.8, r);
          this.player.setRespawn(c, 0.8, r);
          return;
        }
      }
    }
  }

  _bindResize() {
    this._onResize = () => {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      this.renderer.setSize(w, h, false);
      this.camCtrl.onResize(w, h);
    };
    window.addEventListener('resize', this._onResize);
  }

  _bindSocket() {
    if (!this.socket) return;

    this.socket.on(EV.MOVE, (data) => {
      if (data.worldId !== this._currentWorldId) return;
      let rp = this._remotePlayers.get(data.id);
      if (!rp) {
        rp = new RemotePlayer(this.scene, data);
        this._remotePlayers.set(data.id, rp);
      }
      rp.moveTo(data.x, data.y, data.z, data.rotY);
    });

    this.socket.on(EV.LEAVE, (data) => {
      const rp = this._remotePlayers.get(data.id);
      if (rp) { rp.dispose(); this._remotePlayers.delete(data.id); }
    });

    this.socket.on(EV.WORLD, (data) => {
      const rp = this._remotePlayers.get(data.id);
      if (rp && data.worldId !== this._currentWorldId) {
        rp.dispose();
        this._remotePlayers.delete(data.id);
      }
    });

    this.socket.on(EV.COLLECT, (data) => {
      this.items.collect(data.itemKey);
      this._collectedKeys.add(data.itemKey);
    });

    this.socket.on(EV.STATE, (data) => {
      if (data.worldId === this._currentWorldId) {
        for (const key of data.collectedKeys || []) {
          this.items.collect(key);
          this._collectedKeys.add(key);
        }
      }
    });
  }

  setDpad(dpad) {
    if (this.player) Object.assign(this.player.dpad, dpad);
  }

  changeSkin(skinId) {
    this.player?.changeSkin(skinId);
  }

  travelToWorld(worldId) {
    if (worldId === this._currentWorldId) return;

    for (const rp of this._remotePlayers.values()) rp.dispose();
    this._remotePlayers.clear();

    this.player.scene.remove(this.player.group);
    this._loadWorld(worldId);
    this.scene.add(this.player.group);

    this.onWorldChange?.(worldId);
    if (this.socket) {
      this.socket.emit(EV.WORLD, { worldId });
      this.socket.emit(EV.JOIN,  { worldId, skinId: this.player.skinId });
    }
    this.onToast?.(`🌀 Bienvenue en ${WORLDS[worldId].label} !`);
  }

  _loop = () => {
    this._raf = requestAnimationFrame(this._loop);
    const dt = 0.016;
    this._t += dt;

    // Update player
    this.player.update();

    // Item / portal proximity
    const px = this.player.position.x;
    const pz = this.player.position.z;
    const hit = this.items.checkProximity(px, pz);
    if (hit) {
      if (hit.type === 'item') {
        const pos = this.items.getItemPosition(hit.key);
        const ok  = this.items.collect(hit.key);
        if (ok) {
          this._collectedKeys.add(hit.key);
          const val   = WORLDS[this._currentWorldId].itemValue;
          const color = WORLDS[this._currentWorldId].ic;
          // Particle burst at item position
          if (pos) this.particles.burst(pos.x, pos.y, pos.z, color);
          this.onCollect?.(hit.key, val);
          if (this.socket) this.socket.emit(EV.COLLECT, { itemKey: hit.key });
        }
      } else if (hit.type === 'portal') {
        const next = WORLDS[this._currentWorldId].nextWorld;
        this.travelToWorld(next);
      }
    }

    // Animate items, portal, lava, particles
    this.items.update(this._t);
    this.world.animateLava(this._t);
    this.particles.update(dt);

    // Remote players
    for (const rp of this._remotePlayers.values()) rp.update();

    // Camera
    this.camCtrl.follow(this.player.position);

    // Emit position ~20×/sec
    const now = performance.now();
    if (this.socket && now - this._lastEmit > 50) {
      this._lastEmit = now;
      const s = this.player.getState();
      this.socket.emit(EV.MOVE, { ...s, worldId: this._currentWorldId });
    }

    this.renderer.render(this.scene, this.camCtrl.three);
  };

  get currentWorldId() { return this._currentWorldId; }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.player.dispose();
    this.world.clear();
    this.items.clear();
    this.particles.dispose();
    for (const rp of this._remotePlayers.values()) rp.dispose();
    this._remotePlayers.clear();
    this.renderer.dispose();
  }
}
