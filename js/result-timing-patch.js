// Prototype timing shim: the main game marks the result ready after the full
// ghost sequence completes. For better pacing, make that readiness happen
// one second earlier while leaving the ghost animation itself unchanged.
(() => {
  const originalSetTimeout = window.setTimeout.bind(window);

  window.setTimeout = (callback, delay = 0, ...args) => {
    const patchedDelay =
      typeof delay === "number" && delay >= 3380 && delay <= 4300
        ? Math.max(0, delay - 1000)
        : delay;

    return originalSetTimeout(callback, patchedDelay, ...args);
  };
})();
