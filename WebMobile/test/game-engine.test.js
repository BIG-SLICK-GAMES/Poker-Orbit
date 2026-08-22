import assert from "node:assert/strict";
import { test } from "node:test";
import { createGameEngine } from "../public/src/game-engine.js";

test("runs queued actions in order and reports idle", async () => {
  const events = [];
  const engine = createGameEngine();

  engine.enqueue({
    name: "first",
    run: async ({ wait }) => {
      events.push("first:start");
      await wait(1);
      events.push("first:end");
    }
  });
  engine.enqueue({
    name: "second",
    run: () => events.push("second")
  });

  await engine.whenIdle();

  assert.deepEqual(events, ["first:start", "first:end", "second"]);
  assert.equal(engine.isBusy(), false);
  assert.equal(engine.getState().queueLength, 0);
});

test("front priority action runs before pending normal actions", async () => {
  const events = [];
  const engine = createGameEngine();

  engine.enqueue({
    name: "first",
    run: async ({ wait }) => {
      events.push("first");
      await wait(1);
    }
  });
  engine.enqueue({ name: "third", run: () => events.push("third") });
  engine.enqueue({ name: "second", priority: "front", run: () => events.push("second") });

  await engine.whenIdle();

  assert.deepEqual(events, ["first", "second", "third"]);
});

test("clear can remove queued actions by tag", async () => {
  const events = [];
  const engine = createGameEngine();

  engine.enqueue({
    name: "first",
    run: async ({ wait }) => {
      events.push("first");
      await wait(1);
    }
  });
  engine.enqueue({ name: "remove me", tag: "bot", run: () => events.push("removed") });
  engine.enqueue({ name: "keep me", tag: "turn", run: () => events.push("kept") });

  engine.clear((action) => action.tag === "bot");
  await engine.whenIdle();

  assert.deepEqual(events, ["first", "kept"]);
});

test("cancel active stops the active action when it checks the token", async () => {
  const events = [];
  const engine = createGameEngine();

  engine.enqueue({
    name: "long",
    run: async ({ wait, isCancelled }) => {
      events.push("start");
      await wait(1);
      if (isCancelled()) {
        events.push("cancelled");
        return;
      }
      events.push("finish");
    }
  });

  engine.cancelActive();
  await engine.whenIdle();

  assert.deepEqual(events, ["start", "cancelled"]);
});
