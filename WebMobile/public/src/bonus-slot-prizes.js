const prizePattern = [
  { label: "Free Card", type: "free-card", count: 4 },
  { label: "50% Off", type: "discount", count: 8 },
  { label: "NO WIN", type: "no-win", count: 11 },
  { label: "Spin Again", type: "spin-again", count: 5 },
  { label: "Buy 1 Get 1 50% Off", type: "bogo", count: 4 },
  { label: "PIC Card", type: "pic", count: 4 },
  { label: "Free Roll", type: "free-roll", count: 6 },
  { label: "100 RP", type: "rp", count: 3 },
  { label: "BANKRUPTCY", type: "bankruptcy", count: 1 },
  { label: "Shield", type: "shield", count: 5 },
  { label: "Steal", type: "steal", count: 5 }
];

export function buildBonusSlotPrizes() {
  return shuffle(prizePattern.flatMap((prize) => (
    Array.from({ length: prize.count }, () => ({ label: prize.label, type: prize.type }))
  )));
}

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
