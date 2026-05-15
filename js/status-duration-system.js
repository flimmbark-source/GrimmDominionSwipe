// Status system: statuses last for a limited number of rounds, usually 5+.
(() => {
  const STATUS_DURATIONS = {
    Hidden: 5,
    Suspected: 5,
    Revealed: 5,
    Wounded: 6,
    "Out of Time": 1,
  };

  const DEFAULT_STATUS_DURATION = 5;
  const BASE_STATUS = "Normal";

  const ensureStatusState = () => {
    game.hero.statusTurns ||= {};
    if (game.hero.status && game.hero.status !== BASE_STATUS && !game.hero.statusTurns[game.hero.status]) {
      game.hero.statusTurns[game.hero.status] = STATUS_DURATIONS[game.hero.status] || DEFAULT_STATUS_DURATION;
    }
  };

  const setTimedStatus = (statusName, duration = STATUS_DURATIONS[statusName] || DEFAULT_STATUS_DURATION) => {
    game.hero.statusTurns ||= {};
    game.hero.statusTurns[statusName] = Math.max(game.hero.statusTurns[statusName] || 0, duration);
    game.hero.status = statusName;
  };

  const activeStatusName = () => {
    ensureStatusState();
    if (game.hero.status && game.hero.statusTurns[game.hero.status] > 0) return game.hero.status;
    const active = Object.entries(game.hero.statusTurns).filter(([, turns]) => turns > 0);
    if (!active.length) return BASE_STATUS;
    active.sort((a, b) => b[1] - a[1]);
    return active[0][0];
  };

  const formattedStatus = () => {
    const status = activeStatusName();
    const turns = game.hero.statusTurns?.[status] || 0;
    return turns > 0 ? `${status} ${turns}` : status;
  };

  const decrementStatuses = () => {
    ensureStatusState();
    Object.keys(game.hero.statusTurns).forEach(status => {
      game.hero.statusTurns[status] = Math.max(0, game.hero.statusTurns[status] - 1);
      if (game.hero.statusTurns[status] <= 0) delete game.hero.statusTurns[status];
    });
    game.hero.status = activeStatusName();
    if (game.hero.status === BASE_STATUS && game.regions?.village?.state === "Hero Revealed") {
      game.regions.village.state = "Suspected";
    }
    syncPartyHeroSummary?.();
  };

  const patchStatusText = () => {
    if (!game?.hero) return;
    const display = formattedStatus();
    document.querySelectorAll(".gd-status").forEach(node => {
      if ((node.textContent || "").includes(game.hero.status) || (node.textContent || "").includes("Normal")) {
        node.textContent = `◉ ${display}`;
      }
    });
  };

  ensureStatusState();

  const baseApplyRewards = typeof applyRewards === "function" ? applyRewards : null;
  if (baseApplyRewards) {
    window.applyRewards = function applyRewards(rewards = []) {
      const statusRewards = rewards.filter(reward => reward.type === "status");
      const result = baseApplyRewards(rewards);
      statusRewards.forEach(reward => {
        setTimedStatus(reward.value, reward.duration || STATUS_DURATIONS[reward.value] || DEFAULT_STATUS_DURATION);
        if (reward.value === "Revealed") {
          game.regions.village.state = "Hero Revealed";
          addSignal?.("village", "sighting");
        }
      });
      syncPartyHeroSummary?.();
      return result;
    };
    applyRewards = window.applyRewards;
  }

  const baseResolveDarkLordPlan = typeof resolveDarkLordPlan === "function" ? resolveDarkLordPlan : null;
  if (baseResolveDarkLordPlan) {
    window.resolveDarkLordPlan = function resolveDarkLordPlan() {
      baseResolveDarkLordPlan();
      decrementStatuses();
      game.log.unshift("Status durations tick down by 1 round.");
    };
    resolveDarkLordPlan = window.resolveDarkLordPlan;
  }

  const baseRender = typeof render === "function" ? render : null;
  if (baseRender) {
    window.render = function(...args) {
      const result = baseRender.apply(this, args);
      patchStatusText();
      return result;
    };
    render = window.render;
    render();
  }
})();
