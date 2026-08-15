const DEFAULT_MIN = 1;
const DEFAULT_MAX = 6;
const SPIN_TICKS = 15;
const SPIN_DELAYS_MS = [
  28, 30, 32, 35, 39,
  46, 55, 68, 84, 104,
  128, 158, 194, 238, 292
];

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

    const spinTick = () => {
      tick += 1;
      renderNumber(reels.map(() => randomInt(min, max)));

      if (tick >= SPIN_TICKS) {
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
        return;
      }

      window.setTimeout(spinTick, SPIN_DELAYS_MS[Math.min(tick, SPIN_DELAYS_MS.length - 1)]);
    };

    window.setTimeout(spinTick, SPIN_DELAYS_MS[0]);
  }

  function renderNumber(values) {
    reels.forEach((reel, index) => {
      const value = values[index] || min;
      reel.dataset.value = String(value);
      reel.setAttribute("aria-label", `Die ${index + 1}: ${value}`);
      reel.style.setProperty("--reel-index", String(value - min));

      if (!reel.querySelector(".dice-reel-strip")) {
        reel.innerHTML = `
          <span class="dice-reel-strip" aria-hidden="true">
            ${Array.from({ length: max - min + 1 }, (_, numberIndex) => `<b>${numberIndex + min}</b>`).join("")}
          </span>
        `;
      }
    });
  }

  function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }

  return {
    roll
  };
}
