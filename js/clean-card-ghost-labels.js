// Display-only cleanup: region/explore deck reward ghosts should show the card name, not "added".
(() => {
  const baseApplyRewards = typeof applyRewards === "function" ? applyRewards : null;
  if (!baseApplyRewards) return;

  window.applyRewards = function applyRewards(rewards = []) {
    const ghosts = baseApplyRewards(rewards) || [];
    ghosts.forEach(ghost => {
      if (ghost?.kind === "card" || ghost?.className === "item") {
        ghost.text = String(ghost.text || "").replace(/\s+added$/i, "");
      }
    });
    return ghosts;
  };
  applyRewards = window.applyRewards;
})();
