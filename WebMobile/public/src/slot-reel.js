const DEFAULT_MIN = 1;
const DEFAULT_MAX = 6;
const REEL_SPIN_DELAYS_MS = [
  [28, 30, 33, 38, 45, 55, 70, 90, 118, 152, 198, 258],
  [34, 36, 40, 47, 58, 74, 96, 126, 164, 214, 280, 360, 450]
];

export function createSlotReelModule({ root, rollButton, externalRollButton, min = DEFAULT_MIN, max = DEFAULT_MAX, onRollComplete }) {
  const reels = [...root.querySelectorAll("[data-reel]")];
  const doublesLamp = root.querySelector("[data-doubles-lamp]");
  let spinning = false;
  let lastResult = reels.map(() => min);
  let spinSession = 0;

  rollButton.addEventListener("click", roll);
  externalRollButton?.addEventListener("click", roll);
  renderNumber(lastResult);

  function roll() {
    if (spinning) {
      return;
    }

    const session = ++spinSession;
    spinning = true;
    root.classList.add("rolling");
    root.classList.remove("doubles-hit");
    doublesLamp.setAttribute("aria-pressed", "false");
    rollButton.disabled = true;
    if (externalRollButton) {
      externalRollButton.disabled = true;
    }

    const result = reels.map(() => randomInt(min, max));
    Promise.all(reels.map((reel, index) => spinReelToValue(reel, index, result[index], session)))
      .then(() => {
        if (session !== spinSession) {
          return;
        }

        lastResult = result;
        root.classList.remove("rolling");
        renderNumber(result);
        const isDoubles = result.every((value) => value === result[0]);
        const total = result.reduce((sum, value) => sum + value, 0);
        root.classList.toggle("doubles-hit", isDoubles);
        doublesLamp.setAttribute("aria-pressed", String(isDoubles));
        rollButton.disabled = false;
        if (externalRollButton) {
          externalRollButton.disabled = false;
        }
        spinning = false;
        onRollComplete?.({ values: [...result], total, isDoubles });
      });
  }

  function renderNumber(values) {
    reels.forEach((reel, index) => renderReelNumber(reel, values[index] || min, index));
  }

  function cancel() {
    spinSession += 1;
    spinning = false;
    root.classList.remove("rolling");
    rollButton.disabled = false;
    if (externalRollButton) {
      externalRollButton.disabled = false;
    }
    renderNumber(lastResult);
  }

  async function spinReelToValue(reel, reelIndex, finalValue, session) {
    const delays = REEL_SPIN_DELAYS_MS[reelIndex] || REEL_SPIN_DELAYS_MS[0];
    let previousValue = Number(reel.dataset.value || min);

    for (const delay of delays) {
      await wait(delay);
      if (session !== spinSession) {
        return;
      }

      previousValue = nextVisibleValue(previousValue);
      renderReelNumber(reel, previousValue, reelIndex);
    }

    const settleValues = [
      nextVisibleValue(finalValue),
      previousValue === finalValue ? nextVisibleValue(finalValue) : finalValue
    ];

    for (const [index, value] of settleValues.entries()) {
      await wait(170 + (reelIndex * 70) + (index * 110));
      if (session !== spinSession) {
        return;
      }

      renderReelNumber(reel, value, reelIndex);
    }

    await wait(210 + (reelIndex * 120));
    if (session !== spinSession) {
      return;
    }

    renderReelNumber(reel, finalValue, reelIndex);
  }

  function renderReelNumber(reel, value, index) {
    reel.dataset.value = String(value);
    reel.setAttribute("aria-label", `Die ${index + 1}: ${value}`);
    reel.innerHTML = `<span class="dice-reel-strip" aria-hidden="true"><b>${value}</b></span>`;
  }

  function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }

  function nextVisibleValue(current) {
    const next = randomInt(min, max);
    return next === current ? ((current - min + 1) % (max - min + 1)) + min : next;
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  return {
    cancel,
    isSpinning: () => spinning,
    roll
  };
}
