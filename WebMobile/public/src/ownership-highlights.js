export function createOwnershipHighlightModule({ boardRoot, getPlayerColor = () => "#24d8ff" }) {
  const ownedCards = new Map();

  function markPurchased(cardElement, playerIndex) {
    if (!cardElement) {
      return;
    }

    const boardIndex = Number.parseInt(cardElement.dataset.index || "-1", 10);
    if (!Number.isFinite(boardIndex) || boardIndex < 0) {
      return;
    }

    ownedCards.set(boardIndex, playerIndex);
    cardElement.dataset.purchaseState = "purchased";
    cardElement.dataset.owner = String(playerIndex + 1);
    cardElement.style.setProperty("--owner-color", getPlayerColor(playerIndex));
    cardElement.classList.add("purchased", `owned-by-player-${playerIndex + 1}`);
    cardElement.setAttribute("aria-label", `${cardElement.dataset.cardName || "Card"} owned by Player ${playerIndex + 1}`);
  }

  function clear(cardElement) {
    if (!cardElement) {
      return;
    }

    const boardIndex = Number.parseInt(cardElement.dataset.index || "-1", 10);
    ownedCards.delete(boardIndex);
    cardElement.dataset.purchaseState = "available";
    cardElement.removeAttribute("data-owner");
    cardElement.style.removeProperty("--owner-color");
    cardElement.classList.remove(
      "purchased",
      "owned-by-player-1",
      "owned-by-player-2",
      "owned-by-player-3",
      "owned-by-player-4"
    );
  }

  function getOwner(boardIndex) {
    return ownedCards.get(boardIndex) ?? null;
  }

  function syncFromDom() {
    ownedCards.clear();
    boardRoot.querySelectorAll(".board-card[data-owner]").forEach((cardElement) => {
      const boardIndex = Number.parseInt(cardElement.dataset.index || "-1", 10);
      const playerNumber = Number.parseInt(cardElement.dataset.owner || "0", 10);
      if (Number.isFinite(boardIndex) && boardIndex >= 0 && playerNumber > 0) {
        const playerIndex = playerNumber - 1;
        ownedCards.set(boardIndex, playerIndex);
        cardElement.style.setProperty("--owner-color", getPlayerColor(playerIndex));
      }
    });
  }

  function refreshColors() {
    ownedCards.forEach((playerIndex, boardIndex) => {
      const cardElement = boardRoot.querySelector(`.board-card[data-index="${boardIndex}"]`);
      cardElement?.style.setProperty("--owner-color", getPlayerColor(playerIndex));
    });
  }

  return {
    clear,
    getOwner,
    markPurchased,
    refreshColors,
    syncFromDom
  };
}
