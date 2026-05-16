// Polishes reward-return presentation without changing the swipe interaction.
(() => {
  const knowledgeDefs = () => window.GD_MODIFIERS?.knowledge || {};

  const compactBonusLabels = () => {
    if (typeof ITEM_BONUSES === "undefined") return;
    Object.entries(window.GD_MODIFIERS?.items || {}).forEach(([name, def]) => {
      ITEM_BONUSES[name] = {
        ...(ITEM_BONUSES[name] || {}),
        icon: def.icon,
        tags: def.tags,
        rollBonus: def.rollBonus,
        label: `${def.icon} +${def.rollBonus}`,
      };
      delete ITEM_BONUSES[name].statBonus;
    });
  };

  const patchKnowledgeModifiers = () => {
    if (window.__knowledgeModifierPatchApplied || typeof getChoiceModifiers !== "function") return;
    window.__knowledgeModifierPatchApplied = true;
    const originalGetChoiceModifiers = getChoiceModifiers;
    window.getChoiceModifiers = function(choiceData) {
      const itemModifiers = originalGetChoiceModifiers(choiceData) || [];
      const knowledgeModifiers = window.GD_MODIFIERS?.knowledgeModifiersForChoice(game?.hero?.knowledge || [], choiceData) || [];
      return [...itemModifiers, ...knowledgeModifiers];
    };
    getChoiceModifiers = window.getChoiceModifiers;
  };

  const patchHeroKnowledge = () => {
    const statsPanel = [...document.querySelectorAll(".gd-panel")].find(panel =>
      panel.textContent?.includes("Stats")
    );
    if (!statsPanel || statsPanel.querySelector(".gd-knowledge-list")) return;
    const earned = Array.from(new Set((game?.hero?.knowledge || []).filter(name => knowledgeDefs()[name])));
    if (!earned.length) return;
    const list = document.createElement("div");
    list.className = "gd-knowledge-list";
    list.innerHTML = earned.map(name => {
      const info = knowledgeDefs()[name];
      const turns = game?.hero?.knowledgeTurns?.[name];
      const duration = turns ? `<strong class="gd-knowledge-duration">${turns}</strong>` : "";
      return `<div class="gd-knowledge-chip"><span>${info.icon}</span><b>${name}</b><em>${info.icon} +${info.rollBonus}</em>${duration}</div>`;
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

  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  window.render = enhancedRender;
  compactBonusLabels();
  patchKnowledgeModifiers();

  const originalApplyRewards = window.applyRewards;
  if (typeof originalApplyRewards === "function") {
    window.applyRewards = function(rewards = []) {
      const knowledgeRewards = rewards
        .filter(reward => reward.type === "xp" && knowledgeDefs()[reward.label])
        .map(reward => reward.label);
      const result = originalApplyRewards.call(this, rewards);
      if (knowledgeRewards.length) {
        game.hero.knowledge ||= [];
        knowledgeRewards.forEach(label => {
          if (!game.hero.knowledge.includes(label)) game.hero.knowledge.push(label);
          if (typeof window.addTimedKnowledge === "function") window.addTimedKnowledge(label);
        });
      }
      return result;
    };
    applyRewards = window.applyRewards;
  }

  render();
})();
