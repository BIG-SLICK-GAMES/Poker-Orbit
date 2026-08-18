const rankPriceMap = {
  "2": 200,
  "3": 300,
  "4": 400,
  "5": 500,
  "6": 600,
  "7": 700,
  "8": 800,
  "9": 900,
  "10": 1000,
  J: 1100,
  Q: 1200,
  K: 1300,
  A: 1300
};

export function createPurchaseAuctionModule({
  playerCount,
  startingChips = 10000,
  handRoot,
  chipsLabel,
  cardCountLabel,
  bestHandLabel,
  suitIcons,
  getBestHandCards = () => [],
  getBestHandName = () => "No Cards"
}) {
  const players = Array.from({ length: playerCount }, () => ({
    chips: startingChips,
    cards: []
  }));
  const ownedBoardCards = new Map();
  let activePlayer = 0;

  function getCardPrice(card) {
    return rankPriceMap[card?.rank] || 0;
  }

  function getCardFromElement(cardElement) {
    if (!cardElement) {
      return null;
    }

    return {
      boardIndex: Number.parseInt(cardElement.dataset.index || "-1", 10),
      rank: cardElement.dataset.rank || "",
      suit: cardElement.dataset.suit || "",
      type: cardElement.dataset.cardType || "",
      name: cardElement.dataset.cardName || "",
      price: Number.parseInt(cardElement.dataset.cardPrice || "0", 10) || 0,
      sellPrice: Number.parseInt(cardElement.dataset.sellPrice || "0", 10) || 0,
      penalty: Number.parseInt(cardElement.dataset.penalty || "0", 10) || 0,
      multiplier: cardElement.dataset.multiplier || "x1.0",
      orbitDuration: Number.parseInt(cardElement.dataset.orbitDuration || "0", 10) || 0
    };
  }

  function canPurchase(cardElement, playerIndex = activePlayer, options = {}) {
    const card = getCardFromElement(cardElement);
    if (!card || !Number.isFinite(card.boardIndex) || card.boardIndex < 0) {
      return false;
    }

    if (ownedBoardCards.has(card.boardIndex)) {
      return false;
    }

    return options.free || players[playerIndex].chips >= getPurchasePrice(card, options);
  }

  function purchase(cardElement, playerIndex = activePlayer, options = {}) {
    const card = getCardFromElement(cardElement);
    if (!card) {
      return { success: false, message: "No card selected" };
    }

    if (ownedBoardCards.has(card.boardIndex)) {
      return { success: false, message: "Already owned" };
    }

    const purchasePrice = getPurchasePrice(card, options);

    if (!options.free && players[playerIndex].chips < purchasePrice) {
      return { success: false, message: "Not enough chips" };
    }

    if (!options.free) {
      players[playerIndex].chips -= purchasePrice;
    }

    players[playerIndex].cards.push(card);
    ownedBoardCards.set(card.boardIndex, playerIndex);
    render(playerIndex);

    return {
      success: true,
      card,
      message: card.type === "wild"
        ? "Wild claimed"
        : options.free
          ? "Card won"
          : `Bought for ${formatChips(purchasePrice)}`
    };
  }

  function sell(card, playerIndex = activePlayer) {
    const player = players[playerIndex];
    const cardIndex = player.cards.findIndex((ownedCard) => ownedCard.boardIndex === card.boardIndex);

    if (cardIndex === -1) {
      return { success: false, message: "Card not owned" };
    }

    player.cards.splice(cardIndex, 1);
    ownedBoardCards.delete(card.boardIndex);
    player.chips += card.sellPrice || Math.floor(getCardPrice(card) * 0.5);
    render(playerIndex);

    return { success: true };
  }

  function chargePenalty(playerIndex, ownerIndex, amount) {
    const penalty = Math.max(0, Number.parseInt(String(amount), 10) || 0);
    if (!penalty || playerIndex === ownerIndex) {
      render(activePlayer);
      return { charged: 0 };
    }

    const charged = Math.min(players[playerIndex].chips, penalty);
    players[playerIndex].chips -= charged;
    players[ownerIndex].chips += charged;
    render(activePlayer);
    return { charged };
  }

  function startAuction(cardElement, playerIndex = activePlayer) {
    const card = getCardFromElement(cardElement);
    return {
      card,
      seller: playerIndex,
      minimumBid: Math.floor(getCardPrice(card) * 0.5),
      bids: []
    };
  }

  function setActivePlayer(playerIndex) {
    activePlayer = playerIndex;
    render(playerIndex);
  }

  function render(playerIndex = activePlayer) {
    const player = players[playerIndex];
    chipsLabel.textContent = formatChips(player.chips);
    if (cardCountLabel) {
      cardCountLabel.textContent = String(player.cards.length);
    }
    if (bestHandLabel) {
      bestHandLabel.textContent = getBestHandName(player.cards, playerIndex);
    }

    const bestCards = getBestHandCards(player.cards, playerIndex).slice(0, 5);
    const handSlots = Array.from({ length: 5 }, (_, index) => createHandSlot(bestCards[index], index));

    const bestFrame = document.createElement("div");
    bestFrame.className = "best-hand-frame";
    bestFrame.setAttribute("aria-label", "Best poker hand");
    bestFrame.replaceChildren(...handSlots);
    handRoot.replaceChildren(bestFrame);
  }

  function createHandSlot(card, index) {
    const slot = document.createElement("span");
    slot.className = "hand-card-slot";
    slot.dataset.slot = String(index + 1);

    if (!card) {
      slot.classList.add("empty");
      slot.setAttribute("aria-label", `Empty best hand card slot ${index + 1}`);
      return slot;
    }

    slot.classList.add("filled");
    slot.setAttribute("aria-label", `Best hand card ${index + 1}: ${card.name}`);
    slot.append(createMiniCard(card, { best: true }));
    return slot;
  }

  function createMiniCard(card, options = {}) {
      const cardButton = document.createElement("button");
      cardButton.className = `mini-card ${card.suit === "H" || card.suit === "D" ? "red" : "black"}`;
      cardButton.classList.toggle("best-hand-slot", Boolean(options.best));
      cardButton.type = "button";
      cardButton.dataset.boardIndex = String(card.boardIndex);
      cardButton.classList.toggle("wild-card-slot", card.type === "wild");
      cardButton.title = card.wildSubstitute
        ? `${card.name}: substitutes ${card.wildSubstitute.name}`
        : card.type === "wild"
          ? `${card.name}: active for one full orbit`
        : `${card.name}: sell ${formatChips(card.sellPrice)}, penalty ${formatChips(card.penalty)}, hand ${card.multiplier}`;
      cardButton.innerHTML = `
        <span>${card.rank}</span>
        <strong>${suitIcons[card.suit] || ""}</strong>
      `;
      return cardButton;
  }

  function getPlayer(playerIndex = activePlayer) {
    return {
      chips: players[playerIndex].chips,
      cards: [...players[playerIndex].cards]
    };
  }

  render();

  return {
    canPurchase,
    chargePenalty,
    getCardPrice,
    getPlayer,
    purchase,
    render,
    sell,
    setActivePlayer,
    startAuction
  };
}

export function getRankPurchasePrice(rank) {
  return rankPriceMap[rank] || 0;
}

function formatChips(value) {
  return Number(value).toLocaleString("en-US");
}

function getPurchasePrice(card, options = {}) {
  if (options.free) {
    return 0;
  }

  const discountPercent = Number.isFinite(options.discountPercent) ? Math.max(0, Math.min(100, options.discountPercent)) : 0;
  return Math.ceil(card.price * ((100 - discountPercent) / 100));
}
