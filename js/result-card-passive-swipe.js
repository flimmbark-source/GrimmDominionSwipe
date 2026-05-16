// Makes the result card a passive swipeable panel instead of a button.
// Tapping still dismisses through data-ack-result; swiping is handled by card-swipe-input.js.
(() => {
  if (typeof renderActionResult !== "function") return;

  window.renderActionResult = function renderActionResult() {
    const action = game.lastAction;
    const label = formatOutcome(action.outcomeType);
    const readyClass = game.resultReady ? "ready" : "waiting";
    const prompt = game.resultReady ? "Tap or swipe to continue" : "Resolving...";
    const ackAttr = game.resultReady ? "data-ack-result" : "";
    return `<div class="gd-action-result ${action.outcomeType} ${readyClass}" ${ackAttr} role="button" aria-disabled="${game.resultReady ? "false" : "true"}" tabindex="${game.resultReady ? "0" : "-1"}"><div class="gd-roll-chip">d100<b>${action.roll}</b></div><div class="gd-result-icon">${RESULT_ICONS[action.outcomeType]}</div><div class="gd-result-copy"><div class="gd-result-heading">${label} · ${action.choiceLabel}</div><p>${action.text}</p><div class="gd-cooldown-pill">${prompt}</div></div></div>`;
  };
  renderActionResult = window.renderActionResult;

  if (typeof render === "function") render();
})();
