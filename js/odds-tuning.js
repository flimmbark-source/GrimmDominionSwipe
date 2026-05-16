// Tuning: all choice difficulties are treated as +1 harder in the odds equation.
(() => {
  window.STAT_ODDS_STEP = 10;
  window.CHOICE_DIFFICULTY_OFFSET = 1;

  window.effectiveChoiceDifficulty = function effectiveChoiceDifficulty(difficulty = 0) {
    return difficulty + (window.CHOICE_DIFFICULTY_OFFSET || 0);
  };

  window.calculateThresholds = function calculateThresholds(statValue, difficulty) {
    const adjustedDifficulty = effectiveChoiceDifficulty(difficulty);
    const advantage = statValue - adjustedDifficulty;
    const step = window.STAT_ODDS_STEP || 10;
    const red = clamp(50 - advantage * step, 5, 85);
    const green = clamp(Math.max(red + 10, 65 - advantage * step), red + 10, 95);
    return { red, green, difficulty: adjustedDifficulty };
  };

  if (typeof calculateThresholds === "function") {
    calculateThresholds = window.calculateThresholds;
  }

  if (typeof render === "function") render();
})();
