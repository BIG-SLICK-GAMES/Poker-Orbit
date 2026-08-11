export function createCardAnimationModule({ layer, onPurchase, onPass, onSpin, canSpin }) {
  let activeAnimation = null;
  let activeCardElement = null;
  let activeClone = null;
  let activeControls = null;

  function play(cardElement) {
    if (!cardElement || activeAnimation) {
      return;
    }

    activeCardElement = cardElement;
    const sourceRect = cardElement.getBoundingClientRect();
    const targetWidth = Math.min(218, Math.max(172, window.innerWidth * 0.52));
    const targetHeight = targetWidth * 1.46;
    const targetLeft = (window.innerWidth - targetWidth) / 2;
    const targetTop = Math.max(72, (window.innerHeight - targetHeight) * 0.34);
    const controls = document.createElement("div");
    const clone = cardElement.cloneNode(true);
    activeClone = clone;
    activeControls = controls;
    clone.classList.add("featured-card-flight");
    clone.removeAttribute("data-control");
    clone.removeAttribute("aria-label");
    clone.innerHTML = getFeaturedCardMarkup(cardElement);
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;

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

    async function startBonusWheel({ prizes, winningIndex, onComplete }) {
      if (!activeClone || !activeControls || !Array.isArray(prizes) || !prizes.length) {
        return;
      }

      const normalizedWinningIndex = ((winningIndex % prizes.length) + prizes.length) % prizes.length;
      await moveFeaturedCardAside(activeClone, activeControls);
      const wheel = createBonusWheelElement(prizes);
      layer.append(wheel.overlay);
      document.body.classList.add("bonus-wheel-active");
      await buildWheelSegments(wheel.segments);
      const prize = prizes[normalizedWinningIndex];
      await spinWheelToPrize(wheel.disc, wheel.comet, wheel.segments[normalizedWinningIndex], normalizedWinningIndex, prizes.length);
      setStatus(prize.label);
      onComplete?.(prize, { winningIndex: normalizedWinningIndex });
      await wait(780);
      wheel.overlay.classList.add("leaving");
      await wait(260);
      wheel.overlay.remove();
      document.body.classList.remove("bonus-wheel-active");
      await restoreFeaturedCard(activeClone, activeControls);
      updateSpinButton();
    }

    purchaseButton.textContent = cardPrice ? `Buy ${cardPrice.toLocaleString("en-US")}` : "Purchase";
    status.textContent = cardPrice ? `${cardPrice.toLocaleString("en-US")} chips` : "";
    updateSpinButton();
    spinButton.addEventListener("click", () => {
      const hasFreeSpin = freeBonusSpins > 0;

      if (hasFreeSpin) {
        freeBonusSpins -= 1;
      }

      spinButton.disabled = true;
      setStatus("Bonus wheel spinning");
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
      startBonusWheel
    };

    layer.replaceChildren(clone, controls);
    layer.classList.add("active");

    activeAnimation = clone.animate(
      [
        {
          left: `${sourceRect.left}px`,
          top: `${sourceRect.top}px`,
          width: `${sourceRect.width}px`,
          height: `${sourceRect.height}px`,
          transform: "rotateY(0deg) rotateZ(0deg) translateZ(0) scale(1)",
          opacity: 0.92
        },
        {
          left: `${sourceRect.left + sourceRect.width * 0.2}px`,
          top: `${sourceRect.top - 72}px`,
          width: `${sourceRect.width * 1.4}px`,
          height: `${sourceRect.height * 1.4}px`,
          transform: "rotateY(150deg) rotateZ(-14deg) translateZ(80px) scale(1.15)",
          opacity: 1,
          offset: 0.42
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
    document.body.classList.remove("bonus-wheel-active");
    layer.replaceChildren();
    activeAnimation = null;
    activeCardElement = null;
    activeClone = null;
    activeControls = null;
  }

  return {
    play,
    clear
  };

}

function createBonusWheelElement(prizes) {
  const overlay = document.createElement("div");
  const disc = document.createElement("div");
  const comet = document.createElement("span");
  const pointer = document.createElement("span");
  const title = document.createElement("strong");
  const segmentDegrees = 360 / prizes.length;
  overlay.className = "bonus-wheel-overlay";
  disc.className = "bonus-wheel-disc";
  comet.className = "bonus-wheel-comet";
  pointer.className = "bonus-wheel-pointer";
  title.className = "bonus-wheel-title";
  title.textContent = "Bonus Wheel";

  const segments = prizes.map((prize, index) => {
    const segment = document.createElement("span");
    segment.className = `bonus-wheel-segment ${prize.type}`;
    segment.style.setProperty("--segment-start", `${(index * segmentDegrees) - 90}deg`);
    segment.style.setProperty("--segment-rotation", `${(index * segmentDegrees) - 90 + (segmentDegrees / 2)}deg`);
    segment.style.setProperty("--segment-sweep", `${segmentDegrees}deg`);
    segment.style.setProperty("--segment-color", prize.color);
    segment.innerHTML = `
      <i class="bonus-wheel-wedge" aria-hidden="true"></i>
      <b>${prize.shortLabel || prize.label}</b>
    `;
    disc.append(segment);
    return segment;
  });

  disc.append(comet);
  overlay.append(title, pointer, disc);

  return { overlay, disc, comet, segments };
}

async function buildWheelSegments(segments) {
  for (let index = 0; index < segments.length; index += 1) {
    segments[index].classList.add("building", "lit");
    await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 22);
    segments[index].classList.remove("building");
    segments[index].classList.add("built");
    if (index > 0) {
      segments[index - 1].classList.remove("lit");
    }
  }

  segments.at(-1)?.classList.remove("lit");
}

async function spinWheelToPrize(disc, comet, winningSegment, winningIndex, segmentCount) {
  const segmentDegrees = 360 / segmentCount;
  const targetRotation = (360 * 5) - ((winningIndex + 0.5) * segmentDegrees);
  comet.classList.add("spinning");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    disc.style.transform = `rotate(${targetRotation}deg)`;
  } else {
    await disc.animate(
      [
        { transform: "rotate(0deg)", offset: 0 },
        { transform: "rotate(1800deg)", offset: 0.38 },
        { transform: `rotate(${targetRotation}deg)`, offset: 1 }
      ],
      {
        duration: 4300,
        easing: "cubic-bezier(0.08, 0.7, 0.12, 1)",
        fill: "forwards"
      }
    ).finished;
  }

  comet.classList.remove("spinning");
  winningSegment.classList.add("winning", "lit");
}

async function moveFeaturedCardAside(card, controls) {
  card.classList.remove("waiting-purchase");
  controls.classList.add("bonus-mode");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    card.classList.add("bonus-aside");
    return;
  }

  await card.animate(
    [
      { transform: card.style.transform || "rotateY(360deg) rotateZ(4deg) translateZ(140px) scale(1)" },
      { transform: "translateX(min(31vw, 260px)) translateY(-18vh) rotateY(360deg) rotateZ(12deg) translateZ(140px) scale(0.54)" }
    ],
    {
      duration: 420,
      easing: "cubic-bezier(0.16, 0.84, 0.22, 1)",
      fill: "forwards"
    }
  ).finished;

  card.classList.add("bonus-aside");
}

async function restoreFeaturedCard(card, controls) {
  controls.classList.remove("bonus-mode");
  card.classList.remove("bonus-aside");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    card.classList.add("waiting-purchase");
    return;
  }

  await card.animate(
    [
      { transform: "translateX(min(31vw, 260px)) translateY(-18vh) rotateY(360deg) rotateZ(12deg) translateZ(140px) scale(0.54)" },
      { transform: "rotateY(360deg) rotateZ(4deg) translateZ(140px) scale(1)" }
    ],
    {
      duration: 320,
      easing: "cubic-bezier(0.16, 0.84, 0.22, 1)",
      fill: "forwards"
    }
  ).finished;

  card.classList.add("waiting-purchase");
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
