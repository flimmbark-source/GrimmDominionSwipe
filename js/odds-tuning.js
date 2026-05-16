// Tuning: higher base failure threshold makes actions riskier.
(() => {
  window.STAT_ODDS_STEP = 10;

  window.calculateThresholds = function calculateThresholds(statValue, difficulty) {
    const advantage = statValue - difficulty;
    const step = window.STAT_ODDS_STEP || 10;
    const red = clamp(50 - advantage * step, 5, 85);
    const green = clamp(Math.max(red + 10, 65 - advantage * step), red + 10, 95);
    return { red, green };
  };

  if (typeof calculateThresholds === "function") {
    calculateThresholds = window.calculateThresholds;
  }

  if (typeof render === "function") render();
})();
