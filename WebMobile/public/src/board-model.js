import * as THREE from "../vendor/three/three.module.js";
import { GLTFLoader } from "../vendor/three/examples/jsm/loaders/GLTFLoader.js";

export function createBoardModelLayer({ root, modelUrl }) {
  if (!root || !modelUrl) {
    return { dispose() {} };
  }

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  root.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 200);
  camera.position.set(0, 6.4, 7.8);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xfff0cc, 0x0b1b24, 1.7));
  const keyLight = new THREE.DirectionalLight(0xffe1a6, 3.8);
  keyLight.position.set(2.4, 5.6, 4.2);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x49fff0, 12, 12);
  rimLight.position.set(-3.8, 2.1, -3.4);
  scene.add(rimLight);

  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  let animationFrame = 0;
  let disposed = false;
  let loadedScene = null;
  let loadCompleted = false;
  const loadTimeout = window.setTimeout(() => {
    if (!loadCompleted) {
      root.classList.add("failed");
    }
  }, 12000);

  new GLTFLoader().load(
    modelUrl,
    (gltf) => {
      loadCompleted = true;
      window.clearTimeout(loadTimeout);
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }

      loadedScene = gltf.scene;
      loadedScene.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        child.frustumCulled = false;
        child.castShadow = false;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      });

      fitModelToLayer(loadedScene);
      modelRoot.add(loadedScene);
      root.classList.add("ready");
    },
    undefined,
    () => {
      loadCompleted = true;
      window.clearTimeout(loadTimeout);
      root.classList.add("failed");
    }
  );

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  resize();
  render();

  function fitModelToLayer(model) {
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    model.position.sub(center);
    model.rotation.x = 0;
    model.rotation.y = 0;
    model.rotation.z = 0;
    model.scale.setScalar(5.7 / maxAxis);
  }

  function resize() {
    const rect = root.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render() {
    if (disposed) {
      return;
    }

    renderer.render(scene, camera);
    animationFrame = window.requestAnimationFrame(render);
  }

  function dispose() {
    disposed = true;
    window.clearTimeout(loadTimeout);
    window.cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
    root.classList.remove("ready");
    if (loadedScene) {
      disposeObject(loadedScene);
    }
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { dispose };
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) {
          value.dispose();
        }
      });
      material.dispose?.();
    });
  });
}
