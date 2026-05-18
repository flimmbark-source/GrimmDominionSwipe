// Shows action results as a centered overlay, lets reward ghosts play, then auto-advances.
(() => {
  const READY_FLAG = "RESULT_OVERLAY_AUTO_ADVANCE";
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  const OVERLAY_MS = 1750;
  const MIN_GHOST_MS = 1200;
  let autoAckTimer = null;

  function labelFor(type) {
    return typeof formatOutcome === "function" ? formatOutcome(type) : (type === "great" ? "Great Success" : type);
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderOverlay() {
    const action = game?.lastAction;
    if (!action || game.activeTab !== "explore") return "";
    const icon = RESULT_ICONS?.[action.outcomeType] || "◇";
    const label = labelFor(action.outcomeType);
    return `<div class="gd-result-overlay ${action.outcomeType}" aria-live="polite"><div class="gd-result-overlay-card"><div class="gd-result-overlay-heading"><span class="gd-result-overlay-icon">${icon}</span><span>${escapeHtml(label)}</span></div><div class="gd-result-overlay-roll">d100 ${action.roll} · ${escapeHtml(action.choiceLabel)}</div><div class="gd-result-overlay-text">${escapeHtml(action.text)}</div></div></div>`;
  }

  if (typeof renderActionResult === "function") {
    window.renderActionResult = function renderActionResultOverlayOnly() {
      return "";
    };
    try { renderActionResult = window.renderActionResult; } catch (_) {}
  }

  function mountOverlay() {
    const screen = document.querySelector(".gd-screen");
    if (!screen || !game?.lastAction || game.activeTab !== "explore") return;
    if (screen.querySelector(".gd-result-overlay")) return;
    screen.insertAdjacentHTML("beforeend", renderOverlay());
  }

  function clearAutoAck() {
    if (autoAckTimer) clearTimeout(autoAckTimer);
    autoAckTimer = null;
  }

  function actionBatchKey(action) {
    if (!action) return "";
    return [action.choiceLabel, action.outcomeType, action.roll, ...(action.ghosts || []).map(g => `${g.kind}:${g.text}`)].join("|");
  }

  function scheduleAutoAck() {
    clearAutoAck();
    if (!game?.awaitingResultAck || !game?.lastAction) return;
    const ghostCount = game.lastAction.ghosts?.length || 0;
    const ghostDelay = Math.max(0, ghostCount - 1) * 130;
    const delay = Math.max(OVERLAY_MS, MIN_GHOST_MS + ghostDelay);

    autoAckTimer = setTimeout(() => {
      if (!game.awaitingResultAck || !game.lastAction) return;
      window.launchRewardGhostHandoffsFromData?.(game.lastAction.ghosts || [], actionBatchKey(game.lastAction));
      game.resultReady = true;
      setTimeout(() => {
        if (!game.awaitingResultAck || !game.lastAction) return;
        try { acknowledgeResult(); } catch (_) {}
      }, 90);
    }, delay);
  }

  const baseChoose = window.choose || (typeof choose !== "undefined" ? choose : null);
  if (baseChoose && !baseChoose.__resultOverlayWrapped) {
    const wrappedChoose = function chooseWithResultOverlay(side) {
      clearAutoAck();
      const out = baseChoose.apply(this, arguments);
      if (game?.awaitingResultAck && game?.lastAction) {
        mountOverlay();
        scheduleAutoAck();
      }
      return out;
    };
    wrappedChoose.__resultOverlayWrapped = true;
    window.choose = wrappedChoose;
    try { choose = wrappedChoose; } catch (_) {}
  }

  const baseRender = window.render || (typeof render !== "undefined" ? render : null);
  if (baseRender && !baseRender.__resultOverlayWrapped) {
    const wrappedRender = function renderWithResultOverlay(...args) {
      const out = baseRender.apply(this, args);
      if (game?.awaitingResultAck && game?.lastAction) mountOverlay();
      return out;
    };
    wrappedRender.__resultOverlayWrapped = true;
    window.render = wrappedRender;
    try { render = wrappedRender; } catch (_) {}
  }

  const baseReset = window.resetGame || (typeof resetGame !== "undefined" ? resetGame : null);
  if (baseReset && !baseReset.__resultOverlayWrapped) {
    const wrappedReset = function resetWithResultOverlay(...args) {
      clearAutoAck();
      return baseReset.apply(this, args);
    };
    wrappedReset.__resultOverlayWrapped = true;
    window.resetGame = wrappedReset;
    try { resetGame = wrappedReset; } catch (_) {}
  }
})();