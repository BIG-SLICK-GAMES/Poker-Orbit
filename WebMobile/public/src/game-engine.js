export function createGameEngine({ onBusyChange } = {}) {
  const queue = [];
  const listeners = new Set();
  let activeAction = null;
  let running = false;
  let cancelled = false;

  function enqueue(action) {
    const normalizedAction = typeof action === "function"
      ? { name: action.name || "action", run: action }
      : action;

    if (!normalizedAction || typeof normalizedAction.run !== "function") {
      throw new TypeError("Queued game action must provide a run function.");
    }

    queue.push(normalizedAction);
    notify();
    void drain();
    return normalizedAction;
  }

  function clear() {
    queue.length = 0;
    notify();
  }

  function cancel() {
    cancelled = true;
    clear();
  }

  function isRunning() {
    return running;
  }

  function getState() {
    return {
      running,
      activeAction: activeAction?.name || "",
      queuedActions: queue.map((action) => action.name || "action")
    };
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
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
        await activeAction.run({
          wait,
          isCancelled: () => cancelled,
          enqueue,
          clear
        });
      } catch (error) {
        console.error(`Game queue action failed: ${activeAction.name || "action"}`, error);
      }

      if (cancelled) {
        queue.length = 0;
      }
    }

    activeAction = null;
    running = false;
    onBusyChange?.(false);
    notify();
  }

  function notify() {
    const state = getState();
    listeners.forEach((listener) => listener(state));
  }

  return {
    cancel,
    clear,
    enqueue,
    getState,
    isRunning,
    subscribe,
    wait
  };
}

export function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, Math.max(0, ms)));
}
