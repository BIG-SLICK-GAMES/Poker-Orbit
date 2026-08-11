# Poker Orbit / Poker-Opoly Build Documentation

Last updated: 2026-07-28

## Project

- Unity project: `D:\BIG-SLICK-GAMES\GAMES\Poker Orbit`
- Unity version used: `6000.1.4f1`
- Main scene: `Assets/PokerOpoly/Scenes/PokerOpoly_Game.unity`
- Main rebuild command: `Big Slick Games > Poker-Opoly > Board > Build Board Prototype`
- Recommended launch mode after crash: DX11 / `-force-d3d11`

## Current Build State

This is a playable prototype, not production-ready. Core game rules and flow are in place, but visuals and model integration are unstable.

The user-provided tile model was removed from the board path because it made the game run poorly. The board now generates a lightweight beveled card-tile mesh for every board card directly in `BoardGenerator`, with no external model dependency.

## Main Systems Implemented

- 56-space board.
- 56-card deck:
  - 52 standard playing cards.
  - 2 wild cards.
  - 2 mystery cards.
- Players start equally spaced around the board.
- Board rotates to active player.
- Player tokens stay on their landed space when the board spins.
- Active token stays visually fixed/front during movement while the board rotates underneath.
- Cards on the board are exclusive ownership: two players cannot own the same card.
- Eliminated/broke player cards return to the board/draw pool.
- Best poker hand is evaluated as players collect cards.
- Only cards used in a player’s best hand are highlighted.
- All players’ best-hand highlights can remain visible.
- Wild cards are active for one full revolution of that player, then expire.
- Mystery card effects exist.
- Auction system exists after skipped purchases.
- Buyback/sell-property support exists.
- Property upgrade support exists.
- Best-hand landing penalty exists and uses poker ranking order plus rank strength.
- Save/load buttons exist in the prototype HUD.

## Gameplay Rules Captured

Collection flow:

- Player collects first card and it becomes high card.
- If they collect a higher card, that becomes the high card.
- If they collect matching ranks, pair/trips/etc becomes best hand when stronger.
- The best hand updates as more cards are collected.
- Poker hand ranking must dominate penalties:
  - Trips beat any pair.
  - Pair of Queens beats pair of Twos.
  - Higher same-category hands earn more.

Wild card rule:

- A wild card is active for one full revolution of the player who collected it.
- It expires when that player reaches the same board index again.

Ownership rule:

- A card cannot be owned by two players.
- If a player loses/returns cards, those cards become available again.

## Key Scripts

Core:

- `Assets/PokerOpoly/Scripts/Core/PokerOpolyPrototypeRunner.cs`
  - Runtime prototype flow.
  - Roll/move/resolve/end-turn loop.
  - HUD buttons.
  - Buy/skip overlay.
  - Auctions, upgrades, penalties, card collection.

- `Assets/PokerOpoly/Scripts/Core/PokerOpolyGameController.cs`
  - Creates and owns `GameState`.

- `Assets/PokerOpoly/Scripts/Core/GameState.cs`
  - Runtime state for players, board spaces, auctions, community cards, action history.

Board:

- `Assets/PokerOpoly/Scripts/Board/BoardGenerator.cs`
  - Generates board-space anchors.
  - Current state: board spaces are anchor objects with card fonts and optional external model visual.
  - External tile model is loaded by the builder into `tileModelPrefab`.

- `Assets/PokerOpoly/Scripts/Board/BoardSpace.cs`
  - Per-space runtime visual state.
  - Bounce.
  - Best-hand shine.
  - Ownership marker.

- `Assets/PokerOpoly/Scripts/Board/BoardSpinController.cs`
  - Spins board to active player/space.

- `Assets/PokerOpoly/Scripts/Board/TileInspectionController.cs`
  - Fly-up tile/card inspection.
  - Buy/Skip 3D buttons were unreliable.
  - Functional Buy/Skip currently uses IMGUI overlay in `PokerOpolyPrototypeRunner`.

Cards:

- `Assets/PokerOpoly/Scripts/Cards/PlayingCardDefinition.cs`
- `Assets/PokerOpoly/Scripts/Cards/PlayingCardRuntime.cs`
- `Assets/PokerOpoly/Scripts/Cards/CardRank.cs`
- `Assets/PokerOpoly/Scripts/Cards/CardSuit.cs`
- `Assets/PokerOpoly/Scripts/Cards/CardDeckRole.cs`

Poker:

- `Assets/PokerOpoly/Scripts/Poker/PokerHandEvaluator.cs`
- `Assets/PokerOpoly/Scripts/Poker/BestHandPenaltyService.cs`
- `Assets/PokerOpoly/Scripts/Poker/PokerHandResult.cs`
- `Assets/PokerOpoly/Scripts/Poker/PokerHandCategory.cs`

Economy:

- `Assets/PokerOpoly/Scripts/Economy/WalletService.cs`
- `Assets/PokerOpoly/Scripts/Economy/PropertyOwnershipService.cs`
- `Assets/PokerOpoly/Scripts/Economy/PropertyAuctionService.cs`
- `Assets/PokerOpoly/Scripts/Economy/PropertyUpgradeService.cs`
- `Assets/PokerOpoly/Scripts/Economy/PropertyFeeCalculator.cs`

Editor Builder:

- `Assets/PokerOpoly/Scripts/Editor/PokerOpolyPhaseOneBuilder.cs`
  - Creates deck assets.
  - Creates board space assets.
  - Creates scenes.
  - Wires main game scene.
  - Loads tile model.
  - Rebuild menu lives here.

## Editor Menu Commands

- `Big Slick Games > Poker-Opoly > Setup > Foundation`
  - Builds base config/assets/scenes.

- `Big Slick Games > Poker-Opoly > Board > Build Board Prototype`
  - Main command to rebuild board/game scene.

- `Big Slick Games > Poker-Opoly > Cards > Build Prototype Deck`
  - Builds 56-card deck assets.

- `Big Slick Games > Poker-Opoly > Cards > Build Card Gallery Scene`
  - Builds card gallery/test scene.

## External Tile Model

User model files may still exist in the project, but the builder no longer loads them:

- `Assets/PokerOpoly/Art/Cards/tile.glb`
- `Assets/PokerOpoly/Models/tile.*`

Builder behavior:

- `BoardGenerator.CreateGeneratedTileVisual()` creates the active tile mesh per board card.
- `PokerOpolyPhaseOneBuilder` clears `tileModelPrefab` and sets `useExternalTileModel` to false during rebuild.

Known issue:

- Applying the user GLB to all 56 spaces made runtime performance bad.
- The generated code mesh is intended as the safe replacement.

Recommended next tile-model workflow:

1. Disable all-tile model use.
2. Place one `tile.glb` manually in scene.
3. Check scale, origin, material count, mesh count.
4. Make a clean Unity prefab.
5. Use that prefab for one board space.
6. Only then enable all 56 spaces.

## Visual Assets Generated

Generated texture assets:

- `Assets/PokerOpoly/Art/Textures/tex_mobile_board_background_v1.png`
- `Assets/PokerOpoly/Art/Textures/tex_mobile_ui_atlas_v1.png`
- `Assets/PokerOpoly/Art/Textures/tex_card_tile_atlas_v1.png`
- `Assets/PokerOpoly/Art/Textures/tex_felt_green_suits.png`
- `Assets/PokerOpoly/Art/Textures/tex_card_back_premium.png`
- `Assets/PokerOpoly/Art/Textures/tex_card_wild_face.png`
- `Assets/PokerOpoly/Art/Textures/tex_card_mystery_face.png`
- `Assets/PokerOpoly/Art/Textures/tex_chip_trim_atlas.png`

Shaders:

- `Assets/PokerOpoly/Shaders/PokerOpolyGlossyTexture.shader`
- `Assets/PokerOpoly/Shaders/PokerOpolyAdditiveGlow.shader`

Known issue:

- These visual passes were added quickly and are not yet cleanly integrated into a proper UI system.

## Current UI State

The UI is still mostly IMGUI prototype UI.

Current working elements:

- Big `GO` roll button.
- Top resource/status bar.
- Save/load buttons.
- Sell button.
- Bottom auction panel.
- Bottom upgrade panel.
- Buy/Skip overlay centered over fly-up card area.

Important note:

- 3D Buy/Skip buttons on the fly-up card were unreliable due to card orientation/collider issues.
- The functional Buy/Skip path is the IMGUI overlay in `PokerOpolyPrototypeRunner.DrawPurchaseDecisionOverlay()`.

## Known Problems

High priority:

- External `tile.glb` causes poor performance when used on all 56 spaces.
- Model import/scale/origin workflow needs to be cleaned up.
- Project was unstable under D3D12; use DX11 if Unity crashes.
- UI is prototype IMGUI, not production UI Toolkit/uGUI.
- Scene may contain experimental probe objects after rebuild.

Medium priority:

- Generated visual assets are not final.
- Shaders are basic and need validation inside URP.
- Tile inspection/fly-up card still needs a clean final interaction design.
- Board environment dressing was added quickly and may need pruning.
- Some old generated model files may still exist in both `Art/Cards` and `Models`.

Low priority:

- Documentation files from earlier phases may be stale.
- Materials and generated textures may include unused assets.

## Crash / Recovery Notes

Unity crashed once with D3D12 device removal:

- Log mentioned `D3D12Fence::Wait` and swapchain/device removal errors.
- Reopening with `-force-d3d11` worked.

If Unity refuses to open:

1. Check if Unity is still running.
2. If Unity is not running, remove stale `Temp/UnityLockfile`.
3. Launch Unity with:
   - `C:\Program Files\Unity\Hub\Editor\6000.1.4f1\Editor\Unity.exe -force-d3d11 -projectPath "D:\BIG-SLICK-GAMES\GAMES\Poker Orbit"`

If the scene looks broken:

1. Open `Assets/PokerOpoly/Scenes/PokerOpoly_Game.unity`.
2. Run `Big Slick Games > Poker-Opoly > Board > Build Board Prototype`.
3. If tile model performance is bad, disable `useExternalTileModel`.

## Suggested Next Session Plan

Do not add more systems first. Stabilize:

1. Disable external tile model usage or use one test tile only.
2. Clean `BoardGenerator` so it has one clear tile path.
3. Decide final board visual approach:
   - Font-only board until gameplay is stable, or
   - One optimized model prefab tested on a single space.
4. Replace IMGUI with proper Unity UI only after board performance is stable.
5. Then polish movement/camera/animations.

## Last Known Good Functional State

Before model performance problems, the reliable baseline was:

- Board spaces as text anchors.
- No external model on every tile.
- Buy/Skip using IMGUI overlay.
- Board rebuild from editor menu.
- C# compile passing.
