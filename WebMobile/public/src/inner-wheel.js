import { getBonusIconSrc } from "./bonus-icons.js";

const BONUS_PRIZE_COUNTS = [
  ["Free Card", 4, "free-card"],
  ["50% Off", 8, "discount"],
  ["NO WIN", 11, "no-win"],
  ["Spin Again", 5, "spin-again"],
  ["Buy 1 Get 1 50% Off", 4, "bogo"],
  ["PIC Card", 4, "pic"],
  ["Free Roll", 6, "free-roll"],
  ["100 RP", 3, "rp"],
  ["BANKRUPTCY", 1, "bankruptcy"],
  ["Shield", 5, "shield"],
  ["Steal", 5, "steal"]
];
const SLOW_SPIN_MS = 3400;
const SNAP_SPIN_MS = 170;
const SEGMENT_COLORS = {
  "free-card": "#e63946",
  discount: "#f04438",
  "no-win": "#a70f18",
  "spin-again": "#f6b52f",
  bogo: "#f2c94c",
  pic: "#f2a51a",
  "free-roll": "#f6c453",
  rp: "#f6b52f",
  bankruptcy: "#050505",
  shield: "#1e88ff",
  steal: "#3b2c73"
};

export function createInnerWheelModule({ root, spinButton, resultLabel, prizes = buildDefaultPrizes() }) {
  const wheel = root.querySelector("[data-inner-wheel-disc]");
  const prizeLabel = root.querySelector("[data-inner-wheel-prize]");
  const normalizedPrizes = shufflePrizes(prizes.map(normalizePrize));
  let rotation = 0;
  let pointerAngle = 0;
  let spinning = false;

  prizeLabel.classList.add("inner-wheel-prize-label");
  wheel.style.setProperty("--inner-wheel-segments", buildSegmentGradient(normalizedPrizes));
  renderPrizeLabels(wheel, normalizedPrizes);
  renderPrize(0);

  function spin({ onBeforeSpin, onResult } = {}) {
    if (spinning) {
      return null;
    }

    if (onBeforeSpin && !onBeforeSpin()) {
      return null;
    }

    spinning = true;
    root.classList.add("spinning");
    root.classList.add("slow-spinning");
    root.classList.remove("snap-stop");
    if (spinButton) {
      spinButton.disabled = true;
    }

    const targetPrizeIndex = Math.floor(Math.random() * normalizedPrizes.length);
    const segmentDegrees = 360 / normalizedPrizes.length;
    const segmentCenterDegrees = (targetPrizeIndex + 0.5) * segmentDegrees;
    const snapDegrees = segmentDegrees * 0.22;
    const targetRotation = pointerAngle - segmentCenterDegrees;
    const fullTurns = Math.ceil((rotation - targetRotation) / 360) + 4;
    const finalRotation = targetRotation + Math.max(fullTurns, 4) * 360;
    rotation = finalRotation - snapDegrees;
    wheel.offsetHeight;
    wheel.style.setProperty("--inner-wheel-rotation", `${rotation}deg`);

    window.setTimeout(() => {
      root.classList.remove("slow-spinning");
      root.classList.add("snap-stop");
      rotation = finalRotation;
      wheel.style.setProperty("--inner-wheel-rotation", `${rotation}deg`);
    }, SLOW_SPIN_MS);

    window.setTimeout(() => {
      const winningIndex = getPrizeIndexAtPointer(rotation);
      renderPrize(winningIndex);
      root.classList.remove("spinning");
      root.classList.remove("snap-stop");
      if (spinButton) {
        spinButton.disabled = false;
      }
      spinning = false;
      onResult?.(normalizedPrizes[winningIndex].label, normalizedPrizes[winningIndex]);
    }, SLOW_SPIN_MS + SNAP_SPIN_MS);

    return normalizedPrizes[targetPrizeIndex].label;
  }

  function setSpinEnabled(enabled) {
    if (spinButton) {
      spinButton.disabled = spinning || !enabled;
    }
    root.classList.toggle("spin-locked", !enabled);
  }

  function pointToBoardIndex(boardIndex, boardSpaceCount = 56) {
    const normalizedIndex = ((boardIndex % boardSpaceCount) + boardSpaceCount) % boardSpaceCount;
    const angle = (normalizedIndex / boardSpaceCount) * 360;
    pointerAngle = angle;
    root.style.setProperty("--inner-wheel-pointer-angle", `${angle}deg`);
  }

  function getPrizeIndexAtPointer(rotationDegrees) {
    const segmentDegrees = 360 / normalizedPrizes.length;
    const pointerRelativeAngle = normalizeDegrees(pointerAngle - rotationDegrees);
    return Math.floor(pointerRelativeAngle / segmentDegrees) % normalizedPrizes.length;
  }

  function renderPrize(index) {
    const prize = normalizedPrizes[index];
    root.dataset.prizeType = prize.type;
    prizeLabel.textContent = prize.label;
    resultLabel.textContent = prize.label;
  }

  return {
    pointToBoardIndex,
    setSpinEnabled,
    spin
  };
}

export function buildDefaultPrizes() {
  return BONUS_PRIZE_COUNTS.flatMap(([label, count, type]) => (
    Array.from({ length: count }, () => ({ label, type }))
  ));
}

function normalizePrize(prize) {
  if (typeof prize === "string") {
    return { label: prize, type: getPrizeType(prize) };
  }

  return {
    label: prize.label,
    type: prize.type || getPrizeType(prize.label)
  };
}

function getPrizeType(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildSegmentGradient(prizes) {
  const segmentDegrees = 360 / prizes.length;
  const stops = prizes.map((prize, index) => {
    const start = roundDegrees(index * segmentDegrees);
    const end = roundDegrees((index + 1) * segmentDegrees);
    const color = SEGMENT_COLORS[prize.type] || "var(--diner-red)";
    return `${color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

function renderPrizeLabels(wheel, prizes) {
  wheel.querySelectorAll(".inner-wheel-slot-label").forEach((label) => label.remove());

  const segmentDegrees = 360 / prizes.length;
  prizes.forEach((prize, index) => {
    const label = document.createElement("span");
    label.className = "inner-wheel-slot-label";
    label.dataset.prizeType = prize.type;
    label.innerHTML = getPrizeIconMarkup(prize);
    label.setAttribute("aria-label", prize.label);
    label.style.setProperty("--slot-angle", `${(index + 0.5) * segmentDegrees}deg`);
    wheel.append(label);
  });
}

function getPrizeIconMarkup(prize) {
  const imageSrc = getBonusIconSrc(prize.label, prize.type);
  if (imageSrc) {
    return `<span class="wheel-prize-icon image-icon"><img src="${imageSrc}" alt=""></span>`;
  }

  const icons = {
    "free-roll": `<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3"></rect><circle cx="9" cy="9" r="1.3"></circle><circle cx="15" cy="9" r="1.3"></circle><circle cx="9" cy="15" r="1.3"></circle><circle cx="15" cy="15" r="1.3"></circle></svg>`,
    steal: `<svg viewBox="0 0 24 24"><path d="M7 15c2.5-1.4 4.8-1.4 7 0l3 1.5"></path><path d="M6 18h8.5c1.6 0 3-.8 3.8-2.1"></path><path d="M8 9h8"></path><path d="M12 5v8"></path></svg>`
  };

  return `<span class="wheel-prize-icon">${icons[prize.type] || icons["free-card"]}</span>`;
}

function shufflePrizes(prizes) {
  const shuffled = [...prizes];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function roundDegrees(value) {
  return Number.parseFloat(value.toFixed(6));
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}
