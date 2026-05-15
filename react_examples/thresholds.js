export function calculateThresholds({ statValue, difficulty, statMods = 0, statusMods = 0 }) {
  const effectiveStat = statValue + statMods + statusMods;
  const advantage = effectiveStat - difficulty;
  let red = 35 - advantage * 10;
  let green = 65 - advantage * 10;
  red = Math.max(5, Math.min(85, red));
  green = Math.max(red + 10, Math.min(95, green));
  return { red, green };
}
