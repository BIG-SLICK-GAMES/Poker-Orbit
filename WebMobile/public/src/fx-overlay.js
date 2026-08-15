export function createFxOverlayModule({
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

  return {
    playTokenTrail
  };
}
