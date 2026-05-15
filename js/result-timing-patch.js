// Prototype timing shim: reward ghosts now fly to bottom destination tabs.
// The original result-ready timing was built for short rise/fade ghosts and was
// causing the ghost layer to be hidden before the tab flight completed.
(() => {
  const originalSetTimeout = window.setTimeout.bind(window);

  window.setTimeout = (callback, delay = 0, ...args) => {
    const patchedDelay =
      typeof delay === "number" && delay >= 3380 && delay <= 4300
        ? delay + 700
        : delay;

    return originalSetTimeout(callback, patchedDelay, ...args);
  };
})();
