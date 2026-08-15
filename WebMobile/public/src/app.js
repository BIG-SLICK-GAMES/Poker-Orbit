import { createTurnModule } from "./turn.js";
import { createCameraModule } from "./camera.js";
import { createSlotReelModule } from "./slot-reel.js";
import { createCardAnimationModule } from "./card-animation.js";
import { createPurchaseAuctionModule, getRankPurchasePrice } from "./purchase-auction.js";
import { createOwnershipHighlightModule } from "./ownership-highlights.js";
import { createFxOverlayModule } from "./fx-overlay.js";
import { getBonusIconSrc } from "./bonus-icons.js";
import { rollBonusSlotPrize } from "./bonus-slot-prizes.js";
import { MASTER_CONTROL } from "./master-control.js";

const shell = document.querySelector("#appShell");
const screens = new Map([...document.querySelectorAll("[data-screen]")].map((screen) => [screen.dataset.screen, screen]));
const boardCardRing = document.querySelector("#boardCardRing");
const boardSlotRing = document.querySelector("#boardSlotRing");
const boardStage = document.querySelector("#boardStage");
const orbitBoard = document.querySelector("#orbitBoard");
const boardRotator = document.querySelector("#boardRotator");
const perspectiveTable = document.querySelector("#perspectiveTable");
const playerTokenLayer = document.querySelector("#playerTokenLayer");
const cardAnimationLayer = document.querySelector("#cardAnimationLayer");
const currentTurnLabel = document.querySelector("#currentTurnLabel");
const rollPointsLabel = document.querySelector("#rollPointsLabel");
const landingCostLabel = document.querySelector("#landingCostLabel");
const rollButton = document.querySelector("#rollButton");
const slotReelRoot = document.querySelector("#slotReel");
const slotRollButton = document.querySelector("#slotRollButton");
const playerBonusSlots = document.querySelector("#playerBonusSlots");
const viewToggleButton = document.querySelector("#viewToggleButton");
const endTurnButton = document.querySelector("#endTurnButton");
const playerCardHand = document.querySelector("#playerCardHand");
const chipBankLabel = document.querySelector("#chipBankLabel");
const ownedCardCountLabel = document.querySelector("#ownedCardCountLabel");
const themeSettings = document.querySelector("#themeSettings");
const settingsPreviewTheme = document.querySelector("#settingsPreviewTheme");
const themeSectionSummary = document.querySelector("#themeSectionSummary");
const cameraSectionSummary = document.querySelector("#cameraSectionSummary");
const cameraXControl = document.querySelector("#cameraXControl");
const cameraYControl = document.querySelector("#cameraYControl");
const cameraXValue = document.querySelector("#cameraXValue");
const cameraYValue = document.querySelector("#cameraYValue");
const cameraResetButton = document.querySelector("#cameraResetButton");
const controlDocToggle = document.querySelector("#controlDocToggle");
const controlDocPanel = document.querySelector("#controlDocPanel");
const controlDocClose = document.querySelector("#controlDocClose");
const controlDocList = document.querySelector("#controlDocList");
const controlDocSave = document.querySelector("#controlDocSave");
const controlDocReset = document.querySelector("#controlDocReset");
const boardSpaceCount = 54;
const startingPlayerPositions = [27, 14, 0, 41];
const playerTokenColors = ["#24d8ff", "#ff2a4f", "#39ff7a", "#ff8a1c"];
const themeStorageKey = "poker-orbit-theme-v1";
const cameraStorageKey = "poker-orbit-camera-offset-v3";
const controlDocStorageKey = "poker-orbit-control-doc-v2";
const cameraDefaultOffset = { x: -14, y: 0 };
const customThemeLimit = 5;
const controlDocLabels = {
  gameTopbar: "Top Bar",
  perspectiveTable: "Camera Table Layer",
  orbitBoard: "Board Position",
  boardCardRing: "Card Ring",
  boardCards: "Individual Cards",
  playerTokens: "Player Tokens",
  handPanel: "Bottom Console",
  turnStrip: "Turn Label",
  slotReel: "Roll Console Layer",
  doublesLamp: "Doubles Lamp",
  rollPointsMeter: "Roll Points Display",
  diceReels: "Dice Number Reels",
  rollButton: "Roll Button",
  bonusSlots: "Bonus Slots",
  economyStrip: "Chips And Cards",
  playerCardHand: "Owned Card Area"
};
const controlDocOrder = Object.keys(controlDocLabels);
let controlDocValues = loadSavedControlDoc();
const themePresets = {
  diner: {
    label: "Neon Control",
    colors: {
      bsgBg: "#020714",
      bsgPanel: "#061426",
      bsgAccent: "#ff8a1c",
      bsgSuccess: "#24d8ff",
      bsgWarning: "#ffb047",
      bsgBorder: "#24d8ff",
      table: "#062743",
      tableDeep: "#020915",
      dangerRed: "#ff4d28",
      ink: "#06101e",
      dinerRed: "#ff8a1c",
      dinerRedDark: "#220916",
      dinerCream: "#caf7ff",
      dinerMint: "#24d8ff",
      dinerMintDark: "#006da2",
      dinerChrome: "#5ecfff",
      dinerInk: "#04111f"
    }
  },
  casino: {
    label: "Casino Green",
    colors: {
      bsgBg: "#07130e",
      bsgPanel: "#123524",
      bsgAccent: "#d7a62f",
      bsgSuccess: "#48d38b",
      bsgWarning: "#fff0ba",
      bsgBorder: "#d7a62f",
      table: "#08603e",
      tableDeep: "#04291b",
      dangerRed: "#cf2435",
      ink: "#102016",
      dinerRed: "#16633f",
      dinerRedDark: "#092a1d",
      dinerCream: "#fff0ba",
      dinerMint: "#48d38b",
      dinerMintDark: "#096f45",
      dinerChrome: "#e2d294",
      dinerInk: "#102016"
    }
  },
  noir: {
    label: "Noir Club",
    colors: {
      bsgBg: "#0d0d10",
      bsgPanel: "#242226",
      bsgAccent: "#c6a15b",
      bsgSuccess: "#b8c0c2",
      bsgWarning: "#f4e1b8",
      bsgBorder: "#5f5650",
      table: "#242a2d",
      tableDeep: "#111315",
      dangerRed: "#a72631",
      ink: "#141315",
      dinerRed: "#2c2a2e",
      dinerRedDark: "#111113",
      dinerCream: "#f4e1b8",
      dinerMint: "#b8c0c2",
      dinerMintDark: "#596065",
      dinerChrome: "#d7d0c2",
      dinerInk: "#141315"
    }
  },
  neon: {
    label: "Neon Orbit",
    colors: {
      bsgBg: "#100519",
      bsgPanel: "#25103b",
      bsgAccent: "#ff3d8b",
      bsgSuccess: "#26f1d8",
      bsgWarning: "#fff48a",
      bsgBorder: "#7d5cff",
      table: "#142c68",
      tableDeep: "#080e2b",
      dangerRed: "#ff3d8b",
      ink: "#12071e",
      dinerRed: "#6e2cff",
      dinerRedDark: "#240d55",
      dinerCream: "#fff48a",
      dinerMint: "#26f1d8",
      dinerMintDark: "#087e92",
      dinerChrome: "#d8d1ff",
      dinerInk: "#12071e"
    }
  }
};
const customThemeFields = [
  { key: "dinerRed", label: "Console" },
  { key: "dinerMint", label: "Accent" },
  { key: "dinerCream", label: "Card cream" },
  { key: "table", label: "Table" },
  { key: "tableDeep", label: "Table dark" },
  { key: "bsgBg", label: "Background" },
  { key: "bsgAccent", label: "Prize gold" },
  { key: "dangerRed", label: "Red suits" }
];
let customThemeColors = { ...themePresets.diner.colors };
let savedCustomThemes = [];
let activeThemeName = "diner";
let activeCustomThemeId = "";
let cameraOffset = loadSavedCameraOffset();

loadSavedTheme();
createThemeSettings();

const turnModule = createTurnModule(4, { boardSpaceCount, startingPositions: startingPlayerPositions });
const cameraModule = createCameraModule({ boardStage, perspectiveTable, cameraControl: MASTER_CONTROL.camera });
const ownershipHighlightModule = createOwnershipHighlightModule({ boardRoot: boardCardRing });
const fxOverlayModule = createFxOverlayModule({
  tokenLayer: playerTokenLayer,
  getTokenPosition: getTokenInnerRingPosition,
  playerColors: playerTokenColors,
  boardSpaceCount
});
let currentLandingCost = 0;

createSlotReelModule({
  root: slotReelRoot,
  rollButton: slotRollButton,
  externalRollButton: rollButton,
  min: 1,
  max: 6,
  onRollComplete: ({ total }) => {
    window.clearTimeout(pendingNextTurnTimer);
    awaitingLandingDecision = false;
    animateRollPointsGain(total);
    turnModule.completeCurrentRoll(total);
  }
});
const suitIcons = {
  H: "\u2665",
  D: "\u2666",
  C: "\u2663",
  S: "\u2660"
};
const cardAnimationModule = createCardAnimationModule({
  layer: cardAnimationLayer,
  onPurchase: purchaseBoardCard,
  onPurchaseComplete: () => scheduleNextTurn(endTurnAfterCardExitMs),
  onPass: passBoardCard,
  onSpin: spinForBoardCard,
  canSpin: canSpinForBoardCard,
  getPurchaseColor: () => playerTokenColors[turnModule.getState().currentPlayer]
});
const suitNames = {
  H: "Hearts",
  D: "Diamonds",
  C: "Clubs",
  S: "Spades"
};
const purchaseAuctionModule = createPurchaseAuctionModule({
  playerCount: 4,
  startingChips: 10000,
  handRoot: playerCardHand,
  chipsLabel: chipBankLabel,
  cardCountLabel: ownedCardCountLabel,
  suitIcons,
  getBestHandCards: getBestPokerHandCards
});
const tokenStepDurationMs = Math.max(60, numberOrDefault(MASTER_CONTROL.gameplay?.tokenStepDurationMs, 230));
const tokenStepCards = Math.max(1, Math.trunc(numberOrDefault(MASTER_CONTROL.gameplay?.tokenStepCards, 1)));
const boardRotationDurationMs = Math.max(160, numberOrDefault(MASTER_CONTROL.gameplay?.boardRotationDurationMs, 760));
const boardMoveMsPerCard = Math.max(40, numberOrDefault(MASTER_CONTROL.gameplay?.boardMoveMsPerCard, 120));
const boardMoveMinMs = Math.max(160, numberOrDefault(MASTER_CONTROL.gameplay?.boardMoveMinMs, 560));
const boardMoveMaxMs = Math.max(boardMoveMinMs, numberOrDefault(MASTER_CONTROL.gameplay?.boardMoveMaxMs, 1800));
const moveCameraSettleMs = Math.max(0, numberOrDefault(MASTER_CONTROL.gameplay?.moveCameraSettleMs, 360));
const endTurnBoardHoldMs = Math.max(0, numberOrDefault(MASTER_CONTROL.gameplay?.endTurnBoardHoldMs, 0));
const endTurnAfterCardExitMs = Math.max(0, numberOrDefault(MASTER_CONTROL.gameplay?.endTurnAfterCardExitMs, 500));
let lastRenderedTurnState = null;
let pendingBoardCenterTimer = 0;
let boardRotationDegrees = 0;
let boardRotationAnimationFrame = 0;
const tokenAnimationTimers = new Map();
const tokenAnimationFrames = new Map();
let pendingCardAnimationTimer = 0;
let pendingNextTurnTimer = 0;
let awaitingLandingDecision = false;
let suppressNextTurnFocus = false;
let boardViewMode = "zoom";
let currentScreen = "splash";
let previousScreen = "lobby";
let paidBonusSpinUsedThisTurn = false;
const playerBonuses = Array.from({ length: 4 }, () => []);

createBoardCards();
createPlayerTokens();
formatMiniCards();
applyMasterControl();
createControlDocPanel();
applyCameraOffset();
turnModule.subscribe(renderTurnState);
registerServiceWorker();

document.addEventListener("click", (event) => {
  const goButton = event.target.closest("[data-go]");
  if (goButton) {
    showScreen(goButton.dataset.go);
    return;
  }

  if (event.target.closest("[data-back]")) {
    showScreen(previousScreen);
  }
});

viewToggleButton?.addEventListener("click", () => {
  boardViewMode = boardViewMode === "zoom" ? "wide" : "zoom";
  applyBoardViewMode(turnModule.getState());
});

document.querySelector("#reducedMotionToggle").addEventListener("change", (event) => {
  shell.classList.toggle("reduce-motion", event.target.checked);
});

cameraXControl?.addEventListener("input", (event) => {
  cameraOffset.x = clampCameraOffset(Number(event.target.value));
  applyCameraOffset({ persist: true });
});

cameraYControl?.addEventListener("input", (event) => {
  cameraOffset.y = clampCameraOffset(Number(event.target.value));
  applyCameraOffset({ persist: true });
});

cameraResetButton?.addEventListener("click", () => {
  cameraOffset = { ...cameraDefaultOffset };
  applyCameraOffset({ persist: true });
});

controlDocToggle?.addEventListener("click", () => {
  setControlDocOpen(controlDocPanel?.hidden !== false);
});

controlDocClose?.addEventListener("click", () => {
  setControlDocOpen(false);
});

controlDocSave?.addEventListener("click", () => {
  saveControlDoc();
  flashControlDocStatus("Saved");
});

controlDocReset?.addEventListener("click", () => {
  controlDocValues = cloneControlDocDefaults();
  applyMasterControl();
  syncControlDocInputs();
  saveControlDoc();
  flashControlDocStatus("Reset");
});

endTurnButton?.addEventListener("click", () => {
  suppressNextTurnFocus = true;
  applyBoardViewMode(turnModule.getState());
  window.setTimeout(() => {
    turnModule.nextTurn();
  }, endTurnBoardHoldMs);
});

function showScreen(name) {
  if (!screens.has(name) || name === currentScreen) {
    return;
  }

  if (currentScreen === "settings") {
    screens.get("settings").classList.remove("active");
    shell.classList.remove("settings-over-game");
    currentScreen = previousScreen;
    if (name === previousScreen) {
      screens.get(previousScreen).classList.add("active");
      return;
    }
  }

  previousScreen = currentScreen === "settings" ? previousScreen : currentScreen;
  const opensSettingsOverGame = name === "settings" && currentScreen === "game";
  if (!opensSettingsOverGame) {
    screens.get(currentScreen).classList.remove("active");
  }
  screens.get(name).classList.add("active");
  shell.classList.toggle("settings-over-game", opensSettingsOverGame);
  currentScreen = name;

}

function loadSavedTheme() {
  let savedTheme = { name: "diner", customColors: customThemeColors, savedCustomThemes: [] };

  try {
    const storedTheme = JSON.parse(localStorage.getItem(themeStorageKey) || "null");
    if (storedTheme && typeof storedTheme === "object") {
      savedTheme = storedTheme;
    } else {
      const oldThemeName = localStorage.getItem(themeStorageKey);
      if (oldThemeName) {
        savedTheme = { name: oldThemeName, customColors: customThemeColors };
      }
    }
  } catch {
    const oldThemeName = localStorage.getItem(themeStorageKey);
    savedTheme = { name: oldThemeName || "diner", customColors: customThemeColors };
  }

  savedCustomThemes = normalizeSavedCustomThemes(savedTheme.savedCustomThemes);
  customThemeColors = { ...themePresets.diner.colors, ...(savedTheme.customColors || {}) };
  applyTheme(savedTheme.name || "diner");
}

function loadSavedCameraOffset() {
  try {
    const storedOffset = JSON.parse(localStorage.getItem(cameraStorageKey) || "null");
    if (storedOffset && typeof storedOffset === "object") {
      return {
        x: clampCameraOffset(Number(storedOffset.x)),
        y: clampCameraOffset(Number(storedOffset.y))
      };
    }
  } catch {
    return { ...cameraDefaultOffset };
  }

  return { ...cameraDefaultOffset };
}

function applyCameraOffset({ persist = false } = {}) {
  if (orbitBoard) {
    orbitBoard.style.setProperty("--viewport-board-x", `${cameraOffset.x}%`);
    orbitBoard.style.setProperty("--viewport-board-y", `${cameraOffset.y}%`);
  }

  if (cameraXControl) {
    cameraXControl.value = String(cameraOffset.x);
  }
  if (cameraYControl) {
    cameraYControl.value = String(cameraOffset.y);
  }

  const xLabel = formatCameraAxis(cameraOffset.x, "Left", "Right");
  const yLabel = formatCameraAxis(cameraOffset.y, "Up", "Down");
  if (cameraXValue) {
    cameraXValue.textContent = xLabel;
  }
  if (cameraYValue) {
    cameraYValue.textContent = yLabel;
  }
  if (cameraSectionSummary) {
    cameraSectionSummary.textContent = `${xLabel} / ${yLabel}`;
  }

  if (persist) {
    localStorage.setItem(cameraStorageKey, JSON.stringify(cameraOffset));
  }
}

function clampCameraOffset(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(-20, Math.min(20, Math.round(value * 2) / 2));
}

function formatCameraAxis(value, negativeLabel, positiveLabel) {
  if (Math.abs(value) < 0.01) {
    return "Center";
  }

  const amount = Math.abs(value).toLocaleString(undefined, {
    maximumFractionDigits: 1
  });
  return `${value < 0 ? negativeLabel : positiveLabel} ${amount}%`;
}

function applyTheme(themeName) {
  const savedCustomTheme = getSavedCustomTheme(themeName);
  const selectedTheme = themePresets[themeName] ? themeName : savedCustomTheme ? themeName : "custom";

  if (savedCustomTheme) {
    customThemeColors = { ...themePresets.diner.colors, ...savedCustomTheme.colors };
    fillDerivedCustomThemeColors();
    activeCustomThemeId = savedCustomTheme.id;
  } else if (selectedTheme === "custom") {
    fillDerivedCustomThemeColors();
    activeCustomThemeId = "";
  } else {
    activeCustomThemeId = "";
  }

  const colors = selectedTheme === "custom" || savedCustomTheme
    ? customThemeColors
    : themePresets[selectedTheme].colors;

  activeThemeName = selectedTheme;
  document.body.dataset.theme = themePresets[selectedTheme] ? selectedTheme : "custom";
  applyThemeColors(colors);
  syncThemeSettings(selectedTheme);
  saveTheme(selectedTheme);
}

function createThemeSettings() {
  const presetButtons = Object.entries(themePresets).map(([name, preset]) => createThemePresetButton(name, preset)).join("");
  const customSwatches = customThemeFields.map((field) => `
    <label>
      <span>${field.label}</span>
      <input type="color" data-theme-color="${field.key}">
    </label>
  `).join("");

  themeSettings.classList.add("theme-control");
  themeSettings.innerHTML = `
    <div class="theme-control-head">
      <strong>Theme</strong>
      <span data-theme-status>Preset</span>
    </div>
    <div class="theme-preset-grid" role="group" aria-label="Theme presets">
      ${presetButtons}
      <span data-saved-theme-buttons></span>
      <button class="theme-preset custom" type="button" data-theme-preset="custom">
        <span class="theme-swatch-row">
          <i style="--swatch:#b8201c"></i>
          <i style="--swatch:#55c9bd"></i>
          <i style="--swatch:#fff3cf"></i>
        </span>
        <strong>Custom</strong>
      </button>
    </div>
    <div class="custom-theme-panel" data-custom-theme hidden>
      <label class="custom-theme-name">
        <span>Name</span>
        <input type="text" maxlength="18" data-theme-name placeholder="Custom theme">
      </label>
      ${customSwatches}
      <button class="custom-theme-save" type="button" data-save-custom-theme>Save Custom Theme</button>
      <span class="custom-theme-limit" data-custom-theme-limit>0 / ${customThemeLimit} saved</span>
    </div>
  `;

  bindThemePresetButtons();

  themeSettings.querySelectorAll("[data-theme-color]").forEach((input) => {
    input.addEventListener("input", () => {
      customThemeColors[input.dataset.themeColor] = input.value;
      fillDerivedCustomThemeColors();
      applyTheme("custom");
    });
  });

  themeSettings.querySelector("[data-save-custom-theme]").addEventListener("click", saveCurrentCustomTheme);
  renderSavedCustomThemeButtons();
  syncThemeSettings(activeThemeName);
}

function createThemePresetButton(name, preset) {
  return `
    <button class="theme-preset" type="button" data-theme-preset="${name}">
      <span class="theme-swatch-row">
        <i style="--swatch:${preset.colors.dinerRed}"></i>
        <i style="--swatch:${preset.colors.dinerMint}"></i>
        <i style="--swatch:${preset.colors.dinerCream}"></i>
      </span>
      <strong>${preset.label}</strong>
    </button>
  `;
}

function bindThemePresetButtons() {
  themeSettings.querySelectorAll("[data-theme-preset]").forEach((button) => {
    if (button.dataset.themeBound === "true") {
      return;
    }

    button.dataset.themeBound = "true";
    button.addEventListener("click", () => {
      const themeName = button.dataset.themePreset;
      if (themePresets[themeName]) {
        customThemeColors = { ...themePresets[themeName].colors };
      }
      applyTheme(themeName);
    });
  });
}

function renderSavedCustomThemeButtons() {
  const savedThemeRoot = themeSettings.querySelector("[data-saved-theme-buttons]");
  if (!savedThemeRoot) {
    return;
  }

  savedThemeRoot.replaceChildren(...savedCustomThemes.map((theme) => {
    const button = document.createElement("button");
    button.className = "theme-preset saved-custom";
    button.type = "button";
    button.dataset.themePreset = `custom:${theme.id}`;
    button.dataset.savedThemeId = theme.id;
    button.innerHTML = `
      <span class="theme-swatch-row">
        <i style="--swatch:${theme.colors.dinerRed}"></i>
        <i style="--swatch:${theme.colors.dinerMint}"></i>
        <i style="--swatch:${theme.colors.dinerCream}"></i>
      </span>
      <strong>${escapeHtml(theme.label)}</strong>
    `;
    return button;
  }));

  bindThemePresetButtons();
}

function saveCurrentCustomTheme() {
  fillDerivedCustomThemeColors();
  const nameInput = themeSettings.querySelector("[data-theme-name]");
  const label = cleanCustomThemeName(nameInput.value || getNextCustomThemeName());
  const existingIndex = activeCustomThemeId
    ? savedCustomThemes.findIndex((theme) => theme.id === activeCustomThemeId)
    : -1;
  const themeRecord = {
    id: activeCustomThemeId || createCustomThemeId(),
    label,
    colors: { ...customThemeColors },
    savedAt: Date.now()
  };

  if (existingIndex >= 0) {
    savedCustomThemes[existingIndex] = themeRecord;
  } else {
    savedCustomThemes.push(themeRecord);
  }

  while (savedCustomThemes.length > customThemeLimit) {
    savedCustomThemes.shift();
  }

  activeCustomThemeId = themeRecord.id;
  activeThemeName = `custom:${themeRecord.id}`;
  renderSavedCustomThemeButtons();
  applyTheme(activeThemeName);
}

function syncThemeSettings(themeName) {
  if (!themeSettings.hasChildNodes()) {
    return;
  }

  themeSettings.querySelectorAll("[data-theme-preset]").forEach((button) => {
    const savedId = button.dataset.savedThemeId || "";
    const isSavedActive = savedId && savedId === activeCustomThemeId && themeName === `custom:${savedId}`;
    button.classList.toggle("active", button.dataset.themePreset === themeName || isSavedActive);
  });

  const isCustomTheme = themeName === "custom" || themeName.startsWith("custom:");
  themeSettings.querySelector("[data-custom-theme]").hidden = !isCustomTheme;
  themeSettings.querySelector("[data-theme-status]").textContent = isCustomTheme ? "Custom" : "Preset";
  const savedTheme = getSavedCustomTheme(themeName);
  const themeLabel = savedTheme?.label || (themeName === "custom" ? "Custom" : themePresets[themeName]?.label || "40s Diner");
  settingsPreviewTheme.textContent = themeLabel;
  themeSectionSummary.textContent = themeLabel;
  themeSettings.querySelector("[data-theme-name]").value = savedTheme?.label || (themeName === "custom" ? getNextCustomThemeName() : "");
  themeSettings.querySelector("[data-custom-theme-limit]").textContent = `${savedCustomThemes.length} / ${customThemeLimit} saved`;

  customThemeFields.forEach((field) => {
    const input = themeSettings.querySelector(`[data-theme-color="${field.key}"]`);
    if (input) {
      input.value = customThemeColors[field.key];
    }
  });
}

function getSavedCustomTheme(themeName) {
  const id = typeof themeName === "string" && themeName.startsWith("custom:")
    ? themeName.slice("custom:".length)
    : "";

  if (!id) {
    return null;
  }

  return savedCustomThemes.find((theme) => theme.id === id) || null;
}

function normalizeSavedCustomThemes(themes) {
  if (!Array.isArray(themes)) {
    return [];
  }

  return themes
    .filter((theme) => theme && typeof theme === "object" && theme.colors && typeof theme.colors === "object")
    .slice(-customThemeLimit)
    .map((theme, index) => ({
      id: String(theme.id || createCustomThemeId(index)),
      label: cleanCustomThemeName(theme.label || `Custom ${index + 1}`),
      colors: { ...themePresets.diner.colors, ...theme.colors },
      savedAt: Number.isFinite(theme.savedAt) ? theme.savedAt : Date.now() + index
    }));
}

function getNextCustomThemeName() {
  return `Custom ${Math.min(savedCustomThemes.length + 1, customThemeLimit)}`;
}

function createCustomThemeId(seed = Date.now()) {
  return `${seed.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function cleanCustomThemeName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ").slice(0, 18);
  return name || getNextCustomThemeName();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fillDerivedCustomThemeColors() {
  const dinerPreset = themePresets.diner.colors;
  customThemeColors = {
    ...dinerPreset,
    ...customThemeColors,
    dinerRedDark: customThemeColors.dinerRedDark || customThemeColors.dinerRed,
    dinerMintDark: customThemeColors.dinerMintDark || customThemeColors.dinerMint,
    dinerChrome: customThemeColors.dinerChrome || customThemeColors.dinerCream,
    dinerInk: customThemeColors.dinerInk || dinerPreset.dinerInk,
    ink: customThemeColors.ink || dinerPreset.ink,
    bsgPanel: customThemeColors.bsgPanel || customThemeColors.dinerRed,
    bsgSuccess: customThemeColors.bsgSuccess || customThemeColors.dinerMint,
    bsgWarning: customThemeColors.bsgWarning || customThemeColors.dinerCream,
    bsgBorder: customThemeColors.bsgBorder || customThemeColors.bsgAccent
  };
}

function applyThemeColors(colors) {
  const variableNames = {
    bsgBg: "--bsg-bg",
    bsgPanel: "--bsg-panel",
    bsgAccent: "--bsg-accent",
    bsgSuccess: "--bsg-success",
    bsgWarning: "--bsg-warning",
    bsgBorder: "--bsg-border",
    table: "--table",
    tableDeep: "--table-deep",
    dangerRed: "--danger-red",
    ink: "--ink",
    dinerRed: "--diner-red",
    dinerRedDark: "--diner-red-dark",
    dinerCream: "--diner-cream",
    dinerMint: "--diner-mint",
    dinerMintDark: "--diner-mint-dark",
    dinerChrome: "--diner-chrome",
    dinerInk: "--diner-ink"
  };

  Object.entries(variableNames).forEach(([key, variableName]) => {
    document.body.style.setProperty(variableName, colors[key]);
  });
}

function animateRollPointsGain(amount) {
  if (!rollPointsLabel || shell.classList.contains("reduce-motion")) {
    return;
  }

  const normalizedAmount = Number.isFinite(amount) ? Math.max(0, Math.trunc(amount)) : 0;
  if (!normalizedAmount) {
    return;
  }

  const targetRect = rollPointsLabel.getBoundingClientRect();
  const sourceRect = slotRollButton?.getBoundingClientRect() || rollButton?.getBoundingClientRect() || targetRect;
  const chip = document.createElement("span");
  chip.className = "rp-fly-chip";
  chip.textContent = `+${normalizedAmount} RP`;
  chip.style.left = `${sourceRect.left + (sourceRect.width / 2)}px`;
  chip.style.top = `${sourceRect.top + (sourceRect.height / 2)}px`;
  chip.style.setProperty("--rp-target-x", `${targetRect.left + (targetRect.width / 2) - sourceRect.left - (sourceRect.width / 2)}px`);
  chip.style.setProperty("--rp-target-y", `${targetRect.top + (targetRect.height / 2) - sourceRect.top - (sourceRect.height / 2)}px`);
  document.body.append(chip);
  chip.addEventListener("animationend", () => chip.remove(), { once: true });
}

function saveTheme(themeName) {
  localStorage.setItem(themeStorageKey, JSON.stringify({
    name: themeName,
    customColors: customThemeColors,
    savedCustomThemes
  }));
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

function createBoardCards() {
  const cards = buildBoardDeck();
  boardSlotRing?.replaceChildren();

  boardCardRing.replaceChildren(...cards.map((card, index) => {
    const position = getBoardCardPosition(index);
    const slot = document.createElement("span");
    const tile = document.createElement("button");
    slot.className = "board-slot";
    slot.style.left = `${position.x}%`;
    slot.style.top = `${position.y}%`;
    slot.style.setProperty("--tile-rotation", `${position.rotation}deg`);
    slot.dataset.index = String(index);

    tile.type = "button";
    tile.className = `board-card ${card.type || (card.suit === "H" || card.suit === "D" ? "red" : "black")}`;
    tile.dataset.index = String(index);
    tile.dataset.rpCost = String(getCardRollPointCost(index));
    tile.dataset.purchaseState = isPurchasableCardIndex(index) ? "available" : "unavailable";
    tile.dataset.rank = card.label;
    tile.dataset.suit = card.suit;
    tile.dataset.cardName = card.name || `${card.label} of ${suitNames[card.suit]}`;
    tile.dataset.cardPrice = String(getRankPurchasePrice(card.label));
    tile.dataset.sellPrice = String(getCardSellPrice(card.label));
    tile.dataset.penalty = String(getCardLandingPenalty(card.label));
    tile.dataset.multiplier = getCardHandMultiplier(card.label);
    tile.dataset.control = "boardCards";
    tile.setAttribute("aria-label", `Board card ${index + 1}: ${card.name || `${card.label} of ${suitNames[card.suit]}`}`);
    tile.innerHTML = `<span>${card.label}</span><strong>${suitIcons[card.suit] || ""}</strong>`;
    slot.append(tile);
    return slot;
  }));
}

function getCardRollPointCost(index) {
  return (index % 6) + 1;
}

function isPurchasableCardIndex(index) {
  return index >= 0 && index < boardSpaceCount;
}

function createPlayerTokens() {
  playerTokenLayer?.replaceChildren();
  playerTokenColors.forEach((color, index) => {
    const token = document.createElement("div");
    token.className = "player-token";
    token.dataset.token = String(index);
    token.style.setProperty("--token-color", color);
    token.setAttribute("aria-label", `Player ${index + 1} token`);
    token.innerHTML = `<span>P${index + 1}</span>`;
    setTokenBoardPosition(token, startingPlayerPositions[index]);
  });
}

function getBoardCardPosition(index) {
  const angle = (index / boardSpaceCount) * Math.PI * 2 - Math.PI / 2;
  const radius = 44.1;

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
    rotation: (angle * 180 / Math.PI) + 90
  };
}

function getBoardRotationForCardIndex(index) {
  return 180 - ((index / boardSpaceCount) * 360);
}

function getContinuousBoardRotation(targetIndex) {
  const baseRotation = getBoardRotationForCardIndex(targetIndex);
  const rotationsFromCurrent = Math.round((boardRotationDegrees - baseRotation) / 360);

  return baseRotation + rotationsFromCurrent * 360;
}

function centerBoardOnCardIndex(index, delayMs = 0, durationMs) {
  window.clearTimeout(pendingBoardCenterTimer);

  pendingBoardCenterTimer = window.setTimeout(() => {
    tweenBoardRotation(getContinuousBoardRotation(index), durationMs);
  }, delayMs);
}

function tweenBoardRotation(targetRotation, durationOverrideMs) {
  window.cancelAnimationFrame(boardRotationAnimationFrame);

  const startRotation = boardRotationDegrees;
  const change = targetRotation - startRotation;
  const duration = shell.classList.contains("reduce-motion")
    ? 0
    : Math.max(160, Number.isFinite(durationOverrideMs) ? durationOverrideMs : boardRotationDurationMs);

  if (!duration || Math.abs(change) < 0.001) {
    boardRotationDegrees = targetRotation;
    boardRotator.style.setProperty("--player-rotation", `${boardRotationDegrees}deg`);
    return;
  }

  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const easedProgress = easeInOutCubic(progress);
    boardRotationDegrees = startRotation + (change * easedProgress);
    boardRotator.style.setProperty("--player-rotation", `${boardRotationDegrees}deg`);

    if (progress < 1) {
      boardRotationAnimationFrame = window.requestAnimationFrame(animate);
      return;
    }

    boardRotationDegrees = targetRotation;
    boardRotator.style.setProperty("--player-rotation", `${boardRotationDegrees}deg`);
  }

  boardRotationAnimationFrame = window.requestAnimationFrame(animate);
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - ((-2 * progress + 2) ** 3) / 2;
}

function scheduleLandingCardAnimation(boardIndex, delayMs = 0) {
  window.clearTimeout(pendingCardAnimationTimer);

  if (!isPurchasableCardIndex(boardIndex)) {
    scheduleNextTurn(delayMs + 320);
    return;
  }

  pendingCardAnimationTimer = window.setTimeout(() => {
    const card = boardCardRing.querySelector(`.board-card[data-index="${boardIndex}"]`);
    if (!card) {
      scheduleNextTurn(320);
      return;
    }

    if (card.dataset.purchaseState === "purchased") {
      resolveOwnedCardLanding(card);
      scheduleNextTurn(520);
      return;
    }

    if (card.dataset.purchaseState !== "available") {
      scheduleNextTurn(320);
      return;
    }

    awaitingLandingDecision = true;
    cardAnimationModule.play(card);
  }, delayMs);
}

function resolveOwnedCardLanding(cardElement) {
  const ownerIndex = Number.parseInt(cardElement.dataset.owner || "0", 10) - 1;
  const landingPlayerIndex = turnModule.getState().currentPlayer;
  const isOwnerBestHand = cardElement.classList.contains("best-hand")
    && Number.parseInt(cardElement.dataset.bestHand || "0", 10) - 1 === ownerIndex;

  if (!Number.isFinite(ownerIndex) || ownerIndex < 0 || ownerIndex === landingPlayerIndex || !isOwnerBestHand) {
    return;
  }

  purchaseAuctionModule.chargePenalty(landingPlayerIndex, ownerIndex, cardElement.dataset.penalty || "0");
}

function purchaseBoardCard(cardElement, options = {}) {
  if (!cardElement) {
    return { success: false, message: "No card selected" };
  }

  const playerIndex = turnModule.getState().currentPlayer;
  const purchaseResult = purchaseAuctionModule.purchase(cardElement, playerIndex, options);
  if (!purchaseResult.success) {
    return purchaseResult;
  }

  ownershipHighlightModule.markPurchased(cardElement, playerIndex);
  updateBestHandHighlights();
  awaitingLandingDecision = false;

  return { ...purchaseResult, playerIndex, playerColor: playerTokenColors[playerIndex] };
}

function passBoardCard(cardElement) {
  cardElement?.classList.add("passed");
  awaitingLandingDecision = false;
  scheduleNextTurn(260);
}

function canSpinForBoardCard(cardElement) {
  if (!cardElement || cardElement.dataset.purchaseState !== "available") {
    return false;
  }

  const playerIndex = turnModule.getState().currentPlayer;
  const currentRollPoints = turnModule.getState().playerRollPoints[playerIndex];
  return (!paidBonusSpinUsedThisTurn && currentRollPoints >= getBoardCardCost(cardElement))
    || hasBonusSpinCard(playerIndex);
}

function spinForBoardCard(cardElement, promptControls, options = {}) {
  if (!cardElement || !promptControls) {
    return;
  }

  const spinCost = getBoardCardCost(cardElement);
  const isFreeSpin = Boolean(options.freeSpin);
  const playerIndex = turnModule.getState().currentPlayer;

  if (!isFreeSpin) {
    if (paidBonusSpinUsedThisTurn) {
      if (!consumeBonusSpinCard(playerIndex)) {
        promptControls.setStatus("Bonus spin already used");
        promptControls.setSpinEnabled();
        return;
      }
      promptControls.setStatus("Free Roll bonus used");
    } else if (turnModule.spendCurrentPlayerRollPoints(spinCost)) {
      paidBonusSpinUsedThisTurn = true;
    } else if (consumeBonusSpinCard(playerIndex)) {
      promptControls.setStatus("Free Roll bonus used");
    } else {
      promptControls.setStatus(`Need ${spinCost} RP`);
      promptControls.setSpinEnabled();
      return;
    }
  }

  promptControls.startBonusSlotMachine({
    prize: rollBonusSlotPrize(),
    onComplete: (prize) => applyBonusSlotPrize(prize, cardElement, promptControls)
  });
}

function applyBonusSlotPrize(prize, cardElement, promptControls) {
  switch (prize.type) {
    case "free-card":
      promptControls.setPurchaseFree();
      break;
    case "discount":
      promptControls.setPurchaseDiscount(50);
      break;
    case "spin-again":
      promptControls.grantFreeSpin();
      promptControls.setStatus("Spin again won");
      break;
    case "bogo":
      addBonusToCurrentPlayer("Buy 1 Get 1 50% Off");
      promptControls.setStatus("Bonus saved");
      break;
    case "pic":
      addBonusToCurrentPlayer("PIC");
      promptControls.setStatus("PIC saved");
      break;
    case "free-roll":
      addBonusToCurrentPlayer("Free Roll");
      promptControls.setStatus("Free Roll saved");
      break;
    case "rp":
      turnModule.addCurrentPlayerRollPoints(100);
      promptControls.setStatus("100 RP added");
      break;
    case "bankruptcy":
      turnModule.clearCurrentPlayerRollPoints();
      promptControls.setStatus("All RP lost");
      break;
    case "shield":
      addBonusToCurrentPlayer("Shield");
      promptControls.setStatus("Shield saved");
      break;
    case "steal":
      addBonusToCurrentPlayer("Steal");
      promptControls.setStatus("Steal saved");
      break;
    default:
      promptControls.setStatus("No win");
      break;
  }

  if (prize.type === "no-win") {
    promptControls.setStatus("No win");
  }

  currentLandingCost = getBoardCardCost(cardElement);
  renderTurnState(turnModule.getState());
}

function scheduleNextTurn(delayMs = 0) {
  window.clearTimeout(pendingNextTurnTimer);

  pendingNextTurnTimer = window.setTimeout(() => {
    if (awaitingLandingDecision) {
      return;
    }

    turnModule.nextTurn();
  }, Math.max(0, delayMs));
}

function applyBoardViewMode(turnState, boardIndex = turnState.playerPositions[turnState.currentPlayer], options = {}) {
  const isWideView = boardViewMode === "wide";
  const presetName = isWideView ? "tableWide" : "turnFocus";
  if (options.centerBoard !== false) {
    centerBoardOnCardIndex(boardIndex, 0);
  }
  cameraModule.setPreset(presetName, turnState, boardIndex);

  if (viewToggleButton) {
    viewToggleButton.textContent = isWideView ? "Zoom" : "Wide";
    viewToggleButton.setAttribute("aria-pressed", String(isWideView));
    viewToggleButton.setAttribute("aria-label", isWideView ? "Switch to active player zoom" : "Switch to wide board view");
  }
}

function addBonusToCurrentPlayer(label) {
  const playerIndex = turnModule.getState().currentPlayer;
  const inventory = playerBonuses[playerIndex];

  if (inventory.length >= 3) {
    inventory.shift();
  }

  inventory.push(label);
  renderBonusSlots(playerIndex);
}

function hasBonusSpinCard(playerIndex = turnModule.getState().currentPlayer) {
  return (playerBonuses[playerIndex] || []).includes("Free Roll");
}

function consumeBonusSpinCard(playerIndex = turnModule.getState().currentPlayer) {
  const inventory = playerBonuses[playerIndex] || [];
  const bonusIndex = inventory.indexOf("Free Roll");

  if (bonusIndex === -1) {
    return false;
  }

  inventory.splice(bonusIndex, 1);
  renderBonusSlots(playerIndex);
  return true;
}

function renderBonusSlots(playerIndex = turnModule.getState().currentPlayer) {
  if (!playerBonusSlots) {
    return;
  }

  const inventory = playerBonuses[playerIndex] || [];
  playerBonusSlots.querySelectorAll("[data-bonus-slot]").forEach((slot, index) => {
    const bonus = inventory[index] || "";
    slot.dataset.bonus = bonus;
    slot.innerHTML = bonus ? getBonusSlotMarkup(bonus) : "";
    slot.classList.toggle("filled", Boolean(bonus));
  });
}

function getBonusSlotMarkup(bonus) {
  const labelMap = {
    PIC: "PIC Card"
  };
  const imageSrc = getBonusIconSrc(labelMap[bonus] || bonus);
  if (imageSrc) {
    return `<span class="bonus-slot-icon image-icon" aria-label="${bonus} bonus"><img src="${imageSrc}" alt=""></span>`;
  }

  const bonusIcons = {
    Shield: getShieldIconMarkup("Shield bonus"),
    PIC: `<span class="bonus-slot-icon pic-icon" aria-label="PIC bonus">P</span>`,
    "Free Roll": `<span class="bonus-slot-icon roll-icon" aria-label="Free Roll bonus">6</span>`,
    Steal: `<span class="bonus-slot-icon steal-icon" aria-label="Steal bonus">$</span>`
  };

  return bonusIcons[bonus] || `<span class="bonus-slot-icon bonus-icon" aria-label="${bonus} bonus">*</span>`;
}

function getShieldIconMarkup(label = "Shield") {
  return `
    <span class="bonus-slot-icon shield-icon" aria-label="${label}">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2.7 19 5.4v5.5c0 4.7-2.8 8.7-7 10.4-4.2-1.7-7-5.7-7-10.4V5.4l7-2.7Z"></path>
        <path d="M12 5.5v12.1"></path>
      </svg>
    </span>
  `;
}

function getBoardCardCost(cardElement) {
  return Math.max(0, Number.parseInt(cardElement?.dataset.rpCost || "0", 10) || 0);
}

function setTokenBoardPosition(token, boardIndex) {
  const slot = getBoardSlotElement(boardIndex);
  if (slot && token.parentElement !== slot) {
    slot.append(token);
  }

  token.style.left = "";
  token.style.top = "";
  token.style.removeProperty("--token-rotation");
  token.dataset.boardIndex = String(boardIndex);
}

function setFloatingTokenBoardPosition(token, boardIndex) {
  if (playerTokenLayer && token.parentElement !== playerTokenLayer) {
    playerTokenLayer.append(token);
  }

  const position = getTokenInnerRingPosition(boardIndex);
  token.style.left = `${position.x}%`;
  token.style.top = `${position.y}%`;
  token.style.setProperty("--token-rotation", `${position.rotation}deg`);
  token.dataset.boardIndex = String(Math.round(boardIndex));
}

function getBoardSlotElement(boardIndex) {
  const normalizedIndex = ((Math.round(boardIndex) % boardSpaceCount) + boardSpaceCount) % boardSpaceCount;
  return boardCardRing.querySelector(`.board-slot[data-index="${normalizedIndex}"]`);
}

function getTokenInnerRingPosition(index) {
  const angle = (index / boardSpaceCount) * Math.PI * 2 - Math.PI / 2;
  const radius = 44.1;

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
    rotation: (angle * 180 / Math.PI) + 90
  };
}

function animateBoardClockwise(fromIndex, toIndex, delayMs = 0) {
  const existingTimers = tokenAnimationTimers.get("board") || [];
  existingTimers.forEach((timer) => window.clearTimeout(timer));
  const distance = (toIndex - fromIndex + boardSpaceCount) % boardSpaceCount;
  const moveDuration = shell.classList.contains("reduce-motion")
    ? 0
    : Math.min(boardMoveMaxMs, Math.max(boardMoveMinMs, distance * boardMoveMsPerCard));
  const timer = window.setTimeout(() => {
    centerBoardOnCardIndex(toIndex, 0, moveDuration);
  }, delayMs);

  tokenAnimationTimers.set("board", [timer]);

  return delayMs + moveDuration;
}

function animateTokenWithBoard(token, fromIndex, toIndex, delayMs = 0) {
  const playerIndex = Number(token.dataset.token);
  const existingTimers = tokenAnimationTimers.get(playerIndex) || [];
  existingTimers.forEach((timer) => window.clearTimeout(timer));
  const existingFrame = tokenAnimationFrames.get(playerIndex);
  if (existingFrame) {
    window.cancelAnimationFrame(existingFrame);
  }

  const distance = (toIndex - fromIndex + boardSpaceCount) % boardSpaceCount;
  const moveDuration = shell.classList.contains("reduce-motion")
    ? 0
    : Math.min(boardMoveMaxMs, Math.max(boardMoveMinMs, distance * boardMoveMsPerCard));

  setFloatingTokenBoardPosition(token, fromIndex);
  token.style.setProperty("--token-move-ms", "0ms");
  fxOverlayModule.playTokenTrail({ playerIndex, fromIndex, toIndex, durationMs: moveDuration, delayMs });

  const timer = window.setTimeout(() => {
    if (!moveDuration) {
      setTokenBoardPosition(token, toIndex);
      centerBoardOnCardIndex(toIndex, 0, moveDuration);
      return;
    }

    const startedAt = performance.now();

    const tick = (timestamp) => {
      const elapsed = timestamp - startedAt;
      const progress = Math.min(1, elapsed / moveDuration);
      const easedProgress = easeInOutCubic(progress);
      const currentIndex = fromIndex + distance * easedProgress;
      setFloatingTokenBoardPosition(token, currentIndex);

      if (progress < 1) {
        tokenAnimationFrames.set(playerIndex, window.requestAnimationFrame(tick));
        return;
      }

      tokenAnimationFrames.delete(playerIndex);
      setTokenBoardPosition(token, toIndex);
      token.style.setProperty("--token-move-ms", "150ms");
    };

    tokenAnimationFrames.set(playerIndex, window.requestAnimationFrame(tick));
    centerBoardOnCardIndex(toIndex, 0, moveDuration);
  }, delayMs);

  tokenAnimationTimers.set(playerIndex, [timer]);

  return delayMs + moveDuration;
}

function formatMiniCards() {
  document.querySelectorAll(".mini-card").forEach((card) => {
    const match = card.textContent.trim().match(/^(.+)([♥♦♣♠])$/);

    if (!match) {
      return;
    }

    card.innerHTML = `<span>${match[1]}</span><strong>${match[2]}</strong>`;
  });
}

function applyMasterControl() {
  document.querySelectorAll("[data-control]").forEach((element) => {
    const control = getControlDocValue(element.dataset.control);

    if (!control) {
      return;
    }

    element.style.setProperty("--control-x", `${numberOrDefault(control.xPercent, 0)}%`);
    element.style.setProperty("--control-y", `${numberOrDefault(control.yPercent, 0)}%`);
    element.style.setProperty("--control-rotation", `${numberOrDefault(control.rotationPercent, 0) * 3.6}deg`);
    element.style.setProperty("--control-scale", String(numberOrDefault(control.scalePercent, 100) / 100));
  });
}

function createControlDocPanel() {
  if (!controlDocList) {
    return;
  }

  controlDocList.replaceChildren(...controlDocOrder.map(createControlDocSection));
  syncControlDocInputs();
}

function createControlDocSection(controlKey) {
  const control = getControlDocValue(controlKey);
  const section = document.createElement("section");
  section.className = "control-doc-section";
  section.dataset.controlSection = controlKey;
  section.innerHTML = `
    <div class="control-doc-heading">
      <span>${controlDocLabels[controlKey]}</span>
      <strong data-control-summary="${controlKey}">${formatControlDocSummary(control)}</strong>
    </div>
    ${createControlDocSlider(controlKey, "xPercent", "Move Left / Right", -100, 100, 1)}
    ${createControlDocSlider(controlKey, "yPercent", "Move Up / Down", -100, 100, 1)}
    ${createControlDocSlider(controlKey, "rotationPercent", "Rotate", -100, 100, 1)}
    ${createControlDocSlider(controlKey, "scalePercent", "Scale", 20, 260, 1)}
  `;

  section.querySelectorAll("[data-control-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const nextValue = Number(input.value);
      const targetControl = getControlDocValue(controlKey);
      targetControl[input.dataset.controlField] = nextValue;
      applyMasterControl();
      syncControlDocReadout(input);
      syncControlDocSummary(controlKey);
    });
  });

  return section;
}

function createControlDocSlider(controlKey, field, label, min, max, step) {
  return `
    <label class="control-doc-row">
      <span>${label}</span>
      <input type="range" min="${min}" max="${max}" step="${step}" value="0" data-control-key="${controlKey}" data-control-field="${field}">
      <strong data-control-readout="${controlKey}:${field}">0</strong>
    </label>
  `;
}

function loadSavedControlDoc() {
  const defaults = cloneControlDocDefaults();

  try {
    const stored = JSON.parse(localStorage.getItem(controlDocStorageKey) || "null");
    if (!stored || typeof stored !== "object") {
      return defaults;
    }

    return mergeControlDocValues(defaults, stored);
  } catch {
    return defaults;
  }
}

function cloneControlDocDefaults() {
  return mergeControlDocValues({}, MASTER_CONTROL);
}

function mergeControlDocValues(base, source) {
  const merged = { ...base };
  Object.entries(source || {}).forEach(([key, value]) => {
    if (!value || typeof value !== "object" || key === "gameplay" || key === "camera") {
      return;
    }

    merged[key] = {
      xPercent: numberOrDefault(Number(value.xPercent), numberOrDefault(merged[key]?.xPercent, 0)),
      yPercent: numberOrDefault(Number(value.yPercent), numberOrDefault(merged[key]?.yPercent, 0)),
      rotationPercent: numberOrDefault(Number(value.rotationPercent), numberOrDefault(merged[key]?.rotationPercent, 0)),
      scalePercent: numberOrDefault(Number(value.scalePercent), numberOrDefault(merged[key]?.scalePercent, 100))
    };
  });

  if (merged.boardCards) {
    merged.boardCards.scalePercent = MASTER_CONTROL.boardCards.scalePercent;
  }

  return merged;
}

function getControlDocValue(controlKey) {
  if (!controlKey) {
    return null;
  }

  if (!controlDocValues[controlKey]) {
    const fallback = MASTER_CONTROL[controlKey] || {};
    controlDocValues[controlKey] = {
      xPercent: numberOrDefault(Number(fallback.xPercent), 0),
      yPercent: numberOrDefault(Number(fallback.yPercent), 0),
      rotationPercent: numberOrDefault(Number(fallback.rotationPercent), 0),
      scalePercent: numberOrDefault(Number(fallback.scalePercent), 100)
    };
  }

  return controlDocValues[controlKey];
}

function syncControlDocInputs() {
  controlDocList?.querySelectorAll("[data-control-field]").forEach((input) => {
    const control = getControlDocValue(input.dataset.controlKey);
    input.value = String(numberOrDefault(control[input.dataset.controlField], input.dataset.controlField === "scalePercent" ? 100 : 0));
    syncControlDocReadout(input);
  });

  controlDocOrder.forEach(syncControlDocSummary);
}

function syncControlDocReadout(input) {
  const readout = controlDocList?.querySelector(`[data-control-readout="${input.dataset.controlKey}:${input.dataset.controlField}"]`);
  if (!readout) {
    return;
  }

  const value = Number(input.value);
  readout.textContent = input.dataset.controlField === "scalePercent"
    ? `${value}%`
    : input.dataset.controlField === "rotationPercent"
      ? `${value}%`
      : `${value}%`;
}

function syncControlDocSummary(controlKey) {
  const summary = controlDocList?.querySelector(`[data-control-summary="${controlKey}"]`);
  if (summary) {
    summary.textContent = formatControlDocSummary(getControlDocValue(controlKey));
  }
}

function formatControlDocSummary(control) {
  return `X ${numberOrDefault(control?.xPercent, 0)} / Y ${numberOrDefault(control?.yPercent, 0)} / S ${numberOrDefault(control?.scalePercent, 100)}%`;
}

function setControlDocOpen(isOpen) {
  if (!controlDocPanel || !controlDocToggle) {
    return;
  }

  controlDocPanel.hidden = !isOpen;
  controlDocToggle.setAttribute("aria-expanded", String(isOpen));
}

function saveControlDoc() {
  localStorage.setItem(controlDocStorageKey, JSON.stringify(controlDocValues));
}

function flashControlDocStatus(message) {
  if (!controlDocSave) {
    return;
  }

  const originalText = controlDocSave.textContent;
  controlDocSave.textContent = message;
  window.setTimeout(() => {
    controlDocSave.textContent = originalText;
  }, 900);
}

function numberOrDefault(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function buildBoardDeck() {
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const suits = ["H", "C", "D", "S"];
  const deck = Array.from({ length: 52 }, (_, index) => {
    const label = ranks[index % ranks.length];
    const suit = suits[index % suits.length];
    return { label, suit };
  });
  deck.push(
    { label: "W", suit: "", type: "wild", name: "Wild card" },
    { label: "?", suit: "", type: "mystery", name: "Mystery card" }
  );
  return deck;
}

function getCardSellPrice(rank) {
  return Math.floor(getRankPurchasePrice(rank) * 0.5);
}

function getCardLandingPenalty(rank) {
  return Math.max(50, Math.floor(getRankPurchasePrice(rank) * 0.2));
}

function getCardHandMultiplier(rank) {
  const multiplierMap = {
    A: "x3.0",
    K: "x2.5",
    Q: "x2.25",
    J: "x2.0",
    "10": "x1.8",
    "9": "x1.7",
    "8": "x1.6",
    "7": "x1.5",
    "6": "x1.4",
    "5": "x1.3",
    "4": "x1.2",
    "3": "x1.1",
    "2": "x1.0"
  };

  return multiplierMap[rank] || "x1.0";
}

function updateBestHandHighlights() {
  boardCardRing.querySelectorAll(".board-card.best-hand").forEach((card) => {
    card.classList.remove("best-hand");
    card.removeAttribute("data-best-hand");
  });

  playerTokenColors.forEach((_, playerIndex) => {
    const bestCards = getBestPokerHandCards(purchaseAuctionModule.getPlayer(playerIndex).cards);
    bestCards.forEach((card) => {
      const boardCard = boardCardRing.querySelector(`.board-card[data-index="${card.boardIndex}"]`);
      if (!boardCard) {
        return;
      }

      boardCard.classList.add("best-hand");
      boardCard.dataset.bestHand = String(playerIndex + 1);
    });
  });
}

function getBestPokerHandCards(cards) {
  const playableCards = cards.filter((card) => rankValue(card.rank) > 0 && card.suit);
  if (!playableCards.length) {
    return [];
  }

  if (playableCards.length < 5) {
    return getBestPartialPokerHandCards(playableCards);
  }

  let bestCards = [];
  let bestScore = null;

  for (let first = 0; first < playableCards.length - 4; first += 1) {
    for (let second = first + 1; second < playableCards.length - 3; second += 1) {
      for (let third = second + 1; third < playableCards.length - 2; third += 1) {
        for (let fourth = third + 1; fourth < playableCards.length - 1; fourth += 1) {
          for (let fifth = fourth + 1; fifth < playableCards.length; fifth += 1) {
            const candidate = [
              playableCards[first],
              playableCards[second],
              playableCards[third],
              playableCards[fourth],
              playableCards[fifth]
            ];
            const score = scorePokerHand(candidate);
            if (!bestScore || comparePokerScores(score, bestScore) > 0) {
              bestScore = score;
              bestCards = candidate;
            }
          }
        }
      }
    }
  }

  return orderPokerHandCards(bestCards);
}

function getBestPartialPokerHandCards(cards) {
  const groups = new Map();
  cards.forEach((card) => {
    const value = rankValue(card.rank);
    groups.set(value, [...(groups.get(value) || []), card]);
  });

  const groupedCards = [...groups.entries()].sort((first, second) => {
    if (second[1].length !== first[1].length) {
      return second[1].length - first[1].length;
    }
    return second[0] - first[0];
  });

  return [...(groupedCards[0]?.[1] || [])].sort((first, second) => rankValue(second.rank) - rankValue(first.rank));
}

function orderPokerHandCards(cards) {
  return [...cards].sort((first, second) => {
    const firstCount = cards.filter((card) => card.rank === first.rank).length;
    const secondCount = cards.filter((card) => card.rank === second.rank).length;
    if (secondCount !== firstCount) {
      return secondCount - firstCount;
    }
    return rankValue(second.rank) - rankValue(first.rank);
  });
}

function scorePokerHand(cards) {
  const values = cards.map((card) => rankValue(card.rank)).sort((a, b) => b - a);
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const countGroups = [...counts.entries()].sort((first, second) => second[1] - first[1] || second[0] - first[0]);
  const isFlush = cards.every((card) => card.suit === cards[0].suit);
  const straightHigh = getStraightHigh(values);

  if (isFlush && straightHigh) {
    return [8, straightHigh];
  }
  if (countGroups[0][1] === 4) {
    return [7, countGroups[0][0], ...values.filter((value) => value !== countGroups[0][0])];
  }
  if (countGroups[0][1] === 3 && countGroups[1]?.[1] === 2) {
    return [6, countGroups[0][0], countGroups[1][0]];
  }
  if (isFlush) {
    return [5, ...values];
  }
  if (straightHigh) {
    return [4, straightHigh];
  }
  if (countGroups[0][1] === 3) {
    return [3, countGroups[0][0], ...values.filter((value) => value !== countGroups[0][0])];
  }
  if (countGroups[0][1] === 2 && countGroups[1]?.[1] === 2) {
    const pairValues = countGroups.slice(0, 2).map(([value]) => value).sort((a, b) => b - a);
    return [2, ...pairValues, ...values.filter((value) => !pairValues.includes(value))];
  }
  if (countGroups[0][1] === 2) {
    return [1, countGroups[0][0], ...values.filter((value) => value !== countGroups[0][0])];
  }

  return [0, ...values];
}

function comparePokerScores(score, bestScore) {
  const length = Math.max(score.length, bestScore.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (score[index] || 0) - (bestScore[index] || 0);
    if (delta !== 0) {
      return delta;
    }
  }
  return 0;
}

function getStraightHigh(values) {
  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
  if (uniqueValues.join(",") === "14,5,4,3,2") {
    return 5;
  }

  for (let index = 0; index <= uniqueValues.length - 5; index += 1) {
    const run = uniqueValues.slice(index, index + 5);
    if (run[0] - run[4] === 4) {
      return run[0];
    }
  }

  return 0;
}

function rankValue(rank) {
  const values = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    "10": 10,
    "9": 9,
    "8": 8,
    "7": 7,
    "6": 6,
    "5": 5,
    "4": 4,
    "3": 3,
    "2": 2
  };
  return values[rank] || 0;
}

function renderTurnState(turnState) {
  const activePlayerIndex = turnState.currentPlayer;
  const activeBoardIndex = turnState.playerPositions[activePlayerIndex];
  currentLandingCost = getCardRollPointCost(activeBoardIndex);
  const currentRollPoints = turnState.playerRollPoints[activePlayerIndex];
  const previousActiveBoardIndex = lastRenderedTurnState?.playerPositions?.[activePlayerIndex];
  const didActiveTurnChange = lastRenderedTurnState?.currentPlayer !== undefined
    && lastRenderedTurnState.currentPlayer !== activePlayerIndex;
  const didActiveTokenMove = lastRenderedTurnState?.currentPlayer === activePlayerIndex
    && previousActiveBoardIndex !== undefined
    && previousActiveBoardIndex !== activeBoardIndex;

  if (!lastRenderedTurnState || didActiveTurnChange) {
    paidBonusSpinUsedThisTurn = false;
  }

  perspectiveTable.dataset.currentPlayer = String(turnState.currentPlayerNumber);
  currentTurnLabel.textContent = `Player ${turnState.currentPlayerNumber} turn`;
  rollPointsLabel.textContent = String(currentRollPoints);
  landingCostLabel.textContent = `Spin cost ${currentLandingCost} RP`;
  purchaseAuctionModule.setActivePlayer(activePlayerIndex);
  renderBonusSlots(activePlayerIndex);
  slotReelRoot.classList.toggle("spin-ready", (!paidBonusSpinUsedThisTurn && currentRollPoints >= currentLandingCost) || hasBonusSpinCard(activePlayerIndex));

  document.querySelectorAll(".player-token").forEach((token) => {
    const playerIndex = Number(token.dataset.token);
    const targetBoardIndex = turnState.playerPositions[playerIndex];
    token.classList.toggle("active", playerIndex === turnState.currentPlayer);

    if (playerIndex === activePlayerIndex && didActiveTokenMove) {
      return;
    }

    setTokenBoardPosition(token, targetBoardIndex);
  });

  const activeToken = document.querySelector(`.player-token[data-token="${activePlayerIndex}"]`);

  let tokenMoveDelay = 0;

  if (didActiveTokenMove) {
    tokenMoveDelay = activeToken
      ? animateTokenWithBoard(activeToken, previousActiveBoardIndex, activeBoardIndex, 0)
      : animateBoardClockwise(previousActiveBoardIndex, activeBoardIndex, 0);
    applyBoardViewMode(turnState, activeBoardIndex, { centerBoard: false });
    scheduleLandingCardAnimation(activeBoardIndex, tokenMoveDelay + 540);
  } else {
    centerBoardOnCardIndex(activeBoardIndex, 0);
    if (suppressNextTurnFocus) {
      suppressNextTurnFocus = false;
      applyBoardViewMode(turnState, activeBoardIndex);
    } else if (!lastRenderedTurnState || didActiveTurnChange) {
      applyBoardViewMode(turnState, activeBoardIndex);
    }
  }

  lastRenderedTurnState = {
    ...turnState,
    playerPositions: [...turnState.playerPositions]
  };
}
