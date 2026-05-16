// Hero stat modifier chips such as Clean Theft / Marked Route now have usage-based durations.
(() => {
  const defaultDuration = () => window.GD_MODIFIERS?.defaultKnowledgeDuration || 5;
  const durationFor = (name) => window.GD_MODIFIERS?.knowledgeDuration?.(name) || defaultDuration();
  const isKnownModifier = (name) => window.GD_MODIFIERS?.knownKnowledge?.(name) || false;

  const ensureKnowledgeTurns = () => {
    game.hero.knowledgeTurns ||= {};
    game.hero.knowledge ||= [];
    game.hero.knowledge = game.hero.knowledge.filter(name => isKnownModifier(name));
    game.hero.knowledge.forEach(name => {
      if (!game.hero.knowledgeTurns[name]) {
        game.hero.knowledgeTurns[name] = durationFor(name);
      }
    });
    game.hero.knowledge = game.hero.knowledge.filter(name => (game.hero.knowledgeTurns[name] || 0) > 0);
  };

  const addTimedKnowledge = (name) => {
    if (!isKnownModifier(name)) return;
    game.hero.knowledge ||= [];
    game.hero.knowledgeTurns ||= {};
    game.hero.knowledgeAcquiredThisAction ||= [];
    if (!game.hero.knowledge.includes(name)) game.hero.knowledge.push(name);
    if (!game.hero.knowledgeAcquiredThisAction.includes(name)) game.hero.knowledgeAcquiredThisAction.push(name);
    game.hero.knowledgeTurns[name] = Math.max(game.hero.knowledgeTurns[name] || 0, durationFor(name));
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
