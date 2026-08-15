/*
  Master control document for Poker Orbit positioning.

  Edit these percent values, then refresh the browser.
  - xPercent/yPercent move the element by a percentage of its own size.
  - rotationPercent uses 100 as a full 360 degree turn.
  - scalePercent uses 100 as original size.
  - gameplay.tokenStepCards controls how many card spaces each token animation step covers.
*/
export const MASTER_CONTROL = {
  gameplay: {
    tokenStepCards: 1,
    tokenStepDurationMs: 230,
    moveCameraSettleMs: 360,
    endTurnBoardHoldMs: 0
  },

  camera: {
    /*
      Player camera presets.
      - The game now uses turnFocus as a fixed centered camera.
      - The board rotates to put the active player/card in view.
      - cameraLeftRightPercent moves the frame left/right.
      - cameraUpDownPercent moves the frame up/down.
      - cameraZoomPercent is camera zoom.
      - cameraRollPercent rotates the camera frame; 100 is a full turn.
      - tablePitchDegrees is the table pitch; higher is lower/more cinematic.
      - tableUpDownPercent moves the tilted board vertically inside the shot.
      - tableSizePercent scales the tilted board after the base board scale.
      - mobile overrides desktop on narrow phones.
    */
    turnFocus: {
      followsToken: false,
      cameraLeftRightPercent: -10,
      cameraUpDownPercent: 0,
      cameraZoomPercent: 100,
      cameraRollPercent: 0,
      tablePitchDegrees: 52,
      tableUpDownPercent: -129,
      tableSizePercent: 200,
      mobile: {
        cameraLeftRightPercent: -10,
        cameraUpDownPercent: 0,
        cameraZoomPercent: 100,
        tablePitchDegrees: 52,
        tableUpDownPercent: -129,
        tableSizePercent: 200
      }
    },
    moveFront: {
      followsToken: false,
      cameraLeftRightPercent: 0,
      cameraUpDownPercent: 0,
      cameraZoomPercent: 100,
      cameraRollPercent: 0,
      tablePitchDegrees: 68,
      tableUpDownPercent: 7,
      tableSizePercent: 100,
      mobile: {
        cameraLeftRightPercent: 0,
        cameraUpDownPercent: 0,
        cameraZoomPercent: 100,
        tablePitchDegrees: 72,
        tableUpDownPercent: 12,
        tableSizePercent: 100
      }
    },
    tableWide: {
      followsToken: false,
      cameraLeftRightPercent: 0,
      cameraUpDownPercent: 0,
      cameraZoomPercent: 100,
      cameraRollPercent: 0,
      tablePitchDegrees: 58,
      tableUpDownPercent: 0,
      tableSizePercent: 100,
      mobile: {
        cameraUpDownPercent: 0,
        cameraZoomPercent: 100,
        tablePitchDegrees: 58,
        tableUpDownPercent: 0,
        tableSizePercent: 100
      }
    }
  },

  gameTopbar: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  perspectiveTable: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  orbitBoard: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  boardCardRing: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  boardCards: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 160 },
  outerRing: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  innerRing: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  tableCenter: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  seatP1: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  seatP2: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  seatP3: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  seatP4: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  handPanel: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  playerCards: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 },
  gameActions: { xPercent: 0, yPercent: 0, rotationPercent: 0, scalePercent: 100 }
};
