# Poker Orbit Checkpoint

Saved: 2026-07-28 09:52 +10:00

Full build documentation now lives in `BUILD_DOCUMENTATION.md`.

## Current State

- Unity project: `D:\BIG-SLICK-GAMES\GAMES\Poker Orbit`
- Main scene: `Assets/PokerOpoly/Scenes/PokerOpoly_Game.unity`
- Board build menu: `Big Slick Games > Poker-Opoly > Board > Build Board Prototype`
- Unity was opened with DX11 after a D3D12 device-removal crash.

## Important Current Issue

- The external card tile model path was enabled and caused poor runtime performance.
- Current model path used by builder:
  - `Assets/PokerOpoly/Art/Cards/tile.glb`
- The builder also creates a visible `Tile Model Import Probe` to prove the model loaded.

## Recommended First Step Next Session

Disable or optimize external tile model usage before continuing:

- Either set `useExternalTileModel` to `false` in `PokerOpolyPhaseOneBuilder`
- Or create a lightweight tile prefab/material setup and test it on one tile before applying it to all 56 spaces.

## Recent Systems In Place

- 56 board spaces.
- 52 standard cards plus 2 wild and 2 mystery cards.
- Board rotates to player, tokens stay on landed spaces.
- Buy/Skip has a guaranteed IMGUI overlay because 3D card buttons were unreliable.
- Board can be rebuilt from editor menu.
- Generated art passes exist under `Assets/PokerOpoly/Art/Textures`.
- Custom shaders exist under `Assets/PokerOpoly/Shaders`.

## Files Most Recently Touched

- `Assets/PokerOpoly/Scripts/Board/BoardGenerator.cs`
- `Assets/PokerOpoly/Scripts/Board/BoardSpace.cs`
- `Assets/PokerOpoly/Scripts/Core/PokerOpolyPrototypeRunner.cs`
- `Assets/PokerOpoly/Scripts/Editor/PokerOpolyPhaseOneBuilder.cs`
- `Assets/PokerOpoly/Scripts/Players/PlayerTokenController.cs`
- `Assets/PokerOpoly/Shaders/PokerOpolyGlossyTexture.shader`
- `Assets/PokerOpoly/Shaders/PokerOpolyAdditiveGlow.shader`
