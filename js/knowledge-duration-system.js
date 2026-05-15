// Hero stat modifier chips such as Clean Theft / Marked Route now have durations.
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
    if (!game.hero.knowledge.includes(name)) game.hero.knowledge.push(name);
    const duration = KNOWLEDGE_DURATIONS[name] || DEFAULT_KNOWLEDGE_DURATION;
    game.hero.knowledgeTurns[name] = Math.max(game.hero.knowledgeTurns[name] || 0, duration);
  };

  const tickKnowledgeDurations = () => {
    ensureKnowledgeTurns();
    Object.keys(game.hero.knowledgeTurns).forEach(name => {
      game.hero.knowledgeTurns[name] = Math.max(0, game.hero.knowledgeTurns[name] - 1);
      if (game.hero.knowledgeTurns[name] <= 0) delete game.hero.knowledgeTurns[name];
    });
    game.hero.knowledge = game.hero.knowledge.filter(name => (game.hero.knowledgeTurns[name] || 0) > 0);
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
      const shouldTick = !game.awaitingResultAck && game.heroTimer > 0;
      baseChoose(side);
      if (shouldTick && game.awaitingResultAck) {
        tickKnowledgeDurations();
        game.log.unshift("Hero modifiers tick down by 1 action.");
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
  window.tickKnowledgeDurations = tickKnowledgeDurations;
  ensureKnowledgeTurns();
  if (typeof render === "function") render();
})();
