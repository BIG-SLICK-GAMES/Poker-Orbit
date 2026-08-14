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
    const pointCount = Math.min(80, Math.max(18, distance * 7));
    const points = Array.from({ length: pointCount }, (_, index) => {
      const progress = pointCount === 1 ? 1 : index / (pointCount - 1);
      const position = getTokenPosition((fromIndex + distance * progress) % boardSpaceCount);
      return `${position.x.toFixed(3)},${position.y.toFixed(3)}`;
    });

    window.setTimeout(() => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const glowPath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      const corePath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");

      svg.classList.add("token-comet-arc");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("aria-hidden", "true");
      svg.style.setProperty("--fx-color", color);
      svg.style.setProperty("--fx-duration", `${Math.max(520, durationMs * 1.08)}ms`);

      [glowPath, corePath].forEach((path) => {
        path.setAttribute("points", points.join(" "));
        path.setAttribute("pathLength", "100");
      });
      glowPath.classList.add("token-comet-path", "glow");
      corePath.classList.add("token-comet-path", "core");

      svg.append(glowPath, corePath);
      tokenLayer.append(svg);
      svg.addEventListener("animationend", () => svg.remove(), { once: true });
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
          transform: "translate3d(0, -26px, 90px) rotateY(0deg) rotateZ(-4deg) scale(1.08)",
          filter: "brightness(1.26) saturate(1.24)",
          opacity: 1,
          offset: 0.22
        },
        {
          transform: "translate3d(0, -64px, 160px) rotateY(360deg) rotateZ(7deg) scale(1.24)",
          filter: "brightness(1.54) saturate(1.58)",
          opacity: 1,
          offset: 0.48
        },
        {
          transform: "translate3d(-10px, -44px, 130px) rotateY(540deg) rotateZ(-6deg) scale(1.16)",
          filter: "brightness(1.38) saturate(1.48)",
          opacity: 1,
          offset: 0.68
        },
        {
          transform: `translate3d(var(--fx-exit-x), var(--fx-exit-y), 220px) rotateY(720deg) rotateZ(28deg) scale(0.58)`,
          filter: "brightness(1.65) saturate(1.65)",
          opacity: 0
        }
      ],
      {
        duration: 1680,
        easing: "cubic-bezier(0.16, 0.88, 0.18, 1)",
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
