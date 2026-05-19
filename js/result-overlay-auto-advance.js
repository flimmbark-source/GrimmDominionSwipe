// Shows action results as a persistent overlay, advances the card underneath, then dismisses later.
(() => {
  const READY_FLAG = "RESULT_OVERLAY_AUTO_ADVANCE";
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  const CARD_ADVANCE_MS = 140;
  const OVERLAY_TOTAL_MS = 3400;
  let autoAckTimer = null;
  let overlayRemoveTimer = null;

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

  function renderOverlay(action = game?.lastAction) {
    if (!action) return "";
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

  function clearOverlay() {
    if (overlayRemoveTimer) clearTimeout(overlayRemoveTimer);
    overlayRemoveTimer = null;
    document.querySelectorAll("body > .gd-result-overlay").forEach(node => node.remove());
  }

  function mountOverlay() {
    if (!game?.lastAction || game.activeTab !== "explore") return;
    clearOverlay();
    document.body.insertAdjacentHTML("beforeend", renderOverlay(game.lastAction));
    overlayRemoveTimer = setTimeout(clearOverlay, OVERLAY_TOTAL_MS + 120);
  }

  function clearAutoAck() {
    if (autoAckTimer) clearTimeout(autoAckTimer);
    autoAckTimer = null;
  }

  function scheduleAutoAck() {
    clearAutoAck();
    if (!game?.awaitingResultAck || !game?.lastAction) return;

    autoAckTimer = setTimeout(() => {
      if (!game.awaitingResultAck || !game.lastAction) return;
      game.resultReady = true;
      try { acknowledgeResult(); } catch (_) {}
    }, CARD_ADVANCE_MS);
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

  const baseReset = window.resetGame || (typeof resetGame !== "undefined" ? resetGame : null);
  if (baseReset && !baseReset.__resultOverlayWrapped) {
    const wrappedReset = function resetWithResultOverlay(...args) {
      clearAutoAck();
      clearOverlay();
      return baseReset.apply(this, args);
    };
    wrappedReset.__resultOverlayWrapped = true;
    window.resetGame = wrappedReset;
    try { resetGame = wrappedReset; } catch (_) {}
  }
})();