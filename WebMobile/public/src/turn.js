export function createTurnModule(playerCount = 4, options = {}) {
  let currentPlayer = 0;
  const boardSpaceCount = options.boardSpaceCount || 56;
  const playerPositions = Array.from({ length: playerCount }, (_, index) => {
    const fallbackPosition = Math.round((index / playerCount) * boardSpaceCount) % boardSpaceCount;
    return normalizeBoardIndex(options.startingPositions?.[index] ?? fallbackPosition);
  });
  const playerRollPoints = Array.from({ length: playerCount }, () => 0);
  const listeners = new Set();

  function getState() {
    return {
      currentPlayer,
      currentPlayerNumber: currentPlayer + 1,
      playerPositions: [...playerPositions],
      playerRollPoints: [...playerRollPoints],
      playerCount
    };
  }

  function setCurrentPlayer(playerIndex) {
    currentPlayer = normalizePlayerIndex(playerIndex);
    notify();
  }

  function nextTurn() {
    setCurrentPlayer(currentPlayer + 1);
  }

  function previousTurn() {
    setCurrentPlayer(currentPlayer - 1);
  }

  function moveCurrentPlayer(steps) {
    movePlayer(currentPlayer, steps);
  }

  function completeCurrentRoll(total) {
    const rollTotal = Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;
    playerRollPoints[currentPlayer] += rollTotal;
    playerPositions[currentPlayer] = normalizeBoardIndex(playerPositions[currentPlayer] + rollTotal);
    notify();
  }

  function movePlayer(playerIndex, steps) {
    const normalizedPlayerIndex = normalizePlayerIndex(playerIndex);
    const normalizedSteps = Number.isFinite(steps) ? Math.trunc(steps) : 0;
    playerPositions[normalizedPlayerIndex] = normalizeBoardIndex(playerPositions[normalizedPlayerIndex] + normalizedSteps);
    notify();
  }

  function spendCurrentPlayerRollPoints(cost) {
    const normalizedCost = Number.isFinite(cost) ? Math.max(0, Math.trunc(cost)) : 0;

    if (playerRollPoints[currentPlayer] < normalizedCost) {
      return false;
    }

    playerRollPoints[currentPlayer] -= normalizedCost;
    notify();
    return true;
  }

  function addCurrentPlayerRollPoints(amount) {
    const normalizedAmount = Number.isFinite(amount) ? Math.trunc(amount) : 0;
    playerRollPoints[currentPlayer] = Math.max(0, playerRollPoints[currentPlayer] + normalizedAmount);
    notify();
  }

  function clearCurrentPlayerRollPoints() {
    playerRollPoints[currentPlayer] = 0;
    notify();
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
  }

  function notify() {
    const state = getState();
    listeners.forEach((listener) => listener(state));
  }

  function normalizePlayerIndex(playerIndex) {
    return ((playerIndex % playerCount) + playerCount) % playerCount;
  }

  function normalizeBoardIndex(boardIndex) {
    return ((boardIndex % boardSpaceCount) + boardSpaceCount) % boardSpaceCount;
  }

  return {
    getState,
    completeCurrentRoll,
    addCurrentPlayerRollPoints,
    clearCurrentPlayerRollPoints,
    moveCurrentPlayer,
    movePlayer,
    spendCurrentPlayerRollPoints,
    setCurrentPlayer,
    nextTurn,
    previousTurn,
    subscribe
  };
}
