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
    "Village Secrets": { icon: "✦", effect: "Food events can reveal safer scavenging." },
    "Inside": { icon: "⌂", effect: "House actions are easier to read." },
    "Patience": { icon: "◉", effect: "Stealth choices show safer timing windows." },
    "High Path": { icon: "↟", effect: "Rooftop routes are faster and safer." },
    "Marked Route": { icon: "↝", effect: "Party can follow this route later." },
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
      return `<div class="gd-knowledge-chip"><span>${info.icon}</span><b>${name}</b><small>${info.effect}</small></div>`;
    }).join("");
    statsPanel.appendChild(list);
  };

  const enhancedRender = function(...args) {
    compactBonusLabels();
    const result = originalRender.apply(this, args);
    patchHeroKnowledge();
    return result;
  };

  window.render = enhancedRender;
  compactBonusLabels();

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
  }

  render();
})();
