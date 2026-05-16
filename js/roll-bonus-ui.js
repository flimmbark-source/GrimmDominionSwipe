// Shows action choices as passive info panels; selection happens through card swipe.
(() => {
  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  const difficultyTier = (difficulty = 3) => {
    if (difficulty >= 5) return "hard";
    if (difficulty >= 3) return "medium";
    return "easy";
  };

  window.renderChoice = function renderChoice(side, choiceData) {
    const baseStat = game.hero.stats[choiceData.stat] || 0;
    const thresholds = calculateThresholds(baseStat, choiceData.difficulty);
    const locked = game.heroTimer <= 0 || game.awaitingResultAck;
    const chosen = game.lastAction?.side === side;
    const tier = difficultyTier(choiceData.difficulty);
    return `<div class="gd-choice-wrap ${side}"><div class="gd-choice-stat-label">${titleCase(choiceData.stat)}</div><div class="gd-choice gd-choice-panel gd-difficulty-${tier} ${side} ${locked ? "locked" : ""} ${chosen ? "chosen wink-out" : ""}" data-choice-panel="${side}" aria-label="${choiceData.label}"><div class="gd-choice-title">${choiceData.label}</div><div class="gd-choice-mid"><span>⌛ ${choiceData.timeCost}s</span></div><div class="gd-thresholds"><span class="gd-fail">☠ ${thresholds.red}</span><span class="gd-great">♛ ${thresholds.green}</span></div></div></div>`;
  };
  renderChoice = window.renderChoice;

  window.render = function(...args) {
    return originalRender.apply(this, args);
  };
  render();
})();
