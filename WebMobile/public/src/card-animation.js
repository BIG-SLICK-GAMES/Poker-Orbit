export function createCardAnimationModule({ layer, onPurchase, onPass, onSpin, canSpin }) {
  let activeAnimation = null;
  let activeCardElement = null;

  function play(cardElement) {
    if (!cardElement || activeAnimation) {
      return;
    }

    activeCardElement = cardElement;
    const sourceRect = cardElement.getBoundingClientRect();
    const frameRect = getFrameRect(layer);
    const sourceLeft = sourceRect.left - frameRect.left;
    const sourceTop = sourceRect.top - frameRect.top;
    const targetWidth = Math.min(218, Math.max(172, frameRect.width * 0.52));
    const targetHeight = targetWidth * 1.46;
    const targetLeft = (frameRect.width - targetWidth) / 2;
    const targetTop = Math.max(72, (frameRect.height - targetHeight) * 0.34);
    const controls = document.createElement("div");
    const clone = cardElement.cloneNode(true);
    clone.className = `featured-card-flight ${getFeaturedCardClasses(cardElement)}`;
    clone.removeAttribute("data-control");
    clone.removeAttribute("aria-label");
    clone.innerHTML = getFeaturedCardMarkup(cardElement);
    clone.style.left = `${sourceLeft}px`;
    clone.style.top = `${sourceTop}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.opacity = "0";
    clone.style.transform = "rotateY(0deg) rotateZ(0deg) translateZ(0) scale(1)";

    controls.className = "featured-card-actions";
    controls.hidden = true;
    controls.style.left = `${targetLeft}px`;
    controls.style.top = `${targetTop + targetHeight + 14}px`;
    controls.style.width = `${targetWidth}px`;
    controls.innerHTML = `
      <button class="featured-card-action spin" type="button">Spin</button>
      <button class="featured-card-action purchase" type="button">Purchase</button>
      <button class="featured-card-action pass" type="button">Pass</button>
      <span class="featured-card-status" aria-live="polite"></span>
    `;
    const spinButton = controls.querySelector(".spin");
    const purchaseButton = controls.querySelector(".purchase");
    const status = controls.querySelector(".featured-card-status");
    const cardPrice = Number.parseInt(cardElement.dataset.cardPrice || "0", 10) || 0;
    let purchaseOptions = {};
    let freeBonusSpins = 0;

    function updateSpinButton() {
      const hasFreeSpin = freeBonusSpins > 0;
      spinButton.disabled = !hasFreeSpin && !canSpin?.(activeCardElement);
      spinButton.textContent = hasFreeSpin ? "Free Spin" : "Spin";
    }

    function setStatus(message) {
      status.textContent = message || "";
    }

    async function startBonusSlotMachine({ prize, onComplete }) {
      const slotOverlay = createBonusSlotMachineElement(prize);
      layer.append(slotOverlay.root);
      controls.classList.add("bonus-slot-mode");
      clone.classList.remove("waiting-purchase");
      await runBonusSlotReels(slotOverlay.reels);
      slotOverlay.root.classList.add("resolved");
      slotOverlay.closeButton.disabled = false;
      setStatus(prize.label);
      onComplete?.(prize);
      await slotOverlay.dismissed;
      slotOverlay.root.classList.add("leaving");
      await wait(260);
      slotOverlay.root.remove();
      controls.classList.remove("bonus-slot-mode");
      clone.classList.add("waiting-purchase");
      updateSpinButton();
    }

    const promptControls = {
      clear,
      grantFreeSpin() {
        freeBonusSpins += 1;
        updateSpinButton();
      },
      setPurchaseDiscount(discountPercent) {
        purchaseOptions = { ...purchaseOptions, discountPercent };
        const discountedPrice = Math.ceil(cardPrice * ((100 - discountPercent) / 100));
        purchaseButton.textContent = `Buy ${discountedPrice.toLocaleString("en-US")}`;
        setStatus(`${discountPercent}% off this card`);
      },
      setPurchaseFree() {
        purchaseOptions = { ...purchaseOptions, free: true };
        purchaseButton.textContent = "Claim Free";
        setStatus("This card is free");
      },
      setSpinEnabled: updateSpinButton,
      setStatus,
      startBonusSlotMachine
    };

    purchaseButton.textContent = cardPrice ? `Buy ${cardPrice.toLocaleString("en-US")}` : "Purchase";
    status.textContent = cardPrice ? `${cardPrice.toLocaleString("en-US")} chips` : "";
    updateSpinButton();
    spinButton.addEventListener("click", () => {
      const hasFreeSpin = freeBonusSpins > 0;

      if (hasFreeSpin) {
        freeBonusSpins -= 1;
      }

      spinButton.disabled = true;
      setStatus("Bonus slots spinning");
      onSpin?.(activeCardElement, promptControls, { freeSpin: hasFreeSpin });
    });
    purchaseButton.addEventListener("click", () => {
      const result = onPurchase?.(activeCardElement, purchaseOptions);
      if (result?.message) {
        status.textContent = result.message;
      }

      if (result?.success !== false) {
        clear();
      }
    });
    controls.querySelector(".pass").addEventListener("click", () => {
      onPass?.(activeCardElement);
      clear();
    });

    layer.replaceChildren(clone, controls);
    layer.classList.add("active");

    activeAnimation = clone.animate(
      [
        {
          left: `${sourceLeft}px`,
          top: `${sourceTop}px`,
          width: `${sourceRect.width}px`,
          height: `${sourceRect.height}px`,
          transform: "rotateY(0deg) rotateZ(0deg) translateZ(0) scale(1)",
          opacity: 0
        },
        {
          left: `${sourceLeft}px`,
          top: `${sourceTop}px`,
          width: `${sourceRect.width}px`,
          height: `${sourceRect.height}px`,
          transform: "rotateY(0deg) rotateZ(0deg) translateZ(0) scale(1)",
          opacity: 0.92,
          offset: 0.08
        },
        {
          left: `${sourceLeft + sourceRect.width * 0.2}px`,
          top: `${sourceTop - 72}px`,
          width: `${sourceRect.width * 1.4}px`,
          height: `${sourceRect.height * 1.4}px`,
          transform: "rotateY(0deg) rotateZ(-8deg) translateZ(80px) scale(1.15)",
          opacity: 1,
          offset: 0.32
        },
        {
          left: `${sourceLeft + sourceRect.width * 0.35}px`,
          top: `${sourceTop - 86}px`,
          width: `${sourceRect.width * 1.46}px`,
          height: `${sourceRect.height * 1.46}px`,
          transform: "rotateY(150deg) rotateZ(-14deg) translateZ(100px) scale(1.12)",
          opacity: 1,
          offset: 0.56
        },
        {
          left: `${targetLeft}px`,
          top: `${targetTop}px`,
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          transform: "rotateY(360deg) rotateZ(4deg) translateZ(140px) scale(1)",
          opacity: 1
        }
      ],
      {
        duration: 860,
        easing: "cubic-bezier(0.16, 0.84, 0.22, 1)",
        fill: "forwards"
      }
    );

    activeAnimation.addEventListener("finish", () => {
      clone.classList.add("waiting-purchase");
      controls.hidden = false;
    });
  }

  function clear() {
    layer.classList.remove("active");
    layer.replaceChildren();
    activeAnimation = null;
    activeCardElement = null;
  }

  return {
    play,
    clear
  };
}

function createBonusSlotMachineElement(prize) {
  const root = document.createElement("div");
  const symbol = getPrizeSymbol(prize);
  let resolveDismissed;
  const dismissed = new Promise((resolve) => {
    resolveDismissed = resolve;
  });
  root.className = "bonus-slot-overlay";
  root.innerHTML = `
    <aside class="bonus-prize-info" aria-live="polite">
      <button class="bonus-prize-close" type="button" aria-label="Close prize details">X</button>
      <strong>${prize.label}</strong>
      <span>${getPrizeDescription(prize)}</span>
    </aside>
    <div class="bonus-slot-machine" data-prize="${prize.type}">
      <div class="bonus-slot-sign">BONUS</div>
      <div class="bonus-slot-window" aria-hidden="true">
        ${[0, 1, 2].map((index) => `
          <div class="bonus-slot-reel" style="--reel-index:${index}">
            <div class="bonus-slot-strip">
              ${buildReelSymbols(symbol, index)}
            </div>
          </div>
        `).join("")}
        <span class="bonus-slot-win-line"></span>
      </div>
      <span class="bonus-slot-handle"></span>
      <div class="bonus-slot-lamps" aria-hidden="true">${Array.from({ length: 7 }, () => "<i></i>").join("")}</div>
    </div>
    <strong class="bonus-slot-result">${prize.label}</strong>
  `;
  const closeButton = root.querySelector(".bonus-prize-close");
  closeButton.disabled = true;
  closeButton.addEventListener("click", () => resolveDismissed());
  return { root, reels: [...root.querySelectorAll(".bonus-slot-reel")], closeButton, dismissed };
}

function getFeaturedCardClasses(cardElement) {
  return ["red", "black", "wild", "mystery"]
    .filter((className) => cardElement.classList.contains(className))
    .join(" ");
}

function getFrameRect(layer) {
  const shell = layer.closest(".app-shell");
  return shell?.getBoundingClientRect() || {
    left: 0,
    top: 0,
    width: window.innerWidth,
    height: window.innerHeight
  };
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runBonusSlotReels(reels) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    reels.forEach((reel) => reel.classList.add("locked"));
    return;
  }

  reels.forEach((reel) => reel.classList.add("spinning"));
  await wait(1480);

  for (const reel of reels) {
    reel.classList.remove("spinning");
    reel.classList.add("locking");
    await wait(240);
    reel.classList.remove("locking");
    reel.classList.add("locked");
  }

  await wait(260);
}

function buildReelSymbols(finalSymbol, reelIndex) {
  const pool = [
    { icon: "7", label: "JACKPOT" },
    { icon: "$", label: "CHIPS" },
    { icon: "RP", label: "POINTS" },
    { icon: "50", label: "OFF" },
    { icon: "PIC", label: "PICK" },
    { icon: "NO", label: "LOSE" }
  ];
  const sequence = Array.from({ length: 10 }, (_, index) => pool[(index + reelIndex * 2) % pool.length]);
  sequence.push(finalSymbol);

  return sequence.map((symbol, index) => `
    <span class="bonus-slot-symbol ${index === sequence.length - 1 ? "final" : ""}">
      <b>${symbol.icon}</b>
      <small>${symbol.label}</small>
    </span>
  `).join("");
}

function getPrizeSymbol(prize) {
  const symbols = {
    "free-card": { icon: "A", label: "FREE" },
    discount: { icon: "50", label: "OFF" },
    "no-win": { icon: "NO", label: "WIN" },
    "spin-again": { icon: "SPIN", label: "AGAIN" },
    bogo: { icon: "B1G1", label: "50" },
    pic: { icon: "PIC", label: "CARD" },
    "free-roll": { icon: "ROLL", label: "FREE" },
    rp: { icon: "100", label: "RP" },
    bankruptcy: { icon: "0", label: "BANKRUPT" },
    shield: { icon: "SHLD", label: "BLOCK" },
    steal: { icon: "STEAL", label: "TAKE" }
  };

  return symbols[prize.type] || { icon: "7", label: "BONUS" };
}

function getPrizeDescription(prize) {
  const descriptions = {
    "free-card": "Claim the landed card without paying chips.",
    discount: "Buy this landed card for half price.",
    "no-win": "No bonus this spin.",
    "spin-again": "Take one extra bonus spin for free.",
    bogo: "Save a Buy 1 Get 1 50% Off bonus.",
    pic: "Save a PIC card bonus for a future chosen roll.",
    "free-roll": "Save a free roll bonus.",
    rp: "Add 100 RP to your total.",
    bankruptcy: "Lose all current RP.",
    shield: "Save a shield bonus.",
    steal: "Save a steal bonus."
  };

  return descriptions[prize.type] || "Bonus applied.";
}

function getFeaturedCardMarkup(cardElement) {
  const rank = cardElement.dataset.rank || "";
  const suit = cardElement.dataset.suit || "";
  const price = Number.parseInt(cardElement.dataset.cardPrice || "0", 10) || 0;
  const sellPrice = Number.parseInt(cardElement.dataset.sellPrice || "0", 10) || 0;
  const penalty = Number.parseInt(cardElement.dataset.penalty || "0", 10) || 0;
  const multiplier = cardElement.dataset.multiplier || "x1.0";
  const cardName = cardElement.dataset.cardName || `${rank} ${suit}`;

  return `
    <div class="featured-card-face">
      <div class="featured-card-corner">
        <span>${rank}</span>
        <strong>${getSuitIcon(suit)}</strong>
      </div>
      <div class="featured-card-main">
        <span>${rank}</span>
        <strong>${getSuitIcon(suit)}</strong>
      </div>
      <dl class="featured-card-stats" aria-label="${cardName} details">
        <div><dt>Cost</dt><dd>${formatChips(price)}</dd></div>
        <div><dt>Sell</dt><dd>${formatChips(sellPrice)}</dd></div>
        <div><dt>Penalty</dt><dd>${formatChips(penalty)}</dd></div>
        <div><dt>Hands</dt><dd>${multiplier}</dd></div>
      </dl>
    </div>
  `;
}

function getSuitIcon(suit) {
  const icons = {
    H: "\u2665",
    D: "\u2666",
    C: "\u2663",
    S: "\u2660"
  };

  return icons[suit] || "";
}

function formatChips(value) {
  return Number(value).toLocaleString("en-US");
}
