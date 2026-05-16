// Replaces placeholder inventory presentation with live item-effect cards.
(() => {
  const itemDefs = () => window.GD_MODIFIERS?.items || {};

  const ensureItemBonuses = () => {
    if (typeof ITEM_BONUSES === "undefined") return;
    Object.entries(itemDefs()).forEach(([name, def]) => {
      ITEM_BONUSES[name] = {
        ...(ITEM_BONUSES[name] || {}),
        tags: def.tags,
        rollBonus: def.rollBonus,
        icon: def.icon,
        label: `${def.icon} +${def.rollBonus}`,
      };
      delete ITEM_BONUSES[name].statBonus;
    });
  };

  const iconForItem = (name) => itemDefs()[name]?.icon || inventoryIcon?.(name) || "▣";
  const defForItem = (name) => itemDefs()[name] || { icon: iconForItem(name), tags: [], rollBonus: 0, slot: "Item" };

  const renderItemCard = (name) => {
    const def = defForItem(name);
    const bonus = ITEM_BONUSES?.[name]?.rollBonus || def.rollBonus || 0;
    const tags = ITEM_BONUSES?.[name]?.tags || def.tags || [];
    const chip = bonus > 0 ? `<em>${def.icon} +${bonus}</em>` : `<em class="muted">Held</em>`;
    const tagLine = tags.length
      ? `<div class="gd-inv-tags">${tags.slice(0, 4).map(tag => `<span>${tag}</span>`).join("")}</div>`
      : `<div class="gd-inv-tags"><span>stored</span></div>`;
    return `<article class="gd-inv-card"><div class="gd-inv-icon">${def.icon}</div><div class="gd-inv-main"><div class="gd-inv-name">${name}</div><div class="gd-inv-slot">${def.slot || "Item"}</div>${tagLine}</div>${chip}</article>`;
  };

  window.renderInventory = function renderInventory() {
    ensureItemBonuses();
    const inventory = [...new Set(game.hero.inventory || [])];
    const equippedNames = (game.hero.equipment || []).map(item => item.name);
    const equipped = [...new Set([...equippedNames].filter(name => inventory.includes(name) || itemDefs()[name]))];
    const bag = inventory.filter(name => !equipped.includes(name));
    const passiveCount = inventory.filter(name => (ITEM_BONUSES?.[name]?.rollBonus || itemDefs()[name]?.rollBonus || 0) > 0).length;
    return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">▣</div><div><div class="gd-title">Inventory</div><div class="gd-subtitle">${passiveCount} roll modifiers active</div></div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-footer-chip"><img class="gd-portrait" src="${ART.goblinSmall}"><div><div class="gd-name">${game.hero.name} <span class="gd-inline-hp">♥ ${game.partyHealth}/10</span></div><div class="gd-status">◉ ${game.hero.status}</div></div><div class="gd-resource">Gold ${game.hero.resourceValue}<br><b>Food ${game.hero.food}</b></div></section>
      <section class="gd-panel"><div class="gd-section-title">Equipped roll bonuses</div><div class="gd-inv-list">${equipped.map(renderItemCard).join("")}</div></section>
      <section class="gd-panel"><div class="gd-section-title">Bag roll bonuses</div><div class="gd-inv-list">${bag.length ? bag.map(renderItemCard).join("") : `<div class="gd-empty-note">No extra items yet.</div>`}</div></section>
      <section class="gd-panel"><div class="gd-section-title">How items work</div><div class="gd-card-text">Items are passive. When a future choice has matching tags, its choice card adds that item's d100 bonus into the single combined roll modifier.</div></section></div>`;
  };

  ensureItemBonuses();
  if (typeof render === "function") render();
})();
