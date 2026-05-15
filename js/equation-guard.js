// Final guard: action thresholds must use base hero stats only.
// Items/statuses/knowledge add direct d100 roll bonuses and never shift fail/great thresholds.
(() => {
  window.getBaseStatForChoice = function getBaseStatForChoice(choiceData) {
    return game.hero.stats[choiceData.stat] || 0;
  };

  window.getEffectiveStat = function getEffectiveStat(choiceData) {
    return getBaseStatForChoice(choiceData);
  };
  getEffectiveStat = window.getEffectiveStat;

  const originalRollOutcome = window.rollOutcome;
  window.rollOutcome = function rollOutcome(choice) {
    const thresholds = calculateThresholds(getBaseStatForChoice(choice), choice.difficulty);
    const rawRoll = Math.floor(Math.random() * 100) + 1;
    const rollBonus = typeof getRollBonus === "function" ? getRollBonus(choice) : 0;
    const roll = clamp(rawRoll + rollBonus, 1, 100);
    if (roll <= thresholds.red) return { type: "failure", roll, rawRoll, rollBonus, red: thresholds.red, green: thresholds.green };
    if (roll > thresholds.green) return { type: "great", roll, rawRoll, rollBonus, red: thresholds.red, green: thresholds.green };
    return { type: "success", roll, rawRoll, rollBonus, red: thresholds.red, green: thresholds.green };
  };
  rollOutcome = window.rollOutcome;

  if (typeof render === "function") render();
})();
