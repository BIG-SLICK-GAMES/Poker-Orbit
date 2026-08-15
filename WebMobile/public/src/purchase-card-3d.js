import * as THREE from "../vendor/three/three.module.js";
import { GLTFLoader } from "../vendor/three/GLTFLoader.js";

const MODEL_URL = "./assets/models/purchase-card.glb";

export function createPurchaseCard3DModule({ layer, playerColors, suitIcons }) {
  const loader = new GLTFLoader();
  let modelPromise = null;

  function loadModel() {
    if (!modelPromise) {
      modelPromise = loader.loadAsync(MODEL_URL);
    }

    return modelPromise;
  }

  async function play({ featuredCard, cardElement, playerIndex = 0 }) {
    if (!layer || !cardElement) {
      return;
    }

    const gltf = await loadModel();
    const layerRect = layer.getBoundingClientRect();
    const sourceRect = (featuredCard || cardElement).getBoundingClientRect();
    const holder = document.createElement("div");
    const canvas = document.createElement("canvas");
    holder.className = "purchase-card-3d-layer";
    holder.append(canvas);
    layer.append(holder);

    featuredCard?.classList.add("purchase-fx-source");

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(layerRect.width, layerRect.height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, layerRect.width / Math.max(1, layerRect.height), 0.01, 80);
    camera.position.set(0, -7.1, 2.45);
    camera.lookAt(0, 0, 0.42);

    scene.add(new THREE.AmbientLight(0xffffff, 1.85));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(1.4, -3.6, 4.2);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(new THREE.Color(playerColors[playerIndex] || "#24d8ff"), 2.6);
    rimLight.position.set(-2.6, 2.2, 2.8);
    scene.add(rimLight);

    const wrap = new THREE.Group();
    const model = gltf.scene.clone(true);
    wrap.add(model);
    scene.add(wrap);

    const buyerColor = new THREE.Color(playerColors[playerIndex] || "#24d8ff");
    const faceTexture = createCardFaceTexture(cardElement, suitIcons);
    applyRuntimeMaterials(model, faceTexture, buyerColor);
    positionModelFromCard(wrap, sourceRect, layerRect);

    const mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(gltf.animations[0]);
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.timeScale = 0.72;
    action.play();

    await new Promise((resolve) => {
      const clock = new THREE.Clock();
      let done = false;
      let frame = 0;

      mixer.addEventListener("finished", () => {
        done = true;
      });

      const render = () => {
        const delta = Math.min(0.04, clock.getDelta());
        mixer.update(delta);
        const pulse = 1 + Math.sin(clock.elapsedTime * 9) * 0.035;
        wrap.scale.setScalar(wrap.userData.baseScale * pulse);
        renderer.render(scene, camera);

        if (done) {
          resolve();
          return;
        }

        frame = window.requestAnimationFrame(render);
        holder.dataset.frame = String(frame);
      };

      render();
    });

    holder.classList.add("leaving");
    await wait(240);
    faceTexture.dispose();
    renderer.dispose();
    holder.remove();
    featuredCard?.classList.remove("purchase-fx-source");
  }

  return { play };
}

function positionModelFromCard(wrap, sourceRect, layerRect) {
  const viewHeight = 4.85;
  const viewWidth = viewHeight * (layerRect.width / Math.max(1, layerRect.height));
  const centerX = ((sourceRect.left + sourceRect.width / 2 - layerRect.left) / layerRect.width - 0.5) * viewWidth;
  const centerY = -(((sourceRect.top + sourceRect.height / 2 - layerRect.top) / layerRect.height - 0.5) * viewHeight);
  const targetHeight = Math.max(0.8, (sourceRect.height / Math.max(1, layerRect.height)) * viewHeight);
  const scale = targetHeight / 3.18;
  wrap.position.set(centerX, 0, centerY - 0.05);
  wrap.scale.setScalar(scale);
  wrap.userData.baseScale = scale;
}

function applyRuntimeMaterials(model, faceTexture, buyerColor) {
  model.traverse((object) => {
    if (!object.isMesh) {
      return;
    }

    object.material = object.material.clone();

    if (object.name === "CardFront") {
      object.material = new THREE.MeshBasicMaterial({
        map: faceTexture,
        side: THREE.DoubleSide,
        toneMapped: false
      });
      return;
    }

    if (object.material.name === "CardEdgeBuyerColor" || object.material.name === "BuyerGlow") {
      object.material.color = buyerColor;
      object.material.emissive = buyerColor;
      object.material.emissiveIntensity = object.material.name === "BuyerGlow" ? 3.8 : 1.9;
      object.material.transparent = object.material.name === "BuyerGlow";
      object.material.opacity = object.material.name === "BuyerGlow" ? 0.68 : 1;
    }
  });
}

function createCardFaceTexture(cardElement, suitIcons) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  const rank = cardElement.dataset.rank || "";
  const suit = cardElement.dataset.suit || "";
  const suitIcon = suitIcons[suit] || suit;
  const isRed = suit === "H" || suit === "D";
  const ink = isRed ? "#ff2a4f" : "#06101e";

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fffdf3");
  gradient.addColorStop(1, "#d9fbff");
  ctx.fillStyle = gradient;
  roundRect(ctx, 28, 28, canvas.width - 56, canvas.height - 56, 54);
  ctx.fill();

  ctx.lineWidth = 18;
  ctx.strokeStyle = isRed ? "#ff2a4f" : "#24d8ff";
  roundRect(ctx, 60, 60, canvas.width - 120, canvas.height - 120, 42);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 188px Georgia, serif";
  ctx.fillText(rank, canvas.width / 2, 214);
  ctx.font = "900 390px Georgia, serif";
  ctx.fillText(suitIcon, canvas.width / 2, 570);
  ctx.font = "900 110px Georgia, serif";
  ctx.fillText(rank, canvas.width / 2, 900);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
