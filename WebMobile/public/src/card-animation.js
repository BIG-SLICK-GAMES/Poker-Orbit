import { getBonusIconSrc } from "./bonus-icons.js";

export function createCardAnimationModule({ layer, canSpin, onSpin, onPurchase, onPass }) {
  let activeAnimation = null;
  let activeCardElement = null;
  let activeCardClone = null;
  let activeCardTarget = null;

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
    const bonusFrame = document.createElement("div");
    const clone = cardElement.cloneNode(true);
    activeCardTarget = { left: targetLeft, top: targetTop, width: targetWidth, height: targetHeight };
    activeCardClone = clone;

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
    bonusFrame.className = "bonus-spin-frame";
    bonusFrame.hidden = true;
    bonusFrame.innerHTML = `
      <span class="bonus-frame-burst">Bonus Spin</span>
    `;
    const spinButton = controls.querySelector(".spin");
    const purchaseButton = controls.querySelector(".purchase");
    const status = controls.querySelector(".featured-card-status");
    const cardPrice = Number.parseInt(cardElement.dataset.cardPrice || "0", 10) || 0;
    let freeBonusSpins = 0;
    let purchaseOptions = {};
    purchaseButton.textContent = cardPrice ? `Buy ${cardPrice.toLocaleString("en-US")}` : "Purchase";
    status.textContent = cardPrice ? `${cardPrice.toLocaleString("en-US")} chips` : "";
    spinButton.disabled = !canSpin?.(cardElement);
    spinButton.addEventListener("click", () => {
      const isFreeSpin = freeBonusSpins > 0;
      if (isFreeSpin) {
        freeBonusSpins -= 1;
      }
      controls.classList.toggle("spin-again-ready", freeBonusSpins > 0);
      spinButton.disabled = true;
      moveFocusedCardAside(clone);
      controls.classList.add("bonus-mode");
      bonusFrame.hidden = false;
      layer.classList.add("bonus-active");
      status.textContent = "Spinning...";
      onSpin?.(activeCardElement, {
        clear,
        revealBonus: (message, type) => {
          revealBonusPrize(layer, message, type);
        },
        grantFreeSpin: () => {
          freeBonusSpins += 1;
          spinButton.disabled = false;
          controls.classList.add("spin-again-ready");
        },
        setPurchaseDiscount: (discountPercent) => {
          const discountedPrice = Math.ceil(cardPrice * ((100 - discountPercent) / 100));
          purchaseOptions = { ...purchaseOptions, discountPercent };
          purchaseButton.textContent = `Buy ${discountedPrice.toLocaleString("en-US")}`;
        },
        setPurchaseFree: () => {
          purchaseOptions = { ...purchaseOptions, free: true };
          purchaseButton.textContent = "Claim Free";
        },
        setSpinEnabled: (enabled) => {
          spinButton.disabled = !enabled;
        },
        setStatus: (message) => {
          status.textContent = message;
        }
      }, { freeSpin: isFreeSpin });
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

    layer.replaceChildren(bonusFrame, clone, controls);
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
    layer.classList.remove("bonus-active");
    layer.replaceChildren();
    activeAnimation = null;
    activeCardElement = null;
    activeCardClone = null;
    activeCardTarget = null;
  }

  function revealBonusPrize(targetLayer, message, type) {
    const innerWheel = document.querySelector("#innerWheel");
    const wheelRect = innerWheel?.getBoundingClientRect();
    const startLeft = wheelRect ? wheelRect.left + wheelRect.width / 2 : window.innerWidth / 2;
    const startTop = wheelRect ? wheelRect.top + wheelRect.height / 2 : window.innerHeight / 2;
    const targetWidth = Math.min(250, window.innerWidth * 0.66);
    const targetLeft = (window.innerWidth - targetWidth) / 2;
    const targetTop = Math.max(74, window.innerHeight * 0.16);
    const existingPrize = targetLayer.querySelector(".bonus-prize-flight");

    if (existingPrize) {
      existingPrize.remove();
    }

    const prize = document.createElement("div");
    prize.className = "bonus-prize-flight";
    prize.dataset.prizeType = type || "";
    prize.innerHTML = getBonusPrizeMarkup(message, type);
    prize.style.left = `${startLeft}px`;
    prize.style.top = `${startTop}px`;
    prize.style.width = `${Math.max(84, targetWidth * 0.44)}px`;
    targetLayer.append(prize);
    prize.querySelector("[data-dismiss-bonus]").addEventListener("click", () => {
      prize.remove();
      targetLayer.querySelector(".bonus-spin-frame")?.setAttribute("hidden", "");
      targetLayer.classList.remove("bonus-active");
      restoreFocusedCardFromAside();
    });

    prize.animate(
      [
        {
          left: `${startLeft}px`,
          top: `${startTop}px`,
          width: `${Math.max(84, targetWidth * 0.44)}px`,
          transform: "translate(-50%, -50%) rotateZ(-14deg) scale(0.42)",
          opacity: 0
        },
        {
          left: `${startLeft}px`,
          top: `${startTop - 48}px`,
          transform: "translate(-50%, -50%) rotateZ(12deg) scale(1.08)",
          opacity: 1,
          offset: 0.42
        },
        {
          left: `${targetLeft}px`,
          top: `${targetTop}px`,
          width: `${targetWidth}px`,
          transform: "translate(0, 0) rotateZ(2deg) scale(1)",
          opacity: 1
        }
      ],
      {
        duration: 720,
        easing: "cubic-bezier(0.16, 0.84, 0.22, 1)",
        fill: "forwards"
      }
    );
  }

  function moveFocusedCardAside(cardElement) {
    const rect = cardElement.getBoundingClientRect();
    const targetWidth = Math.min(138, window.innerWidth * 0.34);
    const targetHeight = targetWidth * 1.46;
    const targetLeft = Math.min(window.innerWidth - targetWidth - 12, window.innerWidth * 0.61);
    const targetTop = Math.max(36, window.innerHeight * 0.11);

    activeAnimation?.cancel();
    cardElement.classList.remove("waiting-purchase");
    cardElement.classList.add("bonus-card-aside");
    cardElement.animate(
      [
        {
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          transform: "rotateY(360deg) rotateZ(4deg) translateZ(140px) scale(1)",
          opacity: 1
        },
        {
          left: `${targetLeft}px`,
          top: `${targetTop}px`,
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          transform: "rotateY(360deg) rotateZ(12deg) translateZ(140px) scale(1)",
          opacity: 0.94
        }
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.16, 0.9, 0.22, 1)",
        fill: "forwards"
      }
    );
  }

  function restoreFocusedCardFromAside() {
    if (!activeCardClone || !activeCardTarget) {
      return;
    }

    const rect = activeCardClone.getBoundingClientRect();
    activeCardClone.classList.remove("bonus-card-aside");
    activeCardClone.animate(
      [
        {
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          transform: "rotateY(360deg) rotateZ(12deg) translateZ(140px) scale(1)",
          opacity: 0.94
        },
        {
          left: `${activeCardTarget.left}px`,
          top: `${activeCardTarget.top}px`,
          width: `${activeCardTarget.width}px`,
          height: `${activeCardTarget.height}px`,
          transform: "rotateY(360deg) rotateZ(4deg) translateZ(140px) scale(1)",
          opacity: 1
        }
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.16, 0.84, 0.22, 1)",
        fill: "forwards"
      }
    ).addEventListener("finish", () => {
      activeCardClone?.classList.add("waiting-purchase");
    });
  }

  return {
    play,
    clear
  };
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

function getBonusPrizeMarkup(message, type) {
  const bonus = getBonusDetails(message, type);
  const imageSrc = getBonusIconSrc(message, type);

  return `
    <div class="bonus-prize-card">
      <span class="bonus-prize-kicker">Bonus</span>
      <span class="bonus-prize-icon ${bonus.iconClass}" aria-hidden="true">
        ${imageSrc ? `<img src="${imageSrc}" alt="">` : bonus.icon}
      </span>
      <strong>${bonus.title}</strong>
      <p>${bonus.description}</p>
      <button class="bonus-prize-dismiss" type="button" data-dismiss-bonus aria-label="Dismiss bonus">X</button>
    </div>
  `;
}

function getBonusDetails(message, type) {
  const details = {
    "Free Card": {
      title: "Free Card",
      icon: "FREE",
      iconClass: "text-icon",
      description: "Claim this card without spending chips."
    },
    "50% Off": {
      title: "50% Off",
      icon: "50%",
      iconClass: "text-icon",
      description: "Buy this card for half its normal price."
    },
    "NO WIN": {
      title: "No Win",
      icon: "NO",
      iconClass: "text-icon",
      description: "No bonus this time."
    },
    "Spin Again": {
      title: "Spin Again",
      icon: "AGAIN",
      iconClass: "text-icon",
      description: "Take one extra bonus wheel spin for free."
    },
    "Buy 1 Get 1 50% Off": {
      title: "Second Card 50% Off",
      icon: "2ND",
      iconClass: "text-icon",
      description: "This card is discounted now. The next-card bonus will be wired later."
    },
    "PIC Card": {
      title: "PIC Card",
      icon: "PIC",
      iconClass: "text-icon",
      description: "Keep this bonus. Later it lets you choose your roll."
    },
    "Free Roll": {
      title: "Free Roll",
      icon: "ROLL",
      iconClass: "text-icon",
      description: "Keep this bonus for a future roll."
    },
    "100 RP": {
      title: "100 RP",
      icon: "RP",
      iconClass: "text-icon",
      description: "Add 100 roll points to your total."
    },
    BANKRUPTCY: {
      title: "Bankruptcy",
      icon: "!",
      iconClass: "text-icon",
      description: "Lose all current roll points."
    },
    Shield: {
      title: "Shield",
      icon: getShieldSvg(),
      iconClass: "shield-icon",
      description: "Store this shield. It will protect you from a future penalty."
    },
    Steal: {
      title: "Steal",
      icon: "STEAL",
      iconClass: "text-icon",
      description: "Keep this bonus to steal from another player later."
    }
  };

  return details[message] || {
    title: message || "Bonus",
    icon: type === "shield" ? getShieldSvg() : "BONUS",
    iconClass: type === "shield" ? "shield-icon" : "text-icon",
    description: "Bonus effect held for later."
  };
}

function getShieldSvg() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2.7 19 5.4v5.5c0 4.7-2.8 8.7-7 10.4-4.2-1.7-7-5.7-7-10.4V5.4l7-2.7Z"></path>
      <path d="M12 5.5v12.1"></path>
    </svg>
  `;
}
