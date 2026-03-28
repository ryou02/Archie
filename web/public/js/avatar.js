import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const Avatar = {
  mixer: null,
  mouth: null,
  clock: new THREE.Clock(),
  idleAction: null,
  state: "idle",
  mouthOpenTarget: 0,
  mouthOpenCurrent: 0,
  blinkTimer: 0,
  idlePhase: 0,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,

  init() {
    const container = document.getElementById("avatar-container");
    if (!container || this.renderer) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf4edcd);

    this.camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
    this.camera.position.set(0, 1.6, 2.9);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.avatarRoot = new THREE.Group();
    this.scene.add(this.avatarRoot);
    this.setupLighting();

    this.loadModel();
    window.addEventListener("resize", () => this.onResize());
    this.animate();
  },

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.1);
    const key = new THREE.DirectionalLight(0xfff2d6, 1.4);
    key.position.set(3, 4, 5);
    const fill = new THREE.DirectionalLight(0xdce9ff, 0.7);
    fill.position.set(-4, 2, 2);
    const rim = new THREE.DirectionalLight(0xffffff, 0.55);
    rim.position.set(0, 5, -4);
    this.scene.add(ambient, key, fill, rim);
  },

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      "models/archie.glb",
      (gltf) => {
        this.model = gltf.scene;
        this.avatarRoot.add(this.model);

        if (gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          this.idleAction = this.mixer.clipAction(gltf.animations[0]);
          this.idleAction.play();
        }

        this.model.traverse((child) => {
          if (!this.headBone && child.isBone && /head/i.test(child.name)) {
            this.headBone = child;
          }

          if (child.isMesh && child.morphTargetInfluences) {
            this.mouth = child;
          }
        });

        console.log("Archie model loaded");
      },
      undefined,
      (err) => {
        console.warn("Could not load archie.glb:", err.message);
        this.createPlaceholderAvatar();
      }
    );
  },

  createPlaceholderAvatar() {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x607d5b,
      flatShading: true,
    });
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4c99b,
      flatShading: true,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xc76f52,
      flatShading: true,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.45), bodyMaterial);
    body.position.y = 0.6;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.68), skinMaterial);
    head.position.y = 1.55;

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.2, 0.72), accentMaterial);
    hair.position.set(0, 1.84, 0);

    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.38), skinMaterial);
    jaw.position.set(0, 1.28, 0.16);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.03), new THREE.MeshStandardMaterial({ color: 0x2e3148 }));
    const rightEye = leftEye.clone();
    leftEye.position.set(-0.14, 1.6, 0.33);
    rightEye.position.set(0.14, 1.6, 0.33);

    group.add(body, head, hair, jaw, leftEye, rightEye);
    group.position.y = 0.2;

    this.placeholderJaw = jaw;
    this.placeholderEyes = [leftEye, rightEye];
    this.avatarRoot.add(group);
  },

  setMouthOpen(amount) {
    if (this.mouth && this.mouth.morphTargetInfluences) {
      const dict = this.mouth.morphTargetDictionary;
      if (dict) {
        const key =
          dict["mouthOpen"] ??
          dict["jawOpen"] ??
          dict["viseme_aa"] ??
          Object.values(dict)[0];
        if (key !== undefined) {
          this.mouth.morphTargetInfluences[key] = amount;
        }
      }
    }

    if (this.placeholderJaw) {
      this.placeholderJaw.scale.y = 1 + amount * 0.35;
      this.placeholderJaw.position.y = 1.28 - amount * 0.03;
    }
  },

  setState(nextState) {
    this.state = nextState;
  },

  setSpeechEnergy(amount) {
    this.setState(amount > 0.02 ? "speaking" : this.state === "speaking" ? "idle" : this.state);
    this.mouthOpenTarget = Math.max(0, Math.min(amount, 1));
  },

  onResize() {
    const container = document.getElementById("avatar-container");
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  },

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.idlePhase += delta;
    this.blinkTimer += delta;
    this.mouthOpenCurrent += (this.mouthOpenTarget - this.mouthOpenCurrent) * 0.18;
    this.setMouthOpen(this.mouthOpenCurrent);

    if (this.avatarRoot) {
      const breathe = this.reducedMotion ? 0 : Math.sin(this.idlePhase * 1.8) * 0.025;
      const speakBob = this.state === "speaking" && !this.reducedMotion
        ? Math.sin(this.idlePhase * 8) * 0.015
        : 0;
      this.avatarRoot.position.y = breathe + speakBob;
      this.avatarRoot.rotation.y = this.state === "speaking" && !this.reducedMotion
        ? Math.sin(this.idlePhase * 2.5) * 0.05
        : 0;
    }

    if (this.headBone && !this.reducedMotion) {
      this.headBone.rotation.x = this.state === "speaking"
        ? Math.sin(this.idlePhase * 7) * 0.025
        : Math.sin(this.idlePhase * 1.5) * 0.01;
    }

    if (this.placeholderEyes && this.blinkTimer > 3.2) {
      const blink = this.blinkTimer < 3.34 ? 0.2 : 1;
      this.placeholderEyes.forEach((eye) => {
        eye.scale.y = blink;
      });
      if (this.blinkTimer > 3.4) {
        this.blinkTimer = 0;
      }
    }

    if (this.mixer) {
      this.mixer.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  },
};

window.Avatar = Avatar;
