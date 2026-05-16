// Avoid full-screen rerenders for ordinary one-second timer ticks.
// Full render still happens on round reset and explicit game transitions.
(() => {
  const updateTimerDom = () => {
    document.querySelectorAll(".gd-timer").forEach(node => {
      const label = node.parentElement?.querySelector(".gd-timer-label")?.textContent || "";
      if (node.classList.contains("red") || label.includes("Dark Lord")) {
        node.textContent = `${game.darkLordTimer}s`;
      } else {
        node.textContent = `${game.heroTimer}s`;
      }
    });
  };

  const baseTick = typeof tick === "function" ? tick : null;
  if (!baseTick) return;

  window.updateTimerDom = updateTimerDom;

  window.tick = function tick() {
    const beforeDarkTimer = game.darkLordTimer;
    game.darkLordTimer = Math.max(0, game.darkLordTimer - 1);

    if (game.darkLordTimer === 0) {
      if (typeof resultReadyTimeoutId !== "undefined" && resultReadyTimeoutId) clearTimeout(resultReadyTimeoutId);
      resultReadyTimeoutId = null;
      resolveDarkLordPlan();
      game.darkLordTimer = 60;
      game.heroTimer = 40;
      game.awaitingResultAck = false;
      game.resultReady = false;
      game.pendingNextCardId = null;
      game.lastAction = null;
      render();
      return;
    }

    updateTimerDom();
  };
  tick = window.tick;

  if (typeof startTimers === "function") startTimers();
  updateTimerDom();
})();
