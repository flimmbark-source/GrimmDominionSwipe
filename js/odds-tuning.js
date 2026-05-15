// Tuning: each stat/modifier point now shifts fail/great thresholds by 5 instead of 10.
(() => {
  window.STAT_ODDS_STEP = 5;

  window.calculateThresholds = function calculateThresholds(statValue, difficulty) {
    const advantage = statValue - difficulty;
    const step = window.STAT_ODDS_STEP || 5;
    const red = clamp(35 - advantage * step, 5, 85);
    const green = clamp(Math.max(red + 10, 65 - advantage * step), red + 10, 95);
    return { red, green };
  };

  if (typeof calculateThresholds === "function") {
    calculateThresholds = window.calculateThresholds;
  }

  if (typeof render === "function") render();
})();
