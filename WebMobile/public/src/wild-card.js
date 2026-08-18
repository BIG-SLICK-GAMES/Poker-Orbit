export function createWildCardModule({ boardRoot, getRankValue = () => 0 } = {}) {
  const activeWilds = new Map();

  function trackMovement(playerIndex, spaces) {
    const normalizedPlayerIndex = normalizePlayerIndex(playerIndex);
    const movedSpaces = Number.isFinite(spaces) ? Math.max(0, Math.trunc(spaces)) : 0;

    activeWilds.forEach((wildState, boardIndex) => {
      if (wildState.playerIndex !== normalizedPlayerIndex) {
        return;
      }

      wildState.spacesRemaining -= movedSpaces;
      if (wildState.spacesRemaining <= 0) {
        activeWilds.delete(boardIndex);
      }
    });
  }

  function registerWild(card, playerIndex) {
    if (!isWildCard(card)) {
      return;
    }

    const normalizedPlayerIndex = normalizePlayerIndex(playerIndex);
    activeWilds.set(card.boardIndex, {
      playerIndex: normalizedPlayerIndex,
      spacesRemaining: Number.parseInt(card.orbitDuration || "54", 10) || 54
    });
  }

  function transferWild(card, fromPlayerIndex, toPlayerIndex) {
    if (!isWildCard(card) || !activeWilds.has(card.boardIndex)) {
      return;
    }

    activeWilds.delete(card.boardIndex);
    registerWild(card, toPlayerIndex);
  }

  function isActiveWild(card, playerIndex) {
    if (!isWildCard(card)) {
      return false;
    }

    const wildState = activeWilds.get(card.boardIndex);
    return Boolean(wildState) && wildState.playerIndex === normalizePlayerIndex(playerIndex);
  }

  function resolveBestHand(cards, playerIndex, { getNaturalBestHand, compareScores }) {
    const baseCards = cards.filter((card) => !isWildCard(card));
    const naturalResult = getNaturalBestHand(baseCards);
    const activeWildCards = cards.filter((card) => isActiveWild(card, playerIndex));

    if (!activeWildCards.length) {
      return naturalResult;
    }

    const availableSubstitutes = getAvailableSubstituteCards();
    if (!availableSubstitutes.length) {
      return naturalResult;
    }

    let bestResult = naturalResult;

    visitSubstituteCombinations(activeWildCards, availableSubstitutes, (substitutes) => {
      const resolvedCards = [
        ...baseCards,
        ...substitutes.map((substitute, index) => createResolvedWildCard(activeWildCards[index], substitute))
      ];
      const result = getNaturalBestHand(resolvedCards);
      if (compareScores(result.score, bestResult.score) > 0) {
        bestResult = result;
      }
    });

    return bestResult;
  }

  function getAvailableSubstituteCards() {
    if (!boardRoot) {
      return [];
    }

    return [...boardRoot.querySelectorAll(".board-card")].reduce((cards, cardElement) => {
      const rank = cardElement.dataset.rank || "";
      const suit = cardElement.dataset.suit || "";
      const boardIndex = Number.parseInt(cardElement.dataset.index || "-1", 10);
      if (
        cardElement.dataset.purchaseState === "available"
        && cardElement.dataset.cardType !== "wild"
        && cardElement.dataset.cardType !== "mystery"
        && getRankValue(rank) > 0
        && suit
        && Number.isFinite(boardIndex)
      ) {
        cards.push({
          boardIndex,
          rank,
          suit,
          name: cardElement.dataset.cardName || `${rank} ${suit}`,
          price: Number.parseInt(cardElement.dataset.cardPrice || "0", 10) || 0,
          sellPrice: Number.parseInt(cardElement.dataset.sellPrice || "0", 10) || 0,
          penalty: Number.parseInt(cardElement.dataset.penalty || "0", 10) || 0,
          multiplier: cardElement.dataset.multiplier || "x1.0"
        });
      }
      return cards;
    }, []);
  }

  function visitSubstituteCombinations(wildCards, availableSubstitutes, onCombination) {
    const chosen = [];
    const usedBoardIndexes = new Set();

    function visit(wildIndex) {
      if (wildIndex >= wildCards.length) {
        onCombination([...chosen]);
        return;
      }

      availableSubstitutes.forEach((substitute) => {
        if (usedBoardIndexes.has(substitute.boardIndex)) {
          return;
        }

        usedBoardIndexes.add(substitute.boardIndex);
        chosen.push(substitute);
        visit(wildIndex + 1);
        chosen.pop();
        usedBoardIndexes.delete(substitute.boardIndex);
      });
    }

    visit(0);
  }

  function createResolvedWildCard(wildCard, substitute) {
    return {
      ...wildCard,
      rank: substitute.rank,
      suit: substitute.suit,
      name: `Wild as ${substitute.name}`,
      multiplier: substitute.multiplier,
      wildSubstitute: {
        boardIndex: substitute.boardIndex,
        rank: substitute.rank,
        suit: substitute.suit,
        name: substitute.name
      }
    };
  }

  function isWildCard(card) {
    return card?.type === "wild" || card?.cardType === "wild";
  }

  function normalizePlayerIndex(playerIndex) {
    const value = Number.isFinite(playerIndex) ? Math.trunc(playerIndex) : 0;
    return Math.max(0, value);
  }

  return {
    isActiveWild,
    registerWild,
    resolveBestHand,
    trackMovement,
    transferWild
  };
}
