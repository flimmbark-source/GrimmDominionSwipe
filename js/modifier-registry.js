// Shared modifier registry for items, Hero stat modifiers, and food.
// This is the single source of truth for roll bonus values, tags, icons, slots, and durations.
(() => {
  const ITEM_DEFS = {
    "Rusty Shiv": { icon: "⚔", tags: ["combat", "scout", "intimidate"], rollBonus: 4, slot: "Main" },
    "Smoke Bomb": { icon: "◒", tags: ["stealth", "hide", "smoke", "escape"], rollBonus: 6, slot: "Tool" },
    "Crow Coin": { icon: "●", tags: ["theft", "search", "market"], rollBonus: 3, slot: "Charm" },
    "Lockpick Set": { icon: "🗝", tags: ["lock"], rollBonus: 8, slot: "Tool" },
    "Rope Hook": { icon: "🪝", tags: ["climb", "roof", "escape", "well", "route"], rollBonus: 7, slot: "Tool" },
    "Soot Cloak": { icon: "◒", tags: ["stealth", "smoke", "crowd", "hide"], rollBonus: 8, slot: "Body" },
    "House Key": { icon: "🗝", tags: ["house", "cottage", "lock", "entry"], rollBonus: 9, slot: "Key" },
    "Torch Kit": { icon: "🔥", tags: ["dark", "tunnel", "cellar", "well", "search"], rollBonus: 7, slot: "Tool" },
    "Scout Horn": { icon: "♬", tags: ["scout", "intimidate", "lure"], rollBonus: 6, slot: "Trick" },
    "Warding Charm": { icon: "✦", tags: ["spirit", "lore", "chapel", "magic"], rollBonus: 8, slot: "Charm" },
    "Lantern": { icon: "☼", tags: ["dark", "tunnel", "well", "search"], rollBonus: 5, slot: "Tool" },
    "Healing Herbs": { icon: "✚", tags: ["food", "survival"], rollBonus: 4, slot: "Supply" },
    "Silver Button": { icon: "●", tags: ["theft", "market"], rollBonus: 2, slot: "Trinket" },
    "Spare Lock": { icon: "▣", tags: ["lock", "trap", "tool"], rollBonus: 5, slot: "Tool" },
    "Lost Bundle": { icon: "▣", tags: ["supplies", "search", "survival"], rollBonus: 3, slot: "Supply" },
    "Snare Cord": { icon: "⌁", tags: ["trap", "tool", "lure"], rollBonus: 4, slot: "Tool" },
  };

  const KNOWLEDGE_DEFS = {
    "Inside": { icon: "⌂", tags: ["house", "entry"], rollBonus: 3, duration: 5 },
    "Shortcut": { icon: "↝", tags: ["route", "escape"], rollBonus: 4, duration: 5 },
    "Theft": { icon: "●", tags: ["theft"], rollBonus: 3, duration: 5 },
    "Clean Theft": { icon: "●", tags: ["theft", "lock", "quiet"], rollBonus: 6, duration: 6 },
    "Village Secrets": { icon: "✦", tags: ["food", "house", "search", "village"], rollBonus: 5, duration: 6 },
    "Scout Down": { icon: "⚔", tags: ["scout", "combat"], rollBonus: 4, duration: 5 },
    "Silent Kill": { icon: "☠", tags: ["combat", "scout", "stealth"], rollBonus: 7, duration: 6 },
    "Patience": { icon: "◉", tags: ["stealth", "hide", "patrol"], rollBonus: 4, duration: 5 },
    "High Path": { icon: "↟", tags: ["roof", "climb", "route"], rollBonus: 5, duration: 6 },
    "Blend In": { icon: "◒", tags: ["stealth", "crowd", "smoke", "hide"], rollBonus: 6, duration: 5 },
    "Escape Route": { icon: "↝", tags: ["route", "escape", "stealth"], rollBonus: 6, duration: 6 },
    "Secret Path": { icon: "✦", tags: ["route", "spirit", "magic"], rollBonus: 7, duration: 7 },
    "Marked Route": { icon: "↝", tags: ["route", "escape", "mark"], rollBonus: 4, duration: 5 },
    "Intimidate": { icon: "⚔", tags: ["combat", "intimidate", "lure"], rollBonus: 5, duration: 5 },
    "Broken Seal": { icon: "⛓", tags: ["magic", "spirit", "route", "escape"], rollBonus: 6, duration: 6 },
    "Trap Sense": { icon: "◉", tags: ["trap", "stealth", "hide"], rollBonus: 5, duration: 5 },
    "Trap Cut": { icon: "▣", tags: ["trap", "tool", "cunning"], rollBonus: 4, duration: 5 },
    "Resisted Curse": { icon: "✦", tags: ["spirit", "magic"], rollBonus: 5, duration: 6 },
  };

  const FOOD = { rollBonusPerUnit: 0, healsPerConsumedFood: 1 };
  const DEFAULT_KNOWLEDGE_DURATION = 5;

  const normalizeModifier = (name, def, source) => ({
    itemName: name,
    name,
    source,
    icon: def.icon || "▣",
    tags: def.tags || [],
    rollBonus: typeof def.rollBonus === "number" ? def.rollBonus : 0,
    label: `${def.icon || "▣"} +${def.rollBonus || 0}`,
    slot: def.slot || "Item",
    duration: def.duration || DEFAULT_KNOWLEDGE_DURATION,
  });

  const matchesChoice = (def, choiceData) => (def.tags || []).some(tag => choiceData?.tags?.includes(tag));

  window.GD_MODIFIERS = {
    items: ITEM_DEFS,
    knowledge: KNOWLEDGE_DEFS,
    food: FOOD,
    defaultKnowledgeDuration: DEFAULT_KNOWLEDGE_DURATION,
    item(name) { return ITEM_DEFS[name] || null; },
    knowledgeDef(name) { return KNOWLEDGE_DEFS[name] || null; },
    itemModifier(name) {
      const def = ITEM_DEFS[name];
      return def ? normalizeModifier(name, def, "item") : null;
    },
    knowledgeModifier(name) {
      const def = KNOWLEDGE_DEFS[name];
      return def ? normalizeModifier(name, def, "knowledge") : null;
    },
    itemModifiersForChoice(inventory = [], choiceData) {
      return [...new Set(inventory)]
        .map(name => this.itemModifier(name))
        .filter(Boolean)
        .filter(modifier => matchesChoice(modifier, choiceData));
    },
    knowledgeModifiersForChoice(knowledge = [], choiceData) {
      return [...new Set(knowledge)]
        .map(name => this.knowledgeModifier(name))
        .filter(Boolean)
        .filter(modifier => matchesChoice(modifier, choiceData));
    },
    knowledgeDuration(name) {
      return KNOWLEDGE_DEFS[name]?.duration || DEFAULT_KNOWLEDGE_DURATION;
    },
    knownKnowledge(name) {
      return Boolean(KNOWLEDGE_DEFS[name]);
    },
  };
})();
