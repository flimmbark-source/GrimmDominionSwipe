// Food system: Food is a healing resource only. At round end, lose 1 old Food if any and heal.
(() => {
  const foodHealPerUnit = () => window.GD_MODIFIERS?.food?.healsPerConsumedFood || 1;

  game.hero.foodGainedThisRound ||= 0;
  game.hero.foodUpkeepTickId ||= 0;

  window.getFoodRollBonus = function getFoodRollBonus() {
    return 0;
  };

  const findFoodNode = () => [...document.querySelectorAll(".gd-resource b")]
    .find(node => (node.textContent || "").includes("Food"));

  const spawnFoodHealGhost = () => {
    const source = findFoodNode();
    const target = document.querySelector(".gd-inline-hp");
    if (!source || !target) return;

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const healAmount = foodHealPerUnit();
    const ghost = document.createElement("div");
    ghost.className = "gd-food-heal-ghost";
    ghost.textContent = `+${healAmount}❤️`;
    ghost.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
    ghost.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
    ghost.style.setProperty("--food-heal-target-x", `${targetRect.left + targetRect.width / 2}px`);
    ghost.style.setProperty("--food-heal-target-y", `${targetRect.top + targetRect.height / 2}px`);
    document.body.appendChild(ghost);

    target.classList.remove("ghost-hp-pulse");
    void target.offsetWidth;
    target.classList.add("ghost-hp-pulse");
    ghost.addEventListener("animationend", () => ghost.remove(), { once: true });
  };

  const applyFoodUpkeep = () => {
    const protectedFood = Math.max(0, game.hero.foodGainedThisRound || 0);
    const oldFood = Math.max(0, (game.hero.food || 0) - protectedFood);
    if (oldFood > 0) {
      const healAmount = foodHealPerUnit();
      spawnFoodHealGhost();
      game.hero.food = Math.max(0, game.hero.food - 1);
      game.partyHealth = Math.min(10, game.partyHealth + healAmount);
      game.log.unshift(`The Goblin eats 1 old Food and restores ${healAmount} Health before the next round.`);
      syncPartyHeroSummary?.();
    }
    game.hero.foodGainedThisRound = 0;
  };

  const baseApplyRewards = typeof applyRewards === "function" ? applyRewards : null;
  if (baseApplyRewards) {
    window.applyRewards = function applyRewards(rewards = []) {
      const gainedFood = rewards
        .filter(reward => reward.type === "food" && reward.amount > 0)
        .reduce((sum, reward) => sum + reward.amount, 0);
      const result = baseApplyRewards(rewards);
      if (gainedFood > 0) {
        game.hero.foodGainedThisRound = (game.hero.foodGainedThisRound || 0) + gainedFood;
      }
      return result;
    };
    applyRewards = window.applyRewards;
  }

  const baseTick = typeof tick === "function" ? tick : null;
  if (baseTick) {
    window.tick = function tick() {
      const beforeTimer = game.darkLordTimer;
      baseTick();
      const roundResetHappened = beforeTimer === 1 && game.darkLordTimer === 60;
      if (roundResetHappened) {
        game.hero.foodUpkeepTickId += 1;
        applyFoodUpkeep();
        render?.();
      }
    };
    tick = window.tick;
    if (typeof startTimers === "function") startTimers();
  }

  window.applyFoodUpkeep = applyFoodUpkeep;

  if (typeof render === "function") render();
})();
