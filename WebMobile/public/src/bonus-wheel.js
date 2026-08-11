const prizePattern = [
  { label: "Free Card", type: "free-card", count: 4, color: "#f6c453" },
  { label: "50% Off", type: "discount", count: 8, color: "#e83f4f" },
  { label: "NO WIN", type: "no-win", count: 11, color: "#3b4652" },
  { label: "Spin Again", type: "spin-again", count: 5, color: "#43d6c9" },
  { label: "Buy 1 Get 1 50% Off", type: "bogo", count: 4, color: "#ff8a1c" },
  { label: "PIC Card", type: "pic", count: 4, color: "#7d5cff" },
  { label: "Free Roll", type: "free-roll", count: 6, color: "#f4e1b8" },
  { label: "100 RP", type: "rp", count: 3, color: "#ffd84f" },
  { label: "BANKRUPTCY", type: "bankruptcy", count: 1, color: "#050506" },
  { label: "Shield", type: "shield", count: 5, color: "#2676e8" },
  { label: "Steal", type: "steal", count: 5, color: "#b8201c" }
];

export function buildBonusWheelPrizes() {
  const prizes = prizePattern.flatMap((prize) => (
    Array.from({ length: prize.count }, () => ({
      label: prize.label,
      shortLabel: getShortLabel(prize.label),
      type: prize.type,
      color: prize.color
    }))
  ));

  return shuffle(prizes);
}

export function getBonusPrizeSummary() {
  return prizePattern.map(({ label, count }) => `${label} x${count}`);
}

function getShortLabel(label) {
  const labels = {
    "Free Card": "FREE CARD",
    "50% Off": "50% OFF",
    "NO WIN": "NO WIN",
    "Spin Again": "SPIN AGAIN",
    "Buy 1 Get 1 50% Off": "BUY 1 GET 1",
    "PIC Card": "PIC",
    "Free Roll": "FREE ROLL",
    "100 RP": "100 RP",
    BANKRUPTCY: "BANKRUPTCY",
    Shield: "SHIELD",
    Steal: "STEAL"
  };

  return labels[label] || label.toUpperCase();
}

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
