// Shows a single combined direct roll bonus on each action choice.
(() => {
  const TAG_ICONS = {
    stealth: "🕶",
    combat: "⚔",
    cunning: "👁",
    spirit: "✦",
    survival: "🐾",
    lock: "🗝",
    theft: "●",
    quiet: "◌",
    house: "⌂",
    cottage: "⌂",
    entry: "↘",
    food: "◆",
    search: "⌕",
    village: "⌂",
    route: "↝",
    escape: "↗",
    mark: "◇",
    scout: "👁",
    patrol: "◉",
    hide: "◒",
    smoke: "☁",
    crowd: "♟",
    climb: "↟",
    roof: "▤",
    well: "◎",
    dark: "☾",
    tunnel: "◍",
    cellar: "▥",
    tool: "▣",
    trap: "⌁",
    lure: "♬",
    intimidate: "⚔",
    lore: "✦",
    magic: "✦",
    chapel: "✚",
    market: "◧",
    supplies: "▣",
  };
  window.GD_TAG_ICONS = TAG_ICONS;

  const amount = (modifier) => {
    if (typeof modifier.rollBonus === "number") return modifier.rollBonus;
    if (typeof modifier.statBonus === "number") return modifier.statBonus * 5;
    return 0;
  };

  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  const signed = (value) => value > 0 ? `+${value}` : `${value}`;
  const tagIcons = (choiceData) => {
    const tags = [...new Set(choiceData.tags || [])].slice(0, 5);
    if (!tags.length) return "";
    return `<div class="gd-choice-tag-icons" aria-hidden="true">${tags.map(tag => `<span title="${tag}">${TAG_ICONS[tag] || "◇"}</span>`).join("")}</div>`;
  };

  window.renderChoice = function renderChoice(side, choiceData) {
    const baseStat = game.hero.stats[choiceData.stat] || 0;
    const thresholds = calculateThresholds(baseStat, choiceData.difficulty);
    const totalBonus = getChoiceModifiers(choiceData)
      .map(amount)
      .reduce((sum, value) => sum + value, 0);
    const locked = game.heroTimer <= 0 || game.awaitingResultAck;
    const chosen = game.lastAction?.side === side;
    const bonusClass = totalBonus > 0 ? "positive" : totalBonus < 0 ? "negative" : "neutral";
    const bonusChip = `<span class="gd-total-roll-bonus ${bonusClass}">${signed(totalBonus)}</span>`;
    const button = `<button class="gd-choice ${side} ${locked ? "locked" : ""} ${chosen ? "chosen wink-out" : ""}" data-choice="${side}" ${locked ? "disabled" : ""}><div class="gd-choice-title">${choiceData.label}</div><div class="gd-choice-mid"><span>⌛ ${choiceData.timeCost}s</span>${bonusChip}</div><div class="gd-thresholds"><span class="gd-fail">☠ ${thresholds.red}</span><span class="gd-great">♛ ${thresholds.green}</span></div></button>`;
    return `<div class="gd-choice-stack ${side}">${tagIcons(choiceData)}${button}</div>`;
  };
  renderChoice = window.renderChoice;

  window.render = function(...args) {
    return originalRender.apply(this, args);
  };
  render();
})();
