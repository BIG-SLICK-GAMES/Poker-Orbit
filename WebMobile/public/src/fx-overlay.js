export function createFxOverlayModule({
  layer,
  tokenLayer,
  getTokenPosition,
  playerColors,
  boardSpaceCount
}) {
  function playTokenTrail({ playerIndex = 0, fromIndex = 0, toIndex = 0, durationMs = 520, delayMs = 0 }) {
    if (!tokenLayer || !getTokenPosition || durationMs <= 0) {
      return;
    }

    const color = playerColors[playerIndex] || "#24d8ff";
    const distance = (toIndex - fromIndex + boardSpaceCount) % boardSpaceCount;
    const particleCount = Math.min(30, Math.max(10, distance * 3));

    window.setTimeout(() => {
      for (let index = 0; index < particleCount; index += 1) {
        const progress = particleCount === 1 ? 1 : index / (particleCount - 1);
        const boardIndex = (fromIndex + distance * progress) % boardSpaceCount;
        const position = getTokenPosition(boardIndex);
        const particle = document.createElement("span");
        particle.className = "token-comet-particle";
        particle.style.left = `${position.x}%`;
        particle.style.top = `${position.y}%`;
        particle.style.setProperty("--fx-color", color);
        particle.style.setProperty("--fx-delay", `${progress * durationMs * 0.72}ms`);
        particle.style.setProperty("--fx-life", `${Math.max(360, durationMs * 0.76)}ms`);
        particle.style.setProperty("--fx-scale", String(1 - progress * 0.46));
        tokenLayer.append(particle);
        particle.addEventListener("animationend", () => particle.remove(), { once: true });
      }
    }, delayMs);
  }

  async function playPurchaseCelebration({ featuredCard, cardElement, playerIndex = 0 }) {
    if (!layer || (!featuredCard && !cardElement)) {
      return;
    }

    const color = playerColors[playerIndex] || "#24d8ff";
    const source = featuredCard || cardElement;
    const clone = source.cloneNode(true);
    const sourceRect = source.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const left = sourceRect.left - layerRect.left;
    const top = sourceRect.top - layerRect.top;

    clone.classList.add("purchase-fx-card");
    clone.classList.remove("waiting-purchase");
    clone.removeAttribute("data-control");
    clone.style.left = `${left}px`;
    clone.style.top = `${top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.setProperty("--fx-color", color);
    clone.style.setProperty("--fx-exit-x", `${layerRect.width * 0.72}px`);
    clone.style.setProperty("--fx-exit-y", `${-Math.max(180, layerRect.height * 0.34)}px`);
    layer.append(clone);

    featuredCard?.classList.add("purchase-fx-source");
    cardElement?.classList.add("purchase-fx-owned");
    cardElement?.style.setProperty("--owner-color", color);

    const animation = clone.animate(
      [
        {
          transform: "translate3d(0, 0, 0) rotateY(0deg) rotateZ(0deg) scale(1)",
          filter: "brightness(1) saturate(1)",
          opacity: 1
        },
        {
          transform: "translate3d(0, -38px, 120px) rotateY(180deg) rotateZ(-9deg) scale(1.18)",
          filter: "brightness(1.45) saturate(1.5)",
          opacity: 1,
          offset: 0.34
        },
        {
          transform: "translate3d(16px, -22px, 160px) rotateY(360deg) rotateZ(8deg) scale(1.12)",
          filter: "brightness(1.35) saturate(1.42)",
          opacity: 1,
          offset: 0.58
        },
        {
          transform: `translate3d(var(--fx-exit-x), var(--fx-exit-y), 220px) rotateY(720deg) rotateZ(28deg) scale(0.62)`,
          filter: "brightness(1.65) saturate(1.65)",
          opacity: 0
        }
      ],
      {
        duration: 920,
        easing: "cubic-bezier(0.18, 0.92, 0.22, 1)",
        fill: "forwards"
      }
    );

    await animation.finished.catch(() => {});
    clone.remove();
    featuredCard?.classList.remove("purchase-fx-source");
  }

  return {
    playPurchaseCelebration,
    playTokenTrail
  };
}
