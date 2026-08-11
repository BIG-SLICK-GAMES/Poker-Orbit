export function createCardAnimationModule({ layer, onPurchase, onPass }) {
  let activeAnimation = null;
  let activeCardElement = null;

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
      <button class="featured-card-action purchase" type="button">Purchase</button>
      <button class="featured-card-action pass" type="button">Pass</button>
      <span class="featured-card-status" aria-live="polite"></span>
    `;
    const purchaseButton = controls.querySelector(".purchase");
    const status = controls.querySelector(".featured-card-status");
    const cardPrice = Number.parseInt(cardElement.dataset.cardPrice || "0", 10) || 0;
    let purchaseOptions = {};
    purchaseButton.textContent = cardPrice ? `Buy ${cardPrice.toLocaleString("en-US")}` : "Purchase";
    status.textContent = cardPrice ? `${cardPrice.toLocaleString("en-US")} chips` : "";
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
    layer.replaceChildren();
    activeAnimation = null;
    activeCardElement = null;
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
