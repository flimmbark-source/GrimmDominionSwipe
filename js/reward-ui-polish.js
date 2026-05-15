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
    "Inside": { icon: "⌂", tags: ["house", "entry"], statBonus: 1, target: "House / entry" },
    "Shortcut": { icon: "↝", tags: ["route", "escape"], statBonus: 1, target: "Route / escape" },
    "Theft": { icon: "●", tags: ["theft"], statBonus: 1, target: "Theft" },
    "Clean Theft": { icon: "●", tags: ["theft", "lock", "quiet"], statBonus: 1, target: "Quiet theft" },
    "Village Secrets": { icon: "✦", tags: ["food", "house", "search", "village"], statBonus: 1, target: "Scavenge / search" },
    "Scout Down": { icon: "⚔", tags: ["scout", "combat"], statBonus: 1, target: "Scout fights" },
    "Silent Kill": { icon: "☠", tags: ["combat", "scout", "stealth"], statBonus: 1, target: "Silent takedowns" },
    "Patience": { icon: "◉", tags: ["stealth", "hide", "patrol"], statBonus: 1, target: "Stealth timing" },
    "High Path": { icon: "↟", tags: ["roof", "climb", "route"], statBonus: 1, target: "Rooftop routes" },
    "Blend In": { icon: "◒", tags: ["stealth", "crowd", "smoke", "hide"], statBonus: 1, target: "Blend / hide" },
    "Escape Route": { icon: "↝", tags: ["route", "escape", "stealth"], statBonus: 1, target: "Escape routes" },
    "Secret Path": { icon: "✦", tags: ["route", "spirit", "magic"], statBonus: 1, target: "Secret routes" },
    "Marked Route": { icon: "↝", tags: ["route", "escape", "mark"], statBonus: 1, target: "Route / escape" },
    "Intimidate": { icon: "⚔", tags: ["combat", "intimidate", "lure"], statBonus: 1, target: "Intimidate" },
    "Broken Seal": { icon: "⛓", tags: ["magic", "spirit", "route", "escape"], statBonus: 1, target: "Seals / magic routes" },
    "Trap Sense": { icon: "◉", tags: ["trap", "stealth", "hide"], statBonus: 1, target: "Trap avoidance" },
    "Trap Cut": { icon: "▣", tags: ["trap", "tool", "cunning"], statBonus: 1, target: "Trap tools" },
    "Resisted Curse": { icon: "✦", tags: ["spirit", "magic"], statBonus: 1, target: "Curses / magic" },
  };

  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  const compactBonusLabels = () => {
    if (typeof ITEM_BONUSES === "undefined") return;
    Object.entries(ITEM_BONUSES).forEach(([name, bonus]) => {
      bonus.icon = bonus.icon || ICONS[name] || "▣";
      bonus.label = `${bonus.icon} +${bonus.statBonus}`;
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
          label: `${bonus.icon} +${bonus.statBonus}`,
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
      return `<div class="gd-knowledge-chip"><span>${info.icon}</span><b>${name}</b><small>${info.target}</small><em>${info.icon} +${info.statBonus}</em></div>`;
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
