export function createFxOverlayModule({
  tokenLayer,
  getTokenPosition,
  playerColors,
  boardSpaceCount
}) {
  const activeTrails = new Set();
  const pendingTrailTimers = new Set();
  const maxActiveTrails = isMobileViewport() ? 1 : 3;

  function playTokenTrail({ playerIndex = 0, fromIndex = 0, toIndex = 0, durationMs = 520, delayMs = 0 }) {
    if (!tokenLayer || !getTokenPosition || durationMs <= 0) {
      return;
    }

    if (isMobileViewport()) {
      return;
    }

    const color = playerColors[playerIndex] || "#24d8ff";
    const distance = (toIndex - fromIndex + boardSpaceCount) % boardSpaceCount;
    const pointCount = isMobileViewport()
      ? Math.min(28, Math.max(10, distance * 3))
      : Math.min(80, Math.max(18, distance * 7));
    const points = Array.from({ length: pointCount }, (_, index) => {
      const progress = pointCount === 1 ? 1 : index / (pointCount - 1);
      const position = getTokenPosition((fromIndex + distance * progress) % boardSpaceCount);
      return `${position.x.toFixed(3)},${position.y.toFixed(3)}`;
    });

    const timer = window.setTimeout(() => {
      pendingTrailTimers.delete(timer);
      trimActiveTrails(maxActiveTrails - 1);

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const glowPath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      const corePath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      const headPath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");

      svg.classList.add("token-comet-arc");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("aria-hidden", "true");
      svg.style.setProperty("--fx-color", color);
      svg.style.setProperty("--fx-duration", `${Math.max(460, durationMs * 0.92)}ms`);

      [glowPath, corePath, headPath].forEach((path) => {
        path.setAttribute("points", points.join(" "));
        path.setAttribute("pathLength", "100");
      });
      glowPath.classList.add("token-comet-path", "glow");
      corePath.classList.add("token-comet-path", "core");
      headPath.classList.add("token-comet-path", "head");

      svg.append(glowPath, corePath, headPath);
      tokenLayer.append(svg);
      activeTrails.add(svg);

      const cleanupTimer = window.setTimeout(() => removeTrail(svg), Math.max(900, durationMs + 360));
      svg.addEventListener("animationend", () => {
        window.clearTimeout(cleanupTimer);
        removeTrail(svg);
      }, { once: true });
    }, delayMs);
    pendingTrailTimers.add(timer);
  }

  function clear() {
    pendingTrailTimers.forEach((timer) => window.clearTimeout(timer));
    pendingTrailTimers.clear();
    activeTrails.forEach(removeTrail);
  }

  function trimActiveTrails(maxCount) {
    while (activeTrails.size > maxCount) {
      removeTrail(activeTrails.values().next().value);
    }
  }

  function removeTrail(svg) {
    if (!svg) {
      return;
    }

    activeTrails.delete(svg);
    svg.getAnimations?.({ subtree: true }).forEach((animation) => animation.cancel());
    svg.remove();
  }

  function isMobileViewport() {
    return window.matchMedia?.("(max-width: 540px), (pointer: coarse)")?.matches ?? false;
  }

  return {
    clear,
    playTokenTrail
  };
}
