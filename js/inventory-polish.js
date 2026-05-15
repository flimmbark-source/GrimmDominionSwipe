// Replaces placeholder inventory presentation with live item-effect cards.
(() => {
  const ITEM_DEFS = {
    "Rusty Shiv": { icon: "⚔", tags: ["combat", "scout", "intimidate"], statBonus: 1, slot: "Main" },
    "Smoke Bomb": { icon: "◒", tags: ["stealth", "hide", "smoke", "escape"], statBonus: 1, slot: "Tool" },
    "Crow Coin": { icon: "●", tags: ["theft", "search", "market"], statBonus: 1, slot: "Charm" },
    "Lockpick Set": { icon: "🗝", tags: ["lock"], statBonus: 2, slot: "Tool" },
    "Rope Hook": { icon: "🪝", tags: ["climb", "roof", "escape", "well", "route"], statBonus: 2, slot: "Tool" },
    "Soot Cloak": { icon: "◒", tags: ["stealth", "smoke", "crowd", "hide"], statBonus: 2, slot: "Body" },
    "House Key": { icon: "🗝", tags: ["house", "cottage", "lock", "entry"], statBonus: 2, slot: "Key" },
    "Torch Kit": { icon: "🔥", tags: ["dark", "tunnel", "cellar", "well", "search"], statBonus: 2, slot: "Tool" },
    "Scout Horn": { icon: "♬", tags: ["scout", "intimidate", "lure"], statBonus: 2, slot: "Trick" },
    "Warding Charm": { icon: "✦", tags: ["spirit", "lore", "chapel", "magic"], statBonus: 2, slot: "Charm" },
    "Lantern": { icon: "☼", tags: ["dark", "tunnel", "well", "search"], statBonus: 1, slot: "Tool" },
    "Healing Herbs": { icon: "✚", tags: ["food", "survival"], statBonus: 1, slot: "Supply" },
    "Silver Button": { icon: "●", tags: ["theft", "market"], statBonus: 1, slot: "Trinket" },
    "Spare Lock": { icon: "▣", tags: ["lock", "trap", "tool"], statBonus: 1, slot: "Tool" },
    "Lost Bundle": { icon: "▣", tags: ["supplies", "search", "survival"], statBonus: 1, slot: "Supply" },
    "Snare Cord": { icon: "⌁", tags: ["trap", "tool", "lure"], statBonus: 1, slot: "Tool" },
  };

  const ensureItemBonuses = () => {
    if (typeof ITEM_BONUSES === "undefined") return;
    Object.entries(ITEM_DEFS).forEach(([name, def]) => {
      ITEM_BONUSES[name] = {
        ...(ITEM_BONUSES[name] || {}),
        tags: def.tags,
        statBonus: ITEM_BONUSES[name]?.statBonus || def.statBonus,
        icon: def.icon,
        label: `${def.icon} +${ITEM_BONUSES[name]?.statBonus || def.statBonus}`,
      };
    });
  };

  const iconForItem = (name) => ITEM_DEFS[name]?.icon || inventoryIcon?.(name) || "▣";
  const defForItem = (name) => ITEM_DEFS[name] || { icon: iconForItem(name), tags: [], statBonus: 0, slot: "Item" };

  const renderItemCard = (name) => {
    const def = defForItem(name);
    const bonus = ITEM_BONUSES?.[name]?.statBonus || def.statBonus || 0;
    const tags = ITEM_BONUSES?.[name]?.tags || def.tags || [];
    const chip = bonus > 0 ? `<em>${def.icon} +${bonus}</em>` : `<em class="muted">Held</em>`;
    const tagLine = tags.length
      ? `<div class="gd-inv-tags">${tags.slice(0, 4).map(tag => `<span>${tag}</span>`).join("")}</div>`
      : `<div class="gd-inv-tags"><span>stored</span></div>`;
    return `<article class="gd-inv-card"><div class="gd-inv-icon">${def.icon}</div><div class="gd-inv-main"><div class="gd-inv-name">${name}</div><div class="gd-inv-slot">${def.slot}</div>${tagLine}</div>${chip}</article>`;
  };

  window.renderInventory = function renderInventory() {
    ensureItemBonuses();
    const inventory = [...new Set(game.hero.inventory || [])];
    const equippedNames = (game.hero.equipment || []).map(item => item.name);
    const equipped = [...new Set([...equippedNames].filter(name => inventory.includes(name) || ITEM_DEFS[name]))];
    const bag = inventory.filter(name => !equipped.includes(name));
    const passiveCount = inventory.filter(name => (ITEM_BONUSES?.[name]?.statBonus || ITEM_DEFS[name]?.statBonus || 0) > 0).length;
    return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">▣</div><div><div class="gd-title">Inventory</div><div class="gd-subtitle">${passiveCount} passive modifiers active</div></div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-footer-chip"><img class="gd-portrait" src="${ART.goblinSmall}"><div><div class="gd-name">${game.hero.name} <span class="gd-inline-hp">♥ ${game.partyHealth}/10</span></div><div class="gd-status">◉ ${game.hero.status}</div></div><div class="gd-resource">Gold ${game.hero.resourceValue}<br><b>Food ${game.hero.food}</b></div></section>
      <section class="gd-panel"><div class="gd-section-title">Equipped modifiers</div><div class="gd-inv-list">${equipped.map(renderItemCard).join("")}</div></section>
      <section class="gd-panel"><div class="gd-section-title">Bag modifiers</div><div class="gd-inv-list">${bag.length ? bag.map(renderItemCard).join("") : `<div class="gd-empty-note">No extra items yet.</div>`}</div></section>
      <section class="gd-panel"><div class="gd-section-title">How items work</div><div class="gd-card-text">Items are passive. When a future choice has matching tags, its choice card shows the item icon and bonus, like <b>🗝 +2</b>, and the odds use that bonus.</div></section></div>`;
  };

  ensureItemBonuses();
  if (typeof render === "function") render();
})();
