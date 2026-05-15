// Hero stat modifier chips such as Clean Theft / Marked Route now have usage-based durations.
(() => {
  const DEFAULT_KNOWLEDGE_DURATION = 5;
  const KNOWLEDGE_DURATIONS = {
    "Inside": 5,
    "Shortcut": 5,
    "Theft": 5,
    "Clean Theft": 6,
    "Village Secrets": 6,
    "Scout Down": 5,
    "Silent Kill": 6,
    "Patience": 5,
    "High Path": 6,
    "Blend In": 5,
    "Escape Route": 6,
    "Secret Path": 7,
    "Marked Route": 5,
    "Intimidate": 5,
    "Broken Seal": 6,
    "Trap Sense": 5,
    "Trap Cut": 5,
    "Resisted Curse": 6,
  };

  const ensureKnowledgeTurns = () => {
    game.hero.knowledgeTurns ||= {};
    game.hero.knowledge ||= [];
    game.hero.knowledge.forEach(name => {
      if (!game.hero.knowledgeTurns[name]) {
        game.hero.knowledgeTurns[name] = KNOWLEDGE_DURATIONS[name] || DEFAULT_KNOWLEDGE_DURATION;
      }
    });
    game.hero.knowledge = game.hero.knowledge.filter(name => (game.hero.knowledgeTurns[name] || 0) > 0);
  };

  const addTimedKnowledge = (name) => {
    game.hero.knowledge ||= [];
    game.hero.knowledgeTurns ||= {};
    game.hero.knowledgeAcquiredThisAction ||= [];
    if (!game.hero.knowledge.includes(name)) game.hero.knowledge.push(name);
    if (!game.hero.knowledgeAcquiredThisAction.includes(name)) game.hero.knowledgeAcquiredThisAction.push(name);
    const duration = KNOWLEDGE_DURATIONS[name] || DEFAULT_KNOWLEDGE_DURATION;
    game.hero.knowledgeTurns[name] = Math.max(game.hero.knowledgeTurns[name] || 0, duration);
  };

  const tickSpecificKnowledgeDurations = (usedNames = [], skipNames = []) => {
    ensureKnowledgeTurns();
    const used = new Set(usedNames);
    const skip = new Set(skipNames);
    used.forEach(name => {
      if (skip.has(name) || !game.hero.knowledgeTurns[name]) return;
      game.hero.knowledgeTurns[name] = Math.max(0, game.hero.knowledgeTurns[name] - 1);
      if (game.hero.knowledgeTurns[name] <= 0) delete game.hero.knowledgeTurns[name];
    });
    game.hero.knowledge = game.hero.knowledge.filter(name => (game.hero.knowledgeTurns[name] || 0) > 0);
  };

  const knowledgeUsedByChoice = (choiceData) => {
    if (!choiceData || typeof getChoiceModifiers !== "function") return [];
    return [...new Set(
      getChoiceModifiers(choiceData)
        .filter(modifier => modifier.source === "knowledge" && modifier.itemName)
        .map(modifier => modifier.itemName)
    )];
  };

  const baseApplyRewards = typeof applyRewards === "function" ? applyRewards : null;
  if (baseApplyRewards) {
    window.applyRewards = function applyRewards(rewards = []) {
      const xpLabels = rewards.filter(reward => reward.type === "xp" && reward.label).map(reward => reward.label);
      const result = baseApplyRewards(rewards);
      xpLabels.forEach(addTimedKnowledge);
      return result;
    };
    applyRewards = window.applyRewards;
  }

  const baseChoose = typeof choose === "function" ? choose : null;
  if (baseChoose) {
    window.choose = function choose(side) {
      const card = cards?.[game.currentCardId];
      const choiceData = card?.choices?.[side];
      const usedBeforeRoll = !game.awaitingResultAck && game.heroTimer > 0 ? knowledgeUsedByChoice(choiceData) : [];
      game.hero.knowledgeAcquiredThisAction = [];
      baseChoose(side);
      if (usedBeforeRoll.length && game.awaitingResultAck) {
        const protectedThisAction = [...(game.hero.knowledgeAcquiredThisAction || [])];
        tickSpecificKnowledgeDurations(usedBeforeRoll, protectedThisAction);
        game.hero.knowledgeAcquiredThisAction = [];
        game.log.unshift(`${usedBeforeRoll.join(", ")} used; duration ticks down.`);
        render?.();
      }
    };
    choose = window.choose;
  }

  const baseRender = typeof render === "function" ? render : null;
  if (baseRender) {
    window.render = function(...args) {
      ensureKnowledgeTurns();
      return baseRender.apply(this, args);
    };
    render = window.render;
  }

  window.addTimedKnowledge = addTimedKnowledge;
  window.tickKnowledgeDurations = tickSpecificKnowledgeDurations;
  window.knowledgeUsedByChoice = knowledgeUsedByChoice;
  ensureKnowledgeTurns();
  if (typeof render === "function") render();
})();
