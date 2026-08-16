export function createOpponentHudModule({
  root,
  playerColors = [],
  boardSpaceCount = 54,
  getPlayer = () => ({ chips: 0, cards: [] }),
  getBestCards = () => [],
  suitIcons = {}
} = {}) {
  function update(turnState) {
    if (!root || !turnState) {
      return;
    }

    const activePlayer = turnState.currentPlayer || 0;
    const activePosition = turnState.playerPositions?.[activePlayer] || 0;
    const opponents = Array.from({ length: turnState.playerCount || playerColors.length }, (_, index) => index)
      .filter((playerIndex) => playerIndex !== activePlayer);

    root.replaceChildren(...opponents.map((playerIndex) => {
      const player = getPlayer(playerIndex);
      const position = turnState.playerPositions?.[playerIndex] || 0;
      const spacesAhead = getSpacesAhead(activePosition, position);
      const bestCard = getBestCards(player.cards)[0] || null;
      return createOpponentTile({
        playerIndex,
        color: playerColors[playerIndex] || "#24d8ff",
        chips: player.chips,
        cardCount: player.cards.length,
        bestCard,
        spacesAhead
      });
    }));
  }

  function getSpacesAhead(activePosition, opponentPosition) {
    return ((opponentPosition - activePosition) + boardSpaceCount) % boardSpaceCount;
  }

  function createOpponentTile({ playerIndex, color, chips, cardCount, bestCard, spacesAhead }) {
    const tile = document.createElement("article");
    tile.className = "opponent-hud-card";
    tile.style.setProperty("--opponent-color", color);
    tile.setAttribute("aria-label", `Player ${playerIndex + 1} is ${spacesAhead} spaces ahead`);

    tile.innerHTML = `
      <span class="opponent-token"><span>P${playerIndex + 1}</span></span>
      <span class="opponent-main">
        <strong>Player ${playerIndex + 1}</strong>
        <span>${formatSpaces(spacesAhead)}</span>
      </span>
      ${createBestCardMarkup(bestCard)}
      <span class="opponent-stats">
        <span>${formatChips(chips)}</span>
        <span>${cardCount} cards</span>
      </span>
    `;
    return tile;
  }

  function createBestCardMarkup(card) {
    if (!card) {
      return `<span class="opponent-best-card empty">--</span>`;
    }

    const isRed = card.suit === "H" || card.suit === "D";
    return `
      <span class="opponent-best-card ${isRed ? "red" : "black"}" title="${card.name || `${card.rank} ${card.suit}`}">
        <span>${card.rank}</span>
        <strong>${suitIcons[card.suit] || ""}</strong>
      </span>
    `;
  }

  function formatSpaces(spacesAhead) {
    if (spacesAhead === 0) {
      return "Same space";
    }

    return `${spacesAhead} ahead`;
  }

  function formatChips(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  return {
    update
  };
}
