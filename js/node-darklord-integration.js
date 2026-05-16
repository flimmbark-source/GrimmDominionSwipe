// Bridges existing region-based Dark Lord commands into the village node-web.
(() => {
  const hasNodeMap = () => window.VILLAGE_NODE_MAP && game?.mapState?.village?.nodes;
  const nodeIds = () => hasNodeMap() ? Object.keys(window.VILLAGE_NODE_MAP.nodes) : [];
  const nodeDef = (id) => window.VILLAGE_NODE_MAP.nodes[id];
  const nodeState = (id) => game.mapState.village.nodes[id];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function scoreNodeForDarkLord(id) {
    if (!hasNodeMap()) return 0;
    const def = nodeDef(id);
    const state = nodeState(id);
    const knownHere = game.hero.visibility?.lastKnownNodeId === id || game.hero.lastKnownNodeId === id ? 10 : 0;
    const currentHere = game.hero.currentNodeId === id ? 5 : 0;
    const exposed = def.tags.includes("exposed") ? 2 : 0;
    const dangerTag = def.tags.some(tag => ["guard", "kennel", "danger", "patrol"].includes(tag)) ? 2 : 0;
    return state.noise * 2 + state.danger * 3 + state.corruption * 3 + state.threats.length * 5 + knownHere + currentHere + exposed + dangerTag;
  }

  function bestNodeByScore(mode = "pressure") {
    if (!hasNodeMap()) return game.hero.currentNodeId;
    const ids = nodeIds();
    if (mode === "hero" && game.hero.currentNodeId) return game.hero.currentNodeId;
    if (mode === "known" && (game.hero.visibility?.lastKnownNodeId || game.hero.lastKnownNodeId)) return game.hero.visibility?.lastKnownNodeId || game.hero.lastKnownNodeId;
    if (mode === "low_corruption") return [...ids].sort((a, b) => nodeState(a).corruption - nodeState(b).corruption)[0];
    return [...ids].sort((a, b) => scoreNodeForDarkLord(b) - scoreNodeForDarkLord(a))[0];
  }

  function seedCardNearPressure(cardId, regionId = game.hero.regionId) {
    if (!hasNodeMap() || regionId !== "village" || !cardId || !cards?.[cardId]) return false;
    const baseNode = ["revealed", "marked", "hunted"].includes(game.hero.visibility?.state)
      ? bestNodeByScore("known")
      : bestNodeForCard?.(cardId, bestNodeByScore("pressure"));
    const nodeId = baseNode || game.hero.currentNodeId || bestNodeByScore("pressure");
    const ok = seedCardToNode?.(nodeId, cardId);
    if (ok) {
      const state = nodeState(nodeId);
      state.visible = true;
      state.danger = clamp((state.danger || 0) + 1, 0, 10);
      game.log.unshift(`${cards[cardId].title} seeded at ${nodeDef(nodeId).label}.`);
    }
    return ok;
  }

  function addThreatNearPressure(threatId, regionId = game.hero.regionId) {
    if (!hasNodeMap() || regionId !== "village" || !threatId) return false;
    const mode = ["revealed", "marked", "hunted"].includes(game.hero.visibility?.state) ? "known" : "pressure";
    const fallback = bestNodeByScore(mode) || game.hero.currentNodeId;
    const nodeId = bestNodeForThreat?.(threatId, fallback) || fallback;
    const ok = addThreatToNode?.(nodeId, threatId);
    if (ok) {
      const state = nodeState(nodeId);
      state.visible = true;
      state.danger = clamp((state.danger || 0) + 1, 0, 10);
      game.log.unshift(`${DARK_THREATS?.[threatId]?.title || threatId} anchors at ${nodeDef(nodeId).label}.`);
    }
    return ok;
  }

  function resolveNodeDarkLordPressure() {
    if (!hasNodeMap()) return;
    let corrupted = 0;
    nodeIds().forEach(id => {
      const state = nodeState(id);
      state.noise = Math.max(0, (state.noise || 0) - 1);
      state.danger = Math.max(0, (state.danger || 0) - 1);
      (state.threats || []).forEach(threatId => {
        const threat = DARK_THREATS?.[threatId];
        if (!threat) return;
        state.corruption = clamp((state.corruption || 0) + (threat.corruptionPerRound || 0), 0, 8);
        if (threat.noisePerRound) addNoiseToNode?.(id, threat.noisePerRound);
      });
      if ((state.corruption || 0) >= 3) corrupted += 1;
    });
    if (corrupted) {
      const gain = Math.min(4, Math.ceil(corrupted / 2));
      game.darkLord.evilEnergy = Math.min(game.darkLord.maxEvilEnergy, game.darkLord.evilEnergy + gain);
      game.log.unshift(`Corrupted village nodes feed the Dark Lord +${gain} Evil Energy.`);
    }
  }

  const baseAddCardToRegionDeck = addCardToRegionDeck;
  window.addCardToRegionDeck = function addCardToRegionDeck(regionId, cardId) {
    baseAddCardToRegionDeck(regionId, cardId);
    seedCardNearPressure(cardId, regionId);
  };
  addCardToRegionDeck = window.addCardToRegionDeck;

  const basePlanCommand = window.chooseAiDarkLordPlan;
  window.chooseNodeAwareDarkLordPlan = function chooseNodeAwareDarkLordPlan() {
    if (!hasNodeMap()) return basePlanCommand?.();
    const visible = game.hero.visibility?.state;
    if (["revealed", "marked", "hunted"].includes(visible)) {
      addThreatNearPressure("grave_bell");
      seedCardNearPressure("hound_pack");
      seedCardNearPressure("sealed_exit");
    } else if (nodeIds().some(id => nodeState(id).noise >= 4)) {
      seedCardNearPressure("scout_sniffs_path");
      addThreatNearPressure("grave_bell");
    } else if ((game.hero.food || 0) >= 3) {
      addThreatNearPressure("plague_well");
      seedCardNearPressure("withered_supplies");
    } else {
      addThreatNearPressure("whispering_idol");
      seedCardNearPressure("scout_sniffs_path");
    }
  };

  const baseResolveDarkLordPlan = resolveDarkLordPlan;
  window.resolveDarkLordPlan = function resolveDarkLordPlan() {
    baseResolveDarkLordPlan();
    resolveNodeDarkLordPressure();
  };
  resolveDarkLordPlan = window.resolveDarkLordPlan;

  Object.assign(window, { scoreNodeForDarkLord, bestDarkLordNode: bestNodeByScore, seedCardNearPressure, addThreatNearPressure, resolveNodeDarkLordPressure });
})();
