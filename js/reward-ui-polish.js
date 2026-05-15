// Polishes reward-return presentation without changing the swipe interaction.
(() => {
  const ICONS = {
    "Lockpick Set": "🗝",
    "Rope Hook": "🪝",
    "Soot Cloak": "◒",
    "House Key": "🗝",
    "Torch Kit": "🔥",
    "Scout Horn": "♬",
    "Warding Charm": "✦",
    "Lantern": "☼",
  };

  const KNOWLEDGE = {
    "Inside": { icon: "⌂", tags: ["house", "entry"], rollBonus: 3 },
    "Shortcut": { icon: "↝", tags: ["route", "escape"], rollBonus: 4 },
    "Theft": { icon: "●", tags: ["theft"], rollBonus: 3 },
    "Clean Theft": { icon: "●", tags: ["theft", "lock", "quiet"], rollBonus: 6 },
    "Village Secrets": { icon: "✦", tags: ["food", "house", "search", "village"], rollBonus: 5 },
    "Scout Down": { icon: "⚔", tags: ["scout", "combat"], rollBonus: 4 },
    "Silent Kill": { icon: "☠", tags: ["combat", "scout", "stealth"], rollBonus: 7 },
    "Patience": { icon: "◉", tags: ["stealth", "hide", "patrol"], rollBonus: 4 },
    "High Path": { icon: "↟", tags: ["roof", "climb", "route"], rollBonus: 5 },
    "Blend In": { icon: "◒", tags: ["stealth", "crowd", "smoke", "hide"], rollBonus: 6 },
    "Escape Route": { icon: "↝", tags: ["route", "escape", "stealth"], rollBonus: 6 },
    "Secret Path": { icon: "✦", tags: ["route", "spirit", "magic"], rollBonus: 7 },
    "Marked Route": { icon: "↝", tags: ["route", "escape", "mark"], rollBonus: 4 },
    "Intimidate": { icon: "⚔", tags: ["combat", "intimidate", "lure"], rollBonus: 5 },
    "Broken Seal": { icon: "⛓", tags: ["magic", "spirit", "route", "escape"], rollBonus: 6 },
    "Trap Sense": { icon: "◉", tags: ["trap", "stealth", "hide"], rollBonus: 5 },
    "Trap Cut": { icon: "▣", tags: ["trap", "tool", "cunning"], rollBonus: 4 },
    "Resisted Curse": { icon: "✦", tags: ["spirit", "magic"], rollBonus: 5 },
  };

  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  const compactBonusLabels = () => {
    if (typeof ITEM_BONUSES === "undefined") return;
    Object.entries(ITEM_BONUSES).forEach(([name, bonus]) => {
      bonus.icon = bonus.icon || ICONS[name] || "▣";
      bonus.rollBonus = typeof bonus.rollBonus === "number" ? bonus.rollBonus : Math.min(10, Math.max(1, bonus.statBonus || 1));
      delete bonus.statBonus;
      bonus.label = `${bonus.icon} +${bonus.rollBonus}`;
    });
  };

  const patchKnowledgeModifiers = () => {
    if (window.__knowledgeModifierPatchApplied || typeof getChoiceModifiers !== "function") return;
    window.__knowledgeModifierPatchApplied = true;
    const originalGetChoiceModifiers = getChoiceModifiers;
    window.getChoiceModifiers = function(choiceData) {
      const itemModifiers = originalGetChoiceModifiers(choiceData) || [];
      const knowledgeModifiers = Object.entries(KNOWLEDGE)
        .filter(([name]) => game?.hero?.knowledge?.includes(name))
        .map(([name, bonus]) => ({
          itemName: name,
          ...bonus,
          label: `${bonus.icon} +${bonus.rollBonus}`,
          source: "knowledge",
        }))
        .filter(bonus => bonus.tags.some(tag => choiceData.tags?.includes(tag)));
      return [...itemModifiers, ...knowledgeModifiers];
    };
    getChoiceModifiers = window.getChoiceModifiers;
  };

  const patchHeroKnowledge = () => {
    const statsPanel = [...document.querySelectorAll(".gd-panel")].find(panel =>
      panel.textContent?.includes("Stats")
    );
    if (!statsPanel || statsPanel.querySelector(".gd-knowledge-list")) return;
    const earned = Array.from(new Set((game?.hero?.knowledge || []).filter(name => KNOWLEDGE[name])));
    if (!earned.length) return;
    const list = document.createElement("div");
    list.className = "gd-knowledge-list";
    list.innerHTML = earned.map(name => {
      const info = KNOWLEDGE[name];
      return `<div class="gd-knowledge-chip"><span>${info.icon}</span><b>${name}</b><em>${info.icon} +${info.rollBonus}</em></div>`;
    }).join("");
    statsPanel.appendChild(list);
  };

  const enhancedRender = function(...args) {
    compactBonusLabels();
    patchKnowledgeModifiers();
    const result = originalRender.apply(this, args);
    patchHeroKnowledge();
    return result;
  };

  window.render = enhancedRender;
  compactBonusLabels();
  patchKnowledgeModifiers();

  const originalApplyRewards = window.applyRewards;
  if (typeof originalApplyRewards === "function") {
    window.applyRewards = function(rewards = []) {
      const knowledgeRewards = rewards
        .filter(reward => reward.type === "xp" && KNOWLEDGE[reward.label])
        .map(reward => reward.label);
      const result = originalApplyRewards.call(this, rewards);
      if (knowledgeRewards.length) {
        game.hero.knowledge ||= [];
        knowledgeRewards.forEach(label => {
          if (!game.hero.knowledge.includes(label)) game.hero.knowledge.push(label);
        });
      }
      return result;
    };
    applyRewards = window.applyRewards;
  }

  render();
})();
