export function createPlayerThemeOverlayModule({ shell, playerColors = [], enabled = true } = {}) {
  const overlay = document.createElement("div");
  overlay.className = "player-theme-overlay";
  overlay.setAttribute("aria-hidden", "true");
  shell?.prepend(overlay);

  let isEnabled = Boolean(enabled);
  let activePlayer = 0;

  function setEnabled(nextEnabled) {
    isEnabled = Boolean(nextEnabled);
    apply();
  }

  function update(turnState) {
    activePlayer = normalizePlayerIndex(turnState?.currentPlayer || 0);
    apply();
  }

  function apply() {
    if (!shell) {
      return;
    }

    const color = playerColors[activePlayer] || playerColors[0] || "#24d8ff";
    shell.style.setProperty("--active-player-color", color);
    shell.dataset.activePlayer = String(activePlayer + 1);
    shell.classList.toggle("player-theme-active", isEnabled);
  }

  function normalizePlayerIndex(playerIndex) {
    if (!playerColors.length) {
      return 0;
    }

    return ((playerIndex % playerColors.length) + playerColors.length) % playerColors.length;
  }

  apply();

  return {
    setEnabled,
    update
  };
}
