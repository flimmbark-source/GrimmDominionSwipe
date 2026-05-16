// Shows the full combined direct roll bonus on each action choice.
(() => {
  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  const signed = (value) => value > 0 ? `+${value}` : `${value}`;
  const fullRollBonus = (choiceData) => typeof getRollBonus === "function"
    ? getRollBonus(choiceData)
    : getChoiceModifiers(choiceData).reduce((sum, modifier) => sum + (modifier.rollBonus || 0), 0);

  window.renderChoice = function renderChoice(side, choiceData) {
    const baseStat = game.hero.stats[choiceData.stat] || 0;
    const thresholds = calculateThresholds(baseStat, choiceData.difficulty);
    const totalBonus = fullRollBonus(choiceData);
    const locked = game.heroTimer <= 0 || game.awaitingResultAck;
    const chosen = game.lastAction?.side === side;
    const bonusClass = totalBonus > 0 ? "positive" : totalBonus < 0 ? "negative" : "neutral";
    const bonusChip = `<span class="gd-total-roll-bonus ${bonusClass}">${signed(totalBonus)}</span>`;
    return `<button class="gd-choice ${side} ${locked ? "locked" : ""} ${chosen ? "chosen wink-out" : ""}" data-choice="${side}" ${locked ? "disabled" : ""}><div class="gd-choice-title">${choiceData.label}</div><div class="gd-choice-mid"><span>⌛ ${choiceData.timeCost}s</span>${bonusChip}</div><div class="gd-thresholds"><span class="gd-fail">☠ ${thresholds.red}</span><span class="gd-great">♛ ${thresholds.green}</span></div></button>`;
  };
  renderChoice = window.renderChoice;

  window.render = function(...args) {
    return originalRender.apply(this, args);
  };
  render();
})();
