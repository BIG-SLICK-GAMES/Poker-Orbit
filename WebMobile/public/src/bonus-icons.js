const iconBasePath = "/assets/bonus-icons/";

const bonusIconMap = {
  "Free Card": "free.png",
  "50% Off": "50off.png",
  "NO WIN": "nosale.png",
  "Spin Again": "spinagain.png",
  "Buy 1 Get 1 50% Off": "buy1get150.png",
  "PIC Card": "pic.png",
  "100 RP": "100rp.png",
  BANKRUPTCY: "bankrupt.png",
  Shield: "shield.png"
};

const bonusTypeIconMap = {
  "free-card": "free.png",
  discount: "50off.png",
  "no-win": "nosale.png",
  "spin-again": "spinagain.png",
  bogo: "buy1get150.png",
  pic: "pic.png",
  rp: "100rp.png",
  bankruptcy: "bankrupt.png",
  shield: "shield.png"
};

export function getBonusIconSrc(label, type = "") {
  const fileName = bonusIconMap[label] || bonusTypeIconMap[type] || "";
  return fileName ? `${iconBasePath}${fileName}` : "";
}
