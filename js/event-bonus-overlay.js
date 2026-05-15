// Shows action bonus sources over the event image, aligned to the side they help.
(() => {
  const amount = (modifier) => {
    if (typeof modifier.rollBonus === "number") return modifier.rollBonus;
    if (typeof modifier.statBonus === "number") return modifier.statBonus * 5;
    return 0;
  };

  const modifierName = (modifier) => modifier.itemName || modifier.name || modifier.label?.replace(/^[^A-Za-z0-9]+\s*/, "").replace(/\s*[+-]\d+$/, "") || "Bonus";

  const sourceRows = (choiceData) => getChoiceModifiers(choiceData)
    .map(modifier => ({ name: modifierName(modifier), bonus: amount(modifier) }))
    .filter(modifier => modifier.bonus !== 0)
    .slice(0, 4);

  const renderSourceList = (side, choiceData) => {
    const rows = sourceRows(choiceData);
    if (!rows.length) return "";
    return `<div class="gd-art-bonus-list ${side}">${rows.map(row => `<div class="gd-art-bonus-chip"><b>${row.name}</b><span>${row.bonus > 0 ? "+" : ""}${row.bonus}</span></div>`).join("")}</div>`;
  };

  const patchEventArt = () => {
    if (game?.activeTab !== "explore" || game?.lastAction) return;
    const cardData = cards?.[game.currentCardId];
    const art = document.querySelector(".gd-card-art");
    if (!cardData || !art || art.querySelector(".gd-art-bonus-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "gd-art-bonus-overlay";
    overlay.innerHTML = `${renderSourceList("left", cardData.choices.left)}${renderSourceList("right", cardData.choices.right)}`;
    if (overlay.textContent.trim()) art.appendChild(overlay);
  };

  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  window.render = function(...args) {
    const result = originalRender.apply(this, args);
    patchEventArt();
    return result;
  };

  render();
})();
