const DEFAULT_MIN = 1;
const DEFAULT_MAX = 6;
const SPIN_TICKS = 18;

export function createSlotReelModule({ root, rollButton, externalRollButton, min = DEFAULT_MIN, max = DEFAULT_MAX, onRollComplete }) {
  const reels = [...root.querySelectorAll("[data-reel]")];
  const doublesLamp = root.querySelector("[data-doubles-lamp]");
  let spinning = false;
  let lastResult = reels.map(() => min);

  rollButton.addEventListener("click", roll);
  externalRollButton?.addEventListener("click", roll);
  renderNumber(lastResult);

  function roll() {
    if (spinning) {
      return;
    }

    spinning = true;
    root.classList.add("rolling");
    root.classList.remove("doubles-hit");
    doublesLamp.setAttribute("aria-pressed", "false");
    rollButton.disabled = true;
    if (externalRollButton) {
      externalRollButton.disabled = true;
    }

    const result = reels.map(() => randomInt(min, max));
    let tick = 0;

    const timer = window.setInterval(() => {
      tick += 1;
      renderNumber(reels.map(() => randomInt(min, max)));

      if (tick >= SPIN_TICKS) {
        window.clearInterval(timer);
        lastResult = result;
        renderNumber(result);
        const isDoubles = result.every((value) => value === result[0]);
        const total = result.reduce((sum, value) => sum + value, 0);
        root.classList.toggle("doubles-hit", isDoubles);
        doublesLamp.setAttribute("aria-pressed", String(isDoubles));
        root.classList.remove("rolling");
        rollButton.disabled = false;
        if (externalRollButton) {
          externalRollButton.disabled = false;
        }
        spinning = false;
        onRollComplete?.({ values: [...result], total, isDoubles });
      }
    }, 58);
  }

  function renderNumber(values) {
    reels.forEach((reel, index) => {
      const value = values[index] || min;
      reel.dataset.value = String(value);
      reel.setAttribute("aria-label", `Die ${index + 1}: ${value}`);
      reel.textContent = String(value);
    });
  }

  function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }

  return {
    roll
  };
}
