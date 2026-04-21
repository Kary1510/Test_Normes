import * as THREE from 'three';

const OFFSET = new THREE.Vector3(0, 9, 11);
const LOOK_OFFSET = new THREE.Vector3(0, 0.8, 0);
const LERP = 0.1;

export class GameCamera {
  constructor(renderer) {
    const { width, height } = renderer.domElement;
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 120);
    this.camera.position.set(3, 9, 14);

    this._target = new THREE.Vector3();
    this._look   = new THREE.Vector3();
  }

  follow(playerPosition) {
    this._target.copy(playerPosition).add(OFFSET);
    this._look.copy(playerPosition).add(LOOK_OFFSET);

    this.camera.position.lerp(this._target, LERP);
    this.camera.lookAt(this._look);
  }

  onResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  get three() {
    return this.camera;
  }
}
