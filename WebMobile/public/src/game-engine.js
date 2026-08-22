export function createGameEngine({ onBusyChange, onActionError, now = () => Date.now() } = {}) {
  const queue = [];
  const listeners = new Set();
  const idleWaiters = [];
  let activeAction = null;
  let running = false;
  let cancelled = false;
  let nextActionId = 1;

  function enqueue(action) {
    const normalizedAction = normalizeAction(action);

    if (normalizedAction.priority === "front") {
      queue.unshift(normalizedAction);
    } else {
      queue.push(normalizedAction);
    }
    notify();
    void drain();
    return normalizedAction;
  }

  function enqueueMany(actions) {
    return actions.map(enqueue);
  }

  function clear(filter) {
    if (typeof filter !== "function") {
      queue.length = 0;
      notify();
      resolveIdleWaitersIfIdle();
      return;
    }

    for (let index = queue.length - 1; index >= 0; index -= 1) {
      if (filter(queue[index])) {
        queue.splice(index, 1);
      }
    }

    notify();
    resolveIdleWaitersIfIdle();
  }

  function cancel() {
    cancelled = true;
    clear();
  }

  function cancelActive() {
    cancelled = true;
  }

  function isRunning() {
    return running;
  }

  function isBusy() {
    return running || queue.length > 0;
  }

  function getState() {
    return {
      running,
      busy: isBusy(),
      activeAction: activeAction ? describeAction(activeAction) : null,
      queuedActions: queue.map(describeAction),
      queueLength: queue.length
    };
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
  }

  function whenIdle() {
    if (!isBusy()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => idleWaiters.push(resolve));
  }

  async function drain() {
    if (running) {
      return;
    }

    running = true;
    onBusyChange?.(true);
    notify();

    while (queue.length) {
      activeAction = queue.shift();
      cancelled = false;
      notify();

      try {
        if (activeAction.delayMs > 0) {
          await wait(activeAction.delayMs);
        }

        if (cancelled) {
          continue;
        }

        await activeAction.run({
          wait,
          isCancelled: () => cancelled,
          enqueue,
          enqueueMany,
          clear
        });
      } catch (error) {
        try {
          onActionError?.(error, activeAction);
        } catch (errorHandlerError) {
          console.error("Game queue error handler failed", errorHandlerError);
        }
        console.error(`Game queue action failed: ${activeAction.name}`, error);
      }

      if (cancelled) {
        queue.length = 0;
      }
    }

    activeAction = null;
    running = false;
    onBusyChange?.(false);
    notify();
    resolveIdleWaitersIfIdle();
  }

  function notify() {
    const state = getState();
    listeners.forEach((listener) => listener(state));
  }

  function resolveIdleWaitersIfIdle() {
    if (isBusy()) {
      return;
    }

    while (idleWaiters.length) {
      idleWaiters.shift()();
    }
  }

  function normalizeAction(action) {
    const normalizedAction = typeof action === "function"
      ? { name: action.name || "action", run: action }
      : { ...action };

    if (!normalizedAction || typeof normalizedAction.run !== "function") {
      throw new TypeError("Queued game action must provide a run function.");
    }

    return {
      id: normalizedAction.id || `action-${nextActionId++}`,
      name: normalizedAction.name || "action",
      tag: normalizedAction.tag || "",
      priority: normalizedAction.priority === "front" ? "front" : "normal",
      delayMs: Math.max(0, Number(normalizedAction.delayMs) || 0),
      createdAt: now(),
      run: normalizedAction.run
    };
  }

  function describeAction(action) {
    return {
      id: action.id,
      name: action.name,
      tag: action.tag,
      delayMs: action.delayMs,
      createdAt: action.createdAt
    };
  }

  return {
    cancel,
    cancelActive,
    clear,
    enqueue,
    enqueueMany,
    getState,
    isBusy,
    isRunning,
    subscribe,
    wait,
    whenIdle
  };
}

export function wait(ms) {
  const scheduler = globalThis.window?.setTimeout
    ? globalThis.window.setTimeout.bind(globalThis.window)
    : globalThis.setTimeout;
  return new Promise((resolve) => scheduler(resolve, Math.max(0, ms)));
}
