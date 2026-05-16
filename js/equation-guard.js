// Final guard: action thresholds must use base hero stats only.
// Items/statuses/knowledge/food add direct d100 roll bonuses and never shift fail/great thresholds.
(() => {
  window.getBaseStatForChoice = function getBaseStatForChoice(choiceData) {
    return game.hero.stats[choiceData.stat] || 0;
  };

  window.getEffectiveStat = function getEffectiveStat(choiceData) {
    return getBaseStatForChoice(choiceData);
  };
  getEffectiveStat = window.getEffectiveStat;

  window.rollOutcome = function rollOutcome(choice) {
    const thresholds = calculateThresholds(getBaseStatForChoice(choice), choice.difficulty);
    const rawRoll = Math.floor(Math.random() * 100) + 1;
    const rollBonus = typeof getRollBonus === "function" ? getRollBonus(choice) : 0;
    const roll = clamp(rawRoll + rollBonus, 1, 100);
    const outcome = roll <= thresholds.red
      ? { type: "failure", roll, rawRoll, rollBonus, red: thresholds.red, green: thresholds.green }
      : roll > thresholds.green
        ? { type: "great", roll, rawRoll, rollBonus, red: thresholds.red, green: thresholds.green }
        : { type: "success", roll, rawRoll, rollBonus, red: thresholds.red, green: thresholds.green };
    window.GD_LAST_ROLL = outcome;
    return outcome;
  };
  rollOutcome = window.rollOutcome;

  const baseChoose = typeof choose === "function" ? choose : null;
  if (baseChoose && !window.__equationGuardChoosePatchApplied) {
    window.__equationGuardChoosePatchApplied = true;
    window.choose = function choose(side) {
      window.GD_LAST_ROLL = null;
      baseChoose(side);
      const roll = window.GD_LAST_ROLL;
      if (!game.lastAction || !roll) return;
      game.lastAction.rawRoll = roll.rawRoll;
      game.lastAction.rollBonus = roll.rollBonus;
      game.lastAction.roll = roll.roll;
      if (roll.rollBonus > 0) {
        game.result = game.result.replace(/d100 \d+(?:\+\d+=\d+)?/, `d100 ${roll.rawRoll}+${roll.rollBonus}=${roll.roll}`);
        render?.();
      }
    };
    choose = window.choose;
  }

  if (typeof render === "function") render();
})();
