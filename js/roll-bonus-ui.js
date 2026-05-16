// Shows action choices as passive info panels; selection happens through card swipe.
(() => {
  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  const TAG_SYMBOLS = {
    stealth: "◒",
    hide: "◒",
    combat: "⚔",
    scout: "⚔",
    intimidate: "⚔",
    cunning: "◈",
    theft: "●",
    lock: "🗝",
    search: "◉",
    market: "◆",
    food: "●",
    supplies: "▣",
    survival: "♣",
    route: "↝",
    escape: "↝",
    mark: "⌁",
    climb: "↟",
    roof: "↟",
    dark: "☼",
    tunnel: "☼",
    well: "☼",
    spirit: "✦",
    magic: "✦",
    lore: "✦",
    chapel: "✦",
    patrol: "◉",
    trap: "▣",
    tool: "▣",
    house: "⌂",
    cottage: "⌂",
    entry: "⌂",
    cellar: "▤",
    smoke: "◒",
    crowd: "◒",
    lure: "♬",
    giant: "♜",
  };

  const tagSymbols = (tags = []) => {
    const symbols = [];
    tags.forEach(tag => {
      const symbol = TAG_SYMBOLS[tag];
      if (symbol && !symbols.includes(symbol)) symbols.push(symbol);
    });
    return symbols.slice(0, 4).map(symbol => `<span class="gd-choice-tag-symbol">${symbol}</span>`).join("");
  };

  window.renderChoice = function renderChoice(side, choiceData) {
    const baseStat = game.hero.stats[choiceData.stat] || 0;
    const thresholds = calculateThresholds(baseStat, choiceData.difficulty);
    const locked = game.heroTimer <= 0 || game.awaitingResultAck;
    const chosen = game.lastAction?.side === side;
    const symbols = tagSymbols(choiceData.tags);
    return `<div class="gd-choice-wrap ${side}"><div class="gd-choice-stat-label"><span>${titleCase(choiceData.stat)}</span>${symbols ? `<span class="gd-choice-tag-symbols">${symbols}</span>` : ""}</div><div class="gd-choice gd-choice-panel ${side} ${locked ? "locked" : ""} ${chosen ? "chosen wink-out" : ""}" data-choice-panel="${side}" aria-label="${choiceData.label}"><div class="gd-choice-title">${choiceData.label}</div><div class="gd-choice-mid"><span>⌛ ${choiceData.timeCost}s</span></div><div class="gd-thresholds"><span class="gd-fail">☠ ${thresholds.red}</span><span class="gd-great">♛ ${thresholds.green}</span></div></div></div>`;
  };
  renderChoice = window.renderChoice;

  window.render = function(...args) {
    return originalRender.apply(this, args);
  };
  render();
})();
