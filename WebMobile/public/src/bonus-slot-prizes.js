const prizeOdds = [
  { label: "NO WIN", type: "no-win", weight: 20 },
  { label: "50% Off", type: "discount", weight: 15 },
  { label: "Free Roll", type: "free-roll", weight: 12 },
  { label: "Spin Again", type: "spin-again", weight: 10 },
  { label: "100 RP", type: "rp", weight: 10 },
  { label: "Shield", type: "shield", weight: 9 },
  { label: "Steal", type: "steal", weight: 7 },
  { label: "PIC Card", type: "pic", weight: 6 },
  { label: "Free Card", type: "free-card", weight: 5 },
  { label: "Buy 1 Get 1 50% Off", type: "bogo", weight: 4 },
  { label: "BANKRUPTCY", type: "bankruptcy", weight: 2 }
];

export function rollBonusSlotPrize() {
  const totalWeight = prizeOdds.reduce((sum, prize) => sum + prize.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const prize of prizeOdds) {
    roll -= prize.weight;
    if (roll < 0) {
      return { label: prize.label, type: prize.type };
    }
  }

  return { label: "NO WIN", type: "no-win" };
}
