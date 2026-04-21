import * as THREE from 'three';
import { SKINS, GRAVITY, JUMP_SPEED, MOVE_SPEED, PLAYER_RADIUS, RESPAWN_Y, TILE_SIZE } from './constants.js';

function makeEmojiTexture(emoji) {
  const size = 128;
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

export class Player {
  constructor(scene, worldRef, skinId = 'default') {
    this.scene    = scene;
    this.worldRef = worldRef; // World instance
    this.skinId   = skinId;

    // Physics state
    this.position = new THREE.Vector3(3, 0.8, 3);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.onGround = false;
    this.respawnPos = new THREE.Vector3(3, 0.8, 3);

    // Walk animation
    this.walkCycle = 0;

    // Input
    this.keys = {};
    this._onKey = (e) => { this.keys[e.code] = e.type === 'keydown'; };
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup',   this._onKey);

    // Mobile dpad state (set externally)
    this.dpad = { left: false, right: false, up: false, down: false, jump: false };

    this._buildMesh(skinId);
  }

  _buildMesh(skinId) {
    const skin = SKINS[skinId] || SKINS.default;
    const color = skin.color;

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.27, 0.30, 0.85, 10);
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = true;
    this.body.position.y = 0.425;

    // Head
    const headGeo = new THREE.SphereGeometry(0.28, 12, 10);
    const headMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.3) });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.castShadow = true;
    this.head.position.y = 1.10;

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.45, 8);
    const legMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0x000000), 0.3) });
    this.legL = new THREE.Mesh(legGeo, legMat);
    this.legR = new THREE.Mesh(legGeo, legMat);
    this.legL.castShadow = true;
    this.legR.castShadow = true;
    this.legL.position.set(-0.14, -0.225, 0);
    this.legR.position.set( 0.14, -0.225, 0);

    // Emoji sprite above head
    const spriteMat = new THREE.SpriteMaterial({ map: makeEmojiTexture(skin.emoji), transparent: true });
    this.sprite = new THREE.Sprite(spriteMat);
    this.sprite.scale.set(0.7, 0.7, 0.7);
    this.sprite.position.y = 1.60;

    // Point light (skin glow)
    this.light = new THREE.PointLight(color, 0.7, 2.5);
    this.light.position.y = 0.8;

    // Group
    this.group = new THREE.Group();
    this.group.add(this.body, this.head, this.legL, this.legR, this.sprite, this.light);
    this.scene.add(this.group);
  }

  changeSkin(skinId) {
    if (skinId === this.skinId) return;
    this.skinId = skinId;
    // remove old group
    this.scene.remove(this.group);
    this.group.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (c.material.map) c.material.map.dispose();
        c.material.dispose();
      }
    });
    this._buildMesh(skinId);
    this.group.position.copy(this.position);
  }

  update(dt) {
    const isMoving = this._applyInput();
    this._applyGravity();
    this._resolveCollisions();
    this._animate(isMoving);
    this.group.position.copy(this.position);

    // Respawn if fallen too far
    if (this.position.y < RESPAWN_Y) {
      this.respawn();
    }
  }

  _applyInput() {
    const left  = this.keys['KeyA'] || this.keys['ArrowLeft']  || this.dpad.left;
    const right = this.keys['KeyD'] || this.keys['ArrowRight'] || this.dpad.right;
    const fwd   = this.keys['KeyW'] || this.keys['ArrowUp']    || this.dpad.up;
    const back  = this.keys['KeyS'] || this.keys['ArrowDown']  || this.dpad.down;
    const jump  = this.keys['Space'] || this.dpad.jump;

    let dx = 0, dz = 0;
    if (left)  dx -= 1;
    if (right) dx += 1;
    if (fwd)   dz -= 1;
    if (back)  dz += 1;

    // Normalize diagonal
    if (dx !== 0 && dz !== 0) {
      dx *= 0.7071;
      dz *= 0.7071;
    }

    this.velocity.x = dx * MOVE_SPEED;
    this.velocity.z = dz * MOVE_SPEED;

    if (jump && this.onGround) {
      this.velocity.y = JUMP_SPEED;
      this.onGround = false;
    }

    // Face direction of movement
    if (dx !== 0 || dz !== 0) {
      this.group.rotation.y = Math.atan2(dx, dz);
    }

    return dx !== 0 || dz !== 0;
  }

  _applyGravity() {
    if (!this.onGround) {
      this.velocity.y += GRAVITY;
    }
  }

  _resolveCollisions() {
    const r = PLAYER_RADIUS;
    const nextX = this.position.x + this.velocity.x;
    const nextZ = this.position.z + this.velocity.z;
    const nextY = this.position.y + this.velocity.y;

    // Horizontal collision — check X and Z independently with two probe points
    const canMoveX = this._canStep(nextX, this.position.z, r);
    const canMoveZ = this._canStep(this.position.x, nextZ, r);

    if (canMoveX) this.position.x = nextX;
    else this.velocity.x = 0;

    if (canMoveZ) this.position.z = nextZ;
    else this.velocity.z = 0;

    // Vertical collision — simple ground check at y = 0
    if (nextY <= 0.001) {
      this.position.y = 0.001;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.position.y = nextY;
      this.onGround = false;
    }
  }

  _canStep(x, z, r) {
    // Check 4 probe corners around player radius
    const probes = [
      [x + r, z + r],
      [x + r, z - r],
      [x - r, z + r],
      [x - r, z - r],
    ];
    for (const [px, pz] of probes) {
      if (!this.worldRef.isWalkable(px, pz)) return false;
    }
    return true;
  }

  _animate(isMoving) {
    if (isMoving && this.onGround) {
      this.walkCycle += 0.18;
      const swing = Math.sin(this.walkCycle) * 0.4;
      this.legL.rotation.x =  swing;
      this.legR.rotation.x = -swing;
      this.body.position.y = 0.425 + Math.sin(this.walkCycle * 2) * 0.018;
    } else {
      this.legL.rotation.x *= 0.8;
      this.legR.rotation.x *= 0.8;
      this.body.position.y += (0.425 - this.body.position.y) * 0.15;
    }
  }

  respawn() {
    this.position.copy(this.respawnPos);
    this.velocity.set(0, 0, 0);
    this.onGround = false;
  }

  setRespawn(x, y, z) {
    this.respawnPos.set(x, y, z);
  }

  getState() {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      rotY: this.group.rotation.y,
    };
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup',   this._onKey);
    this.scene.remove(this.group);
    this.group.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (c.material.map) c.material.map.dispose();
        c.material.dispose();
      }
    });
  }
}

// ─── Remote player (other users) ─────────────────────────────────────────────
export class RemotePlayer {
  constructor(scene, data) {
    this.scene  = scene;
    this.id     = data.id;
    this.target = new THREE.Vector3(data.x ?? 3, data.y ?? 0.8, data.z ?? 3);

    const skin  = SKINS[data.skinId] || SKINS.default;
    const geo   = new THREE.CapsuleGeometry(0.25, 0.7, 6, 10);
    const mat   = new THREE.MeshLambertMaterial({ color: skin.color });
    this.mesh   = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;

    // Name/emoji label above
    const spriteMat = new THREE.SpriteMaterial({ map: makeEmojiTexture(skin.emoji), transparent: true });
    this.sprite = new THREE.Sprite(spriteMat);
    this.sprite.scale.set(0.65, 0.65, 0.65);
    this.sprite.position.y = 1.2;

    this.group = new THREE.Group();
    this.group.add(this.mesh, this.sprite);
    this.group.position.copy(this.target);
    scene.add(this.group);
  }

  moveTo(x, y, z, rotY) {
    this.target.set(x, y, z);
    if (rotY !== undefined) this.group.rotation.y = rotY;
  }

  update() {
    // Smooth interpolation
    this.group.position.lerp(this.target, 0.2);
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (c.material.map) c.material.map.dispose();
        c.material.dispose();
      }
    });
  }
}
