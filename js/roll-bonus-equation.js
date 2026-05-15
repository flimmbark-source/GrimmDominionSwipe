// Equation update: stats define thresholds, modifiers add directly to the d100 roll.
(() => {
  const ROLL_BONUS_PER_OLD_POINT = 5;

  const rawModifierAmount = (modifier) => {
    if (typeof modifier.rollBonus === "number") return modifier.rollBonus;
    if (typeof modifier.statBonus === "number") return modifier.statBonus * ROLL_BONUS_PER_OLD_POINT;
    return 0;
  };

  window.getRollBonus = function getRollBonus(choiceData) {
    return getChoiceModifiers(choiceData).reduce((sum, modifier) => sum + rawModifierAmount(modifier), 0);
  };

  window.getEffectiveStat = function getEffectiveStat(choiceData) {
    return game.hero.stats[choiceData.stat] || 0;
  };
  getEffectiveStat = window.getEffectiveStat;

  window.rollOutcome = function rollOutcome(choice) {
    const thresholds = calculateThresholds(getEffectiveStat(choice), choice.difficulty);
    const rawRoll = Math.floor(Math.random() * 100) + 1;
    const rollBonus = getRollBonus(choice);
    const roll = clamp(rawRoll + rollBonus, 1, 100);
    if (roll <= thresholds.red) return { type: "failure", roll, rawRoll, rollBonus, red: thresholds.red, green: thresholds.green };
    if (roll > thresholds.green) return { type: "great", roll, rawRoll, rollBonus, red: thresholds.red, green: thresholds.green };
    return { type: "success", roll, rawRoll, rollBonus, red: thresholds.red, green: thresholds.green };
  };
  rollOutcome = window.rollOutcome;

  const originalChoose = window.choose;
  if (typeof originalChoose === "function") {
    window.choose = function choose(side) {
      originalChoose(side);
      if (game.lastAction?.rollBonus > 0) {
        game.result = game.result.replace(
          /d100 \d+/,
          `d100 ${game.lastAction.rawRoll}+${game.lastAction.rollBonus}=${game.lastAction.roll}`
        );
        render();
      }
    };
    choose = window.choose;
  }

  if (typeof render === "function") render();
})();
