export function createCameraModule({ boardStage, perspectiveTable, cameraControl = {} }) {
  let returnFocusTimer = 0;
  let cutResetTimer = 0;
  const orbitBoard = boardStage.querySelector("#orbitBoard");
  const boardSpaceCount = 56;
  const CAMERA_PRESETS = {
    turnFocus: {
      mode: "turn-focus",
      followsToken: false,
      cameraLeftRightPercent: 0,
      cameraUpDownPercent: 14,
      cameraZoomPercent: 132,
      cameraRollPercent: 0,
      tablePitchDegrees: 66,
      tableUpDownPercent: 5,
      tableSizePercent: 116,
      label: "Fixed player camera"
    },
    moveFront: {
      mode: "move-front",
      followsToken: false,
      cameraLeftRightPercent: 0,
      cameraUpDownPercent: -6,
      cameraZoomPercent: 126,
      cameraRollPercent: 0,
      tablePitchDegrees: 67,
      tableUpDownPercent: 2,
      tableSizePercent: 112,
      label: "Move front camera"
    },
    tableWide: {
      mode: "table-wide",
      followsToken: false,
      cameraLeftRightPercent: 0,
      cameraUpDownPercent: 0,
      cameraZoomPercent: 100,
      cameraRollPercent: 0,
      tablePitchDegrees: 58,
      tableUpDownPercent: -4,
      tableSizePercent: 100,
      label: "Wide table camera"
    }
  };

  function focusTurn(turnState, boardIndex = 0, delayMs = 0) {
    window.clearTimeout(returnFocusTimer);

    returnFocusTimer = window.setTimeout(() => {
      applyPreset("turnFocus", boardIndex);
      perspectiveTable.setAttribute(
        "aria-label",
        `${CAMERA_PRESETS.turnFocus.label}. Board centered on Player ${turnState.currentPlayerNumber}`
      );
    }, delayMs);
  }

  function startMoveShot({ turnState, fromIndex, toIndex, durationMs }) {
    window.clearTimeout(returnFocusTimer);

    applyPreset("turnFocus", toIndex);
    perspectiveTable.setAttribute(
      "aria-label",
      `${CAMERA_PRESETS.turnFocus.label}. Player ${turnState.currentPlayerNumber} moving`
    );
  }

  function showBoard(turnState) {
    window.clearTimeout(returnFocusTimer);
    const boardIndex = turnState.playerPositions[turnState.currentPlayer] || 0;
    applyPreset("turnFocus", boardIndex);
    perspectiveTable.setAttribute(
      "aria-label",
      `${CAMERA_PRESETS.turnFocus.label}. Player ${turnState.currentPlayerNumber}`
    );
  }

  function render(turnState, boardIndex = 0) {
    focusTurn(turnState, boardIndex);
  }

  function previewPreset(name, boardIndex = 0) {
    applyPreset(name, boardIndex);
    cutCamera();
  }

  function setPreset(name, turnState, boardIndex = 0) {
    window.clearTimeout(returnFocusTimer);
    applyPreset(name, boardIndex);
    perspectiveTable.setAttribute(
      "aria-label",
      `${getPreset(name).label}. Player ${turnState.currentPlayerNumber}`
    );
  }

  function applyPreset(name, boardIndex) {
    const preset = getPreset(name);
    boardStage.dataset.cameraMode = preset.mode;
    applyBoardCameraVars(preset);

    if (!preset.followsToken) {
      applyFixedCameraVars(
        getNumber(preset, "cameraLeftRightPercent", "xPercent", 0),
        getNumber(preset, "cameraUpDownPercent", "yPercent", 0),
        getNumber(preset, "cameraZoomPercent", "scalePercent", 100),
        getNumber(preset, "cameraRollPercent", "rotationPercent", 0)
      );
      return;
    }

    applyCameraVars(
      boardIndex,
      getNumber(preset, "cameraLeftRightPercent", "pullPercent", 0),
      getNumber(preset, "cameraUpDownPercent", "yPullPercent", 0),
      getNumber(preset, "cameraZoomPercent", "scalePercent", 100),
      getNumber(preset, "cameraRollPercent", "rotationPercent", 0)
    );
  }

  function applyFixedCameraVars(xPercent = 0, yPercent = 0, scalePercent = 100, rotationPercent = 0) {
    perspectiveTable.style.setProperty("--camera-x", `${numberOrDefault(xPercent, 0)}%`);
    perspectiveTable.style.setProperty("--camera-y", `${numberOrDefault(yPercent, 0)}%`);
    perspectiveTable.style.setProperty("--camera-rotation", `${numberOrDefault(rotationPercent, 0) * 3.6}deg`);
    perspectiveTable.style.setProperty("--camera-scale", String(numberOrDefault(scalePercent, 100) / 100));
  }

  function applyBoardCameraVars(preset) {
    if (!orbitBoard) {
      return;
    }

    orbitBoard.style.setProperty("--board-camera-tilt", `${getNumber(preset, "tablePitchDegrees", "boardTiltDegrees", 58)}deg`);
    orbitBoard.style.setProperty("--board-camera-y", `${getNumber(preset, "tableUpDownPercent", "boardYPercent", -4)}%`);
    orbitBoard.style.setProperty("--board-camera-scale", String(getNumber(preset, "tableSizePercent", "boardScalePercent", 100) / 100));
  }

  function applyCameraVars(boardIndex, pullPercent = 0, yPullPercent = 0, scalePercent = 100, rotationPercent = 0) {
    const angle = (boardIndex / boardSpaceCount) * Math.PI * 2 - Math.PI / 2;
    const pull = numberOrDefault(pullPercent, 0) / 100;
    const yPull = numberOrDefault(yPullPercent, 0);
    const x = Math.cos(angle) * -pull * 100;
    const y = Math.sin(angle) * -pull * yPull;

    perspectiveTable.style.setProperty("--camera-x", `${x.toFixed(2)}%`);
    perspectiveTable.style.setProperty("--camera-y", `${y.toFixed(2)}%`);
    perspectiveTable.style.setProperty("--camera-rotation", `${numberOrDefault(rotationPercent, 0) * 3.6}deg`);
    perspectiveTable.style.setProperty("--camera-scale", String(numberOrDefault(scalePercent, 100) / 100));
  }

  function getPreset(name) {
    const fallback = CAMERA_PRESETS[name];
    const source = { ...fallback, ...(cameraControl[name] || {}) };
    const mobileSource = isMobileViewport() ? source.mobile || {} : {};
    const preset = { ...source, ...mobileSource, mode: fallback.mode, label: fallback.label };

    if (name === "turnFocus") {
      return {
        ...preset,
        followsToken: false,
        cameraLeftRightPercent: 0,
        cameraRollPercent: 0
      };
    }

    return preset;
  }

  function isMobileViewport() {
    return window.matchMedia?.("(max-width: 520px)").matches;
  }

  function numberOrDefault(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function getNumber(source, preferredName, fallbackName, fallback) {
    return numberOrDefault(source[preferredName], numberOrDefault(source[fallbackName], fallback));
  }

  function cutCamera() {
    window.clearTimeout(cutResetTimer);
    boardStage.classList.add("camera-cut");
    cutResetTimer = window.setTimeout(() => {
      boardStage.classList.remove("camera-cut");
    }, 80);
  }

  return {
    render,
    focusTurn,
    startMoveShot,
    showBoard,
    setPreset,
    previewPreset
  };
}
