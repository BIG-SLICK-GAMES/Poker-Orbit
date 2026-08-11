import * as THREE from "https://esm.sh/three@0.180.0";
import { GLTFLoader } from "https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

export function createPrizeWheelRenderer({ root, canvas }) {
  if (!root || !canvas) {
    return { dispose() {} };
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const rotationSource = root.querySelector("[data-inner-wheel-disc]") || root;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 10);
  camera.position.set(0, -1.02, 0.78);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xfff1cf, 0x150f0d, 1.7));

  const key = new THREE.DirectionalLight(0xffffff, 4.2);
  key.position.set(-0.8, -1, 1.2);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffb13d, 2.4);
  rim.position.set(0.9, 0.6, 0.7);
  scene.add(rim);

  const wheelGroup = new THREE.Group();
  wheelGroup.rotation.x = -0.03;
  scene.add(wheelGroup);

  const loader = new GLTFLoader();
  loader.load(
    "./assets/models/prize-wheel-56-segments.glb",
    (gltf) => {
      const wheel = gltf.scene;
      wheel.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        child.material.side = THREE.DoubleSide;
        child.material.roughness = Math.min(child.material.roughness ?? 0.34, 0.38);
        child.material.metalness = child.name.includes("Separator") ? 0.1 : 0.12;
        child.castShadow = false;
        child.receiveShadow = false;
      });

      const bounds = new THREE.Box3().setFromObject(wheel);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      wheel.position.sub(center);
      const maxDimension = Math.max(size.x, size.y);
      wheel.scale.setScalar(maxDimension ? 1.72 / maxDimension : 1);
      wheelGroup.add(wheel);
      canvas.dataset.loaded = "true";
    },
    undefined,
    () => {
      canvas.dataset.error = "true";
    }
  );

  let frameId = 0;
  let disposed = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const targetSize = Math.floor(size * pixelRatio);

    if (canvas.width !== targetSize || canvas.height !== targetSize) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }
  }

  function getWheelRotationRadians() {
    const value = getComputedStyle(rotationSource).getPropertyValue("--inner-wheel-rotation").trim();
    const degrees = Number.parseFloat(value || "0");
    return Number.isFinite(degrees) ? THREE.MathUtils.degToRad(-degrees) : 0;
  }

  function animate() {
    if (disposed) {
      return;
    }

    resize();
    wheelGroup.rotation.z = getWheelRotationRadians();
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(animate);
  }

  animate();

  return {
    dispose() {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      renderer.dispose();
    }
  };
}
