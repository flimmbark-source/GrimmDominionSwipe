// Food system: each Food gives +5 to action rolls. At round end, lose 1 Food if any.
(() => {
  const FOOD_ROLL_BONUS = 5;

  const baseGetRollBonus = typeof getRollBonus === "function" ? getRollBonus : () => 0;

  window.getFoodRollBonus = function getFoodRollBonus() {
    return Math.max(0, game?.hero?.food || 0) * FOOD_ROLL_BONUS;
  };

  window.getRollBonus = function getRollBonus(choiceData) {
    return baseGetRollBonus(choiceData) + getFoodRollBonus();
  };
  getRollBonus = window.getRollBonus;

  const baseResolveDarkLordPlan = typeof resolveDarkLordPlan === "function" ? resolveDarkLordPlan : null;
  if (baseResolveDarkLordPlan) {
    window.resolveDarkLordPlan = function resolveDarkLordPlan() {
      baseResolveDarkLordPlan();
      if (game.hero.food > 0) {
        game.hero.food = Math.max(0, game.hero.food - 1);
        game.log.unshift("The Goblin eats 1 Food before the next round.");
        syncPartyHeroSummary?.();
      }
    };
    resolveDarkLordPlan = window.resolveDarkLordPlan;
  }

  const amount = (modifier) => {
    if (typeof modifier.rollBonus === "number") return modifier.rollBonus;
    if (typeof modifier.statBonus === "number") return modifier.statBonus * 5;
    return 0;
  };

  const signed = (value) => value > 0 ? `+${value}` : `${value}`;

  window.renderChoice = function renderChoice(side, choiceData) {
    const baseStat = game.hero.stats[choiceData.stat] || 0;
    const thresholds = calculateThresholds(baseStat, choiceData.difficulty);
    const itemKnowledgeBonus = getChoiceModifiers(choiceData)
      .map(amount)
      .reduce((sum, value) => sum + value, 0);
    const totalBonus = itemKnowledgeBonus + getFoodRollBonus();
    const locked = game.heroTimer <= 0 || game.awaitingResultAck;
    const chosen = game.lastAction?.side === side;
    const bonusClass = totalBonus > 0 ? "positive" : totalBonus < 0 ? "negative" : "neutral";
    const bonusChip = `<span class="gd-total-roll-bonus ${bonusClass}">${signed(totalBonus)}</span>`;
    const tags = [...new Set(choiceData.tags || [])].slice(0, 5);
    const tagIcons = tags.length && window.GD_TAG_ICONS
      ? `<div class="gd-choice-tag-icons">${tags.map(tag => `<span title="${tag}">${window.GD_TAG_ICONS[tag] || "◇"}</span>`).join("")}</div>`
      : "";
    return `<button class="gd-choice ${side} ${locked ? "locked" : ""} ${chosen ? "chosen wink-out" : ""}" data-choice="${side}" ${locked ? "disabled" : ""}>${tagIcons}<div class="gd-choice-title">${choiceData.label}</div><div class="gd-choice-mid"><span>⌛ ${choiceData.timeCost}s</span>${bonusChip}</div><div class="gd-thresholds"><span class="gd-fail">☠ ${thresholds.red}</span><span class="gd-great">♛ ${thresholds.green}</span></div></button>`;
  };
  renderChoice = window.renderChoice;

  if (typeof render === "function") render();
})();
