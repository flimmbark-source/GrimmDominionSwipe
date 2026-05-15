// Shows modifiers as direct roll bonuses instead of hidden stat inflation.
(() => {
  const amount = (modifier) => {
    if (typeof modifier.rollBonus === "number") return modifier.rollBonus;
    if (typeof modifier.statBonus === "number") return modifier.statBonus * 5;
    return 0;
  };

  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  window.renderChoice = function renderChoice(side, choiceData) {
    const baseStat = game.hero.stats[choiceData.stat] || 0;
    const thresholds = calculateThresholds(baseStat, choiceData.difficulty);
    const modifiers = getChoiceModifiers(choiceData).map(modifier => ({ ...modifier, rollBonus: amount(modifier) })).filter(modifier => modifier.rollBonus !== 0);
    const totalBonus = modifiers.reduce((sum, modifier) => sum + modifier.rollBonus, 0);
    const locked = game.heroTimer <= 0 || game.awaitingResultAck;
    const chosen = game.lastAction?.side === side;
    const modifierLine = modifiers.length
      ? `<div class="gd-choice-modifier-row">${modifiers.slice(0, 3).map(modifier => `<span>${modifier.icon || modifier.label?.[0] || "▣"} +${modifier.rollBonus}</span>`).join("")}${modifiers.length > 3 ? `<span>+${totalBonus}</span>` : ""}</div>`
      : "";
    return `<button class="gd-choice ${side} ${locked ? "locked" : ""} ${chosen ? "chosen wink-out" : ""}" data-choice="${side}" ${locked ? "disabled" : ""}><div class="gd-choice-title">${choiceData.label}</div><div class="gd-choice-mid"><div class="gd-choice-icon"><span>${STAT_ICONS[choiceData.stat]}</span></div><span>${titleCase(choiceData.stat)} ${baseStat}</span><span>⌛ ${choiceData.timeCost}s</span></div>${modifierLine}<div class="gd-thresholds"><span class="gd-fail">☠ ${thresholds.red}</span><span class="gd-great">♛ ${thresholds.green}</span></div></button>`;
  };
  renderChoice = window.renderChoice;

  window.render = function(...args) {
    const result = originalRender.apply(this, args);
    return result;
  };
  render();
})();
