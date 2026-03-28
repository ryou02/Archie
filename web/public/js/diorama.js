import * as THREE from "three";

const Diorama = {
  init() {
    const container = document.getElementById("diorama-container");
    if (!container || this.renderer) {
      return;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(5.5, 4.6, 6.4);
    this.camera.lookAt(0, 0.8, 0);
    this.clock = new THREE.Clock();
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.buildScene();

    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
    window.BuildState.subscribe((state) => this.syncFromState(state));
    this.onResize();
    this.animate();
  },

  buildScene() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.22);
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.5);
    sun.position.set(7, 8, 5);
    const skyFill = new THREE.DirectionalLight(0xdbe7ff, 0.45);
    skyFill.position.set(-4, 3, -2);

    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(3.1, 3.6, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0xe4efab, flatShading: true })
    );
    ground.position.y = -0.4;

    const deckMaterial = new THREE.MeshStandardMaterial({ color: 0xc29a72, flatShading: true });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x85725f, flatShading: true });
    const cloth = new THREE.MeshStandardMaterial({ color: 0xd0bf8e, flatShading: true });

    this.groups = {
      plan: new THREE.Group(),
      scene: new THREE.Group(),
      objects: new THREE.Group(),
      polish: new THREE.Group(),
    };

    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.18, 1.8), deckMaterial);
    const sidePier = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 1.2), deckMaterial);
    sidePier.position.set(1.55, -0.04, 0.6);
    this.groups.plan.add(deck, sidePier);
    this.addPosts(this.groups.plan, woodDark);

    const tentWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.1), woodDark);
    tentWall.position.set(-0.72, 0.45, -0.35);
    const tentRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.05, 4, 1, false), cloth);
    tentRoof.rotation.z = Math.PI / 2;
    tentRoof.rotation.y = Math.PI / 4;
    tentRoof.position.set(-0.44, 0.9, -0.2);
    const canopyDrop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.74), cloth);
    canopyDrop.rotation.z = -0.18;
    canopyDrop.position.set(-0.2, 0.36, -0.46);
    this.groups.scene.add(tentWall, tentRoof, canopyDrop);

    const boat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 0.62), woodDark);
    boat.position.set(1.15, 0.14, 0.15);
    boat.rotation.y = -0.28;
    const boatInset = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.11, 0.4), deckMaterial);
    boatInset.position.set(1.13, 0.18, 0.15);
    boatInset.rotation.y = -0.28;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0x7e8fa1, flatShading: true }));
    barrel.position.set(0.02, 0.2, 0.25);
    this.groups.objects.add(boat, boatInset, barrel);

    const ropeBundle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12), new THREE.MeshStandardMaterial({ color: 0xe7d7a2, flatShading: true }));
    ropeBundle.position.set(0.72, 0.16, -0.38);
    ropeBundle.rotation.x = Math.PI / 2;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.16), deckMaterial);
    plank.position.set(0.8, 0.18, -0.54);
    plank.rotation.y = -0.22;
    this.groups.polish.add(ropeBundle, plank);

    Object.values(this.groups).forEach((group) => {
      group.userData.reveal = 0;
      group.visible = true;
      this.scene.add(group);
    });

    this.scene.add(ambient, sun, skyFill, ground);
  },

  addPosts(group, material) {
    const postPositions = [
      [-1.15, -0.6, -0.72],
      [-0.35, -0.6, -0.72],
      [0.45, -0.6, -0.72],
      [1.15, -0.6, -0.72],
      [-1.15, -0.6, 0.72],
      [-0.35, -0.6, 0.72],
      [0.45, -0.6, 0.72],
      [1.15, -0.6, 0.72],
      [1.75, -0.55, 0.2],
      [1.75, -0.55, 0.92],
    ];

    postPositions.forEach(([x, y, z]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), material);
      post.position.set(x, y, z);
      group.add(post);
    });
  },

  syncFromState(state) {
    if (!this.groups) {
      return;
    }

    const lookup = Object.fromEntries(state.steps.map((step) => [step.id, step]));
    this.setReveal(this.groups.plan, (lookup.plan?.progress || 0) / 100);
    this.setReveal(this.groups.scene, (lookup.scene?.progress || 0) / 100);
    this.setReveal(this.groups.objects, (lookup.objects?.progress || 0) / 100);
    this.setReveal(this.groups.polish, (lookup.polish?.progress || 0) / 100);
  },

  setReveal(group, amount) {
    group.userData.targetReveal = amount;
  },

  onResize() {
    const container = document.getElementById("diorama-container");
    if (!container || !this.renderer) {
      return;
    }

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  },

  animate() {
    if (!this.renderer) {
      return;
    }

    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    if (this.groups) {
      Object.values(this.groups).forEach((group) => {
        const target = group.userData.targetReveal || 0;
        const current = group.userData.reveal || 0;
        const next = this.reducedMotion ? target : current + (target - current) * Math.min(delta * 8, 1);
        group.userData.reveal = next;
        group.scale.setScalar(Math.max(0.001, next));
        group.position.y = (1 - next) * 0.35;
        group.visible = next > 0.001;
      });
    }

    if (!this.reducedMotion) {
      this.camera.position.x = 5.5 + Math.sin(this.clock.elapsedTime * 0.35) * 0.18;
      this.camera.lookAt(0, 0.8, 0);
    }

    this.renderer.render(this.scene, this.camera);
  },
};

window.Diorama = Diorama;
