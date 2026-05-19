// Village node-web map: equal-size nodes over a background, with tags driving events and encounters.
(() => {
  const SHOW_LEGACY_NODE_PANEL = new URLSearchParams(window.location.search).get("legacyNodePanel") === "1";
  const MAP = {
    id: "village",
    title: "Whispermoor Village",
    startNodeId: "forest_edge_01",
    nodes: {
      forest_edge_01: { label: "Forest Edge", kind: "forest", x: 9, y: 42, tags: ["forest", "route", "escape", "quiet"], connectsTo: ["forest_path_01", "sewer_grate_01", "old_road_01"], eventPool: ["secret_route"], randomPool: ["scout_sniffs_path", "hound_pack"], encounterChance: 10 },
      forest_path_01: { label: "Forest Path", kind: "path", x: 18, y: 34, tags: ["forest", "path", "route"], connectsTo: ["forest_edge_01", "old_road_01", "cottage_row_01"], eventPool: [], randomPool: ["scout_sniffs_path", "bloodroot"], encounterChance: 12 },
      old_road_01: { label: "Old Road", kind: "road", x: 27, y: 43, tags: ["road", "village", "exposed"], connectsTo: ["forest_edge_01", "forest_path_01", "market_gate_01", "well_path_01", "cottage_row_01"], eventPool: ["secret_route"], randomPool: ["watch_patrol", "sealed_exit", "scout_sniffs_path"], encounterChance: 18 },
      cottage_row_01: { label: "Cottage Row", kind: "road", x: 39, y: 30, tags: ["road", "house", "village"], connectsTo: ["old_road_01", "sleeping_cottage_01", "sleeping_cottage_02", "baker_lane_01"], eventPool: [], randomPool: ["watch_patrol", "false_cache"], encounterChance: 15 },
      sleeping_cottage_01: { label: "Sleeping Cottage", kind: "house", x: 37, y: 18, tags: ["house", "stealth", "food", "theft"], connectsTo: ["cottage_row_01", "back_lane_01"], eventPool: ["village_house_window", "inside_sleeping_house"], randomPool: ["false_cache", "watch_patrol"], encounterChance: 25 },
      sleeping_cottage_02: { label: "Dark Cottage", kind: "house", x: 48, y: 22, tags: ["house", "dark", "search", "food"], connectsTo: ["cottage_row_01", "baker_lane_01", "back_lane_01"], eventPool: ["apothecary_drawer", "village_house_window"], randomPool: ["rot_luck", "withered_supplies"], encounterChance: 20 },
      baker_lane_01: { label: "Baker Lane", kind: "alley", x: 55, y: 31, tags: ["alley", "house", "food", "route"], connectsTo: ["cottage_row_01", "sleeping_cottage_02", "baker_house_01", "back_lane_01"], eventPool: [], randomPool: ["watch_patrol"], encounterChance: 14 },
      baker_house_01: { label: "Baker House", kind: "house", x: 62, y: 20, tags: ["house", "food", "theft"], connectsTo: ["baker_lane_01", "back_lane_01", "market_back_01"], eventPool: ["baker_backdoor", "hidden_pantry"], randomPool: ["false_cache", "withered_supplies"], encounterChance: 25 },
      back_lane_01: { label: "Back Lane", kind: "alley", x: 65, y: 38, tags: ["alley", "stealth", "route"], connectsTo: ["sleeping_cottage_01", "sleeping_cottage_02", "baker_lane_01", "baker_house_01", "market_back_01", "guard_cut_01"], eventPool: ["quiet_alley"], randomPool: ["scout_sniffs_path", "hound_pack"], encounterChance: 16 },
      market_gate_01: { label: "Market Gate", kind: "road", x: 39, y: 50, tags: ["road", "market", "exposed"], connectsTo: ["old_road_01", "moonlit_market_01", "well_path_01"], eventPool: [], randomPool: ["watch_patrol", "scout_sniffs_path"], encounterChance: 22 },
      moonlit_market_01: { label: "Moonlit Market", kind: "market", x: 52, y: 51, tags: ["market", "theft", "crowd", "search"], connectsTo: ["market_gate_01", "market_back_01", "shrine_cart_01", "guard_cut_01"], eventPool: ["market_stall", "shrine_vendor"], randomPool: ["false_cache", "watch_patrol", "rot_luck"], encounterChance: 28 },
      market_back_01: { label: "Market Back", kind: "alley", x: 61, y: 49, tags: ["alley", "market", "stealth", "route"], connectsTo: ["moonlit_market_01", "back_lane_01", "baker_house_01", "guard_cut_01"], eventPool: [], randomPool: ["scout_sniffs_path", "false_cache"], encounterChance: 18 },
      guard_cut_01: { label: "Guard Cut", kind: "road", x: 72, y: 50, tags: ["road", "guard", "exposed"], connectsTo: ["moonlit_market_01", "market_back_01", "guard_post_01", "kennel_yard_01"], eventPool: [], randomPool: ["watch_patrol", "hound_pack", "sealed_exit"], encounterChance: 30 },
      guard_post_01: { label: "Guard Post", kind: "guard", x: 84, y: 43, tags: ["guard", "combat", "patrol", "exposed"], connectsTo: ["guard_cut_01", "kennel_yard_01"], eventPool: ["guard_post"], randomPool: ["watch_patrol", "hound_pack", "sealed_exit"], encounterChance: 35 },
      kennel_yard_01: { label: "Kennel Yard", kind: "kennel", x: 83, y: 64, tags: ["hounds", "danger", "patrol", "trap"], connectsTo: ["guard_cut_01", "guard_post_01", "shrine_cart_01"], eventPool: ["kennel_yard"], randomPool: ["hound_pack", "snare_path"], encounterChance: 38 },
      well_path_01: { label: "Well Path", kind: "road", x: 35, y: 65, tags: ["road", "well", "exposed"], connectsTo: ["old_road_01", "market_gate_01", "old_stone_well_01", "muddy_bend_01"], eventPool: [], randomPool: ["scout_sniffs_path", "grave_bell"], encounterChance: 18 },
      old_stone_well_01: { label: "Old Stone Well", kind: "well", x: 25, y: 75, tags: ["well", "dark", "tunnel", "water"], connectsTo: ["well_path_01", "sewer_grate_01", "chapel_path_01", "muddy_bend_01"], eventPool: ["well_bucket"], randomPool: ["plague_well", "whispering_idol"], encounterChance: 24 },
      sewer_grate_01: { label: "Sewer Grate", kind: "sewer", x: 10, y: 66, tags: ["sewer", "route", "escape", "dark"], connectsTo: ["forest_edge_01", "old_stone_well_01", "root_tunnel_01"], eventPool: ["sewer_grate", "drain_crawl"], randomPool: ["hound_pack", "bloodroot"], encounterChance: 20 },
      root_tunnel_01: { label: "Root Tunnel", kind: "path", x: 17, y: 86, tags: ["tunnel", "forest", "escape", "dark"], connectsTo: ["sewer_grate_01", "muddy_bend_01"], eventPool: ["secret_tunnel"], randomPool: ["bloodroot", "whispering_idol"], encounterChance: 22 },
      muddy_bend_01: { label: "Muddy Bend", kind: "road", x: 35, y: 88, tags: ["road", "village", "exposed"], connectsTo: ["well_path_01", "old_stone_well_01", "root_tunnel_01", "chapel_path_01"], eventPool: [], randomPool: ["scout_sniffs_path", "sealed_exit"], encounterChance: 18 },
      chapel_path_01: { label: "Chapel Path", kind: "road", x: 51, y: 78, tags: ["road", "shrine", "exposed", "spirit"], connectsTo: ["old_stone_well_01", "muddy_bend_01", "shrine_cart_01"], eventPool: [], randomPool: ["grave_bell", "whispering_idol"], encounterChance: 24 },
      shrine_cart_01: { label: "Shrine Cart", kind: "shrine", x: 65, y: 72, tags: ["shrine", "spirit", "lore", "magic"], connectsTo: ["chapel_path_01", "moonlit_market_01", "kennel_yard_01"], eventPool: ["shrine_vendor"], randomPool: ["grave_bell", "whispering_idol", "rot_luck"], encounterChance: 26 },
    },
  };

  const THREAT_PLACEMENT = {
    plague_well: { validTags: ["well", "sewer", "water"], preferredTags: ["well", "water"] },
    bloodroot: { validTags: ["forest", "road", "path", "route"], preferredTags: ["forest", "road", "route"] },
    grave_bell: { validTags: ["shrine", "market", "road"], preferredTags: ["shrine", "spirit"] },
    whispering_idol: { validTags: ["shrine", "forest", "well", "spirit", "dark"], preferredTags: ["shrine", "spirit"] },
    hound_pack: { validTags: ["road", "forest", "alley", "guard", "kennel"], preferredTags: ["hounds", "patrol", "guard"] },
    sealed_exit: { validTags: ["road", "path", "alley", "sewer", "forest", "route", "escape"], preferredTags: ["route", "escape", "road"] },
  };

  const clampValue = (value, min, max) => Math.max(min, Math.min(max, value));
  const existingCard = (id) => id && cards?.[id];
  const pick = (pool = []) => {
    const valid = pool.filter(existingCard);
    return valid.length ? valid[Math.floor(Math.random() * valid.length)] : null;
  };

  cards.quiet_village_path ||= {
    id: "quiet_village_path",
    title: "Quiet Stretch of Village",
    art: ART.scout,
    badge: "Village Path",
    text: "The lane is quiet for the moment. You can use the map to move toward a more useful node.",
    choices: {
      left: choice("Keep low", "stealth", 1, 1, {
        failure: result("A shutter creaks open nearby.", [noise()]),
        success: result("You keep low and avoid attention.", [status("Hidden")]),
        great: result("You vanish into the village shadows.", [status("Hidden"), time(1)]),
      }, ["stealth", "hide", "route"]),
      right: choice("Listen ahead", "spirit", 1, 1, {
        failure: result("The village whispers back too loudly.", [noise()]),
        success: result("You catch the rhythm of nearby patrols.", [xp("Patience")]),
        great: result("You hear the safest route before you see it.", [xp("Marked Route"), time(1)]),
      }, ["spirit", "patrol", "route"]),
    },
  };

  function ensureNodeState() {
    game.hero.currentNodeId ||= MAP.startNodeId;
    game.hero.lastKnownNodeId ||= null;
    game.mapState ||= {};
    game.mapState.village ||= { nodes: {} };
    Object.keys(MAP.nodes).forEach(id => {
      game.mapState.village.nodes[id] ||= { visited: false, visible: false, noise: 0, danger: 0, corruption: 0, threats: [], seededCards: [] };
    });
    const current = nodeState(game.hero.currentNodeId);
    current.visited = true;
    current.visible = true;
    connectedNodeIds(game.hero.currentNodeId).forEach(id => nodeState(id).visible = true);
  }

  function nodeDef(id) { return MAP.nodes[id]; }
  function nodeState(id) { return game.mapState.village.nodes[id]; }
  function connectedNodeIds(id) { return nodeDef(id)?.connectsTo || []; }
  function isConnected(id) { return connectedNodeIds(game.hero.currentNodeId).includes(id); }
  function moveCost(id) { return nodeDef(id)?.tags?.includes("exposed") ? 2 : 1; }

  function encounterChance(id) {
    const def = nodeDef(id);
    const state = nodeState(id);
    return clampValue((def.encounterChance || 0) + state.noise * 5 + state.danger * 8 + state.corruption * 6 + state.threats.length * 10, 0, 85);
  }

  function bestNodeForCard(cardId, fallbackNodeId = game.hero.currentNodeId) {
    const card = cards?.[cardId];
    const cardTags = [card?.badge, ...(card?.choices?.left?.tags || []), ...(card?.choices?.right?.tags || [])]
      .filter(Boolean)
      .map(tag => String(tag).toLowerCase());
    const candidates = Object.keys(MAP.nodes).map(id => {
      const def = nodeDef(id);
      const overlap = def.tags.filter(tag => cardTags.includes(tag)).length;
      const connectedBonus = connectedNodeIds(fallbackNodeId).includes(id) ? 1 : 0;
      const currentBonus = id === fallbackNodeId ? 2 : 0;
      return { id, score: overlap * 3 + connectedBonus + currentBonus };
    }).sort((a, b) => b.score - a.score);
    return candidates[0]?.score > 0 ? candidates[0].id : fallbackNodeId;
  }

  function seedCardToNode(nodeId, cardId) {
    ensureNodeState();
    if (!nodeDef(nodeId) || !existingCard(cardId)) return false;
    const state = nodeState(nodeId);
    state.seededCards ||= [];
    if (!state.seededCards.includes(cardId)) state.seededCards.push(cardId);
    state.visible = true;
    return true;
  }

  function canPlaceThreatAtNode(threatId, nodeId) {
    const def = nodeDef(nodeId);
    const rules = THREAT_PLACEMENT[threatId];
    if (!def || !rules) return Boolean(def);
    return rules.validTags.some(tag => def.tags.includes(tag));
  }

  function bestNodeForThreat(threatId, fallbackNodeId = game.hero.currentNodeId) {
    const rules = THREAT_PLACEMENT[threatId];
    const candidates = Object.keys(MAP.nodes)
      .filter(id => canPlaceThreatAtNode(threatId, id))
      .map(id => {
        const def = nodeDef(id);
        const state = nodeState(id);
        const preferred = rules?.preferredTags?.filter(tag => def.tags.includes(tag)).length || 0;
        const pressure = state.noise + state.danger + state.corruption;
        const connectedBonus = connectedNodeIds(fallbackNodeId).includes(id) ? 2 : 0;
        const currentBonus = id === fallbackNodeId ? 1 : 0;
        return { id, score: preferred * 4 + pressure + connectedBonus + currentBonus };
      }).sort((a, b) => b.score - a.score);
    return candidates[0]?.id || fallbackNodeId;
  }

  function addThreatToNode(nodeId, threatId) {
    ensureNodeState();
    if (!nodeDef(nodeId) || !canPlaceThreatAtNode(threatId, nodeId)) return false;
    const state = nodeState(nodeId);
    state.threats ||= [];
    if (!state.threats.includes(threatId)) state.threats.push(threatId);
    const cardId = DARK_THREATS?.[threatId]?.cardId;
    if (cardId) seedCardToNode(nodeId, cardId);
    state.visible = true;
    return true;
  }

  function addNoiseToNode(id, amount = 1) {
    const state = nodeState(id);
    if (!state) return;
    state.noise = clampValue(state.noise + amount, 0, 10);
    connectedNodeIds(id).forEach(adjacent => {
      const adjacentState = nodeState(adjacent);
      adjacentState.noise = clampValue(adjacentState.noise + Math.ceil(amount / 3), 0, 10);
    });
    game.hero.lastKnownNodeId = id;
    if (state.noise >= 7 && game.hero.visibility) {
      game.hero.visibility.state = "revealed";
      game.hero.visibility.lastKnownNodeId = id;
    } else if (state.noise >= 4 && game.hero.visibility?.state === "hidden") {
      game.hero.visibility.state = "suspected";
      game.hero.visibility.lastKnownNodeId = id;
    }
  }

  function drawCardForNode(id) {
    ensureNodeState();
    const def = nodeDef(id);
    const state = nodeState(id);
    const seeded = state.seededCards || [];
    const threatCards = (state.threats || []).map(threatId => DARK_THREATS?.[threatId]?.cardId).filter(Boolean);
    const direct = pick([...seeded, ...threatCards, ...(def.eventPool || [])]);
    if (direct) return direct;
    if (Math.random() * 100 < encounterChance(id)) return pick(def.randomPool || []) || "quiet_village_path";
    return "quiet_village_path";
  }

  function moveHeroToNode(id) {
    ensureNodeState();
    if (!nodeDef(id) || !isConnected(id) || game.awaitingResultAck) return false;
    game.hero.currentNodeId = id;
    nodeState(id).visited = true;
    nodeState(id).visible = true;
    connectedNodeIds(id).forEach(next => nodeState(next).visible = true);
    game.heroTimer = Math.max(0, game.heroTimer - moveCost(id));
    const cardId = drawCardForNode(id);
    game.currentCardId = cardId || "quiet_village_path";
    game.result = `Moved to ${nodeDef(id).label}.`;
    game.log.unshift(`Moved to ${nodeDef(id).label}.`);
    render();
    return true;
  }

  function renderReachableNodes(currentId) {
    const buttons = connectedNodeIds(currentId).map(id => {
      const def = nodeDef(id);
      const state = nodeState(id);
      const chance = encounterChance(id);
      const pressure = state.noise >= 7 ? "Alarm" : state.noise >= 4 ? "Noise" : state.threats.length ? "Threat" : "Clear";
      const tags = def.tags.slice(0, 2).map(tag => `<i>${tag}</i>`).join("");
      return `<button class="gd-node-destination ${def.kind}" data-node-id="${id}" ${game.awaitingResultAck ? "disabled" : ""}><strong>${def.label}</strong><span>-${moveCost(id)}s · ${chance}%</span><em>${pressure}</em><small>${tags}</small></button>`;
    }).join("");
    return `<div class="gd-node-destinations">${buttons}</div>`;
  }

  function renderVillageNodeMap() {
    ensureNodeState();
    const currentId = game.hero.currentNodeId;
    const lines = Object.entries(MAP.nodes).flatMap(([id, def]) => def.connectsTo
      .filter(target => id < target)
      .map(target => {
        const a = def;
        const b = nodeDef(target);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        return `<i class="gd-map-edge" style="left:${a.x}%;top:${a.y}%;width:${length}%;transform:rotate(${angle}deg)"></i>`;
      }));
    const nodes = Object.entries(MAP.nodes).map(([id, def]) => {
      const state = nodeState(id);
      const current = id === currentId;
      const reachable = isConnected(id);
      const visible = state.visible || current || reachable;
      const pressure = state.noise >= 7 ? "loud" : state.noise >= 4 ? "noisy" : state.threats.length ? "threat" : "";
      return `<button class="gd-map-node ${def.kind} ${current ? "current" : ""} ${reachable ? "reachable" : ""} ${visible ? "visible" : "hidden"} ${pressure}" data-node-id="${id}" style="left:${def.x}%;top:${def.y}%" ${reachable && !game.awaitingResultAck ? "" : "disabled"} title="${def.label}\n${def.tags.join(", ")}"><span></span></button>`;
    }).join("");
    const current = nodeDef(currentId);
    const state = nodeState(currentId);
    const tags = current.tags.slice(0, 3).map(tag => `<b>${tag}</b>`).join("");
    const pressure = `Noise ${state.noise} · Danger ${state.danger} · ${encounterChance(currentId)}%`;
    return `<section class="gd-node-map-panel"><div class="gd-node-map-head"><div><strong>${MAP.title}</strong><small>${current.label}</small></div><div class="gd-node-tags">${tags}</div></div><div class="gd-node-map" style="background-image:linear-gradient(#05060588,#050605c5),url('${ART.scout}')">${lines.join("")}${nodes}</div><div class="gd-node-current-readout"><span>${pressure}</span><span>${state.threats.length ? `Threats: ${state.threats.length}` : "No active threat"}</span></div>${renderReachableNodes(currentId)}</section>`;
  }

  const baseApplyRewards = applyRewards;
  window.applyRewards = function applyRewards(rewards = []) {
    const ghosts = baseApplyRewards(rewards);
    rewards.forEach(reward => {
      if (reward.type === "noise") addNoiseToNode(game.hero.currentNodeId, reward.amount || 1);
      if (reward.type === "nodeNoise") addNoiseToNode(reward.nodeId || game.hero.currentNodeId, reward.amount || 1);
      if (reward.type === "nodeCard") seedCardToNode(reward.nodeId || bestNodeForCard(reward.cardId), reward.cardId);
      if (reward.type === "nodeThreat") addThreatToNode(reward.nodeId || bestNodeForThreat(reward.threatId), reward.threatId);
      if (reward.type === "regionCard") seedCardToNode(bestNodeForCard(reward.cardId), reward.cardId);
      if (reward.type === "moveNode") moveHeroToNode(reward.nodeId);
    });
    return ghosts;
  };
  applyRewards = window.applyRewards;

  window.drawNextCardId = function drawNextCardId() {
    return drawCardForNode(game.hero.currentNodeId || MAP.startNodeId);
  };
  drawNextCardId = window.drawNextCardId;

  if (SHOW_LEGACY_NODE_PANEL) {
    const baseRenderExplore = renderExplore;
    window.renderExplore = function renderExplore() {
      const html = baseRenderExplore();
      return html.replace(`<section class="gd-region-header">`, `${renderVillageNodeMap()}<section class="gd-region-header">`);
    };
    renderExplore = window.renderExplore;

    const baseBindEvents = bindEvents;
    window.bindEvents = function bindEvents() {
      baseBindEvents();
      document.querySelectorAll("[data-node-id]").forEach(button => {
        button.addEventListener("click", () => moveHeroToNode(button.dataset.nodeId));
      });
    };
    bindEvents = window.bindEvents;
  }

  window.nodeCard = function nodeCard(nodeId, cardId) { return { type: "nodeCard", nodeId, cardId }; };
  window.nodeThreat = function nodeThreat(nodeId, threatId) { return { type: "nodeThreat", nodeId, threatId }; };
  window.nodeNoise = function nodeNoise(nodeId, amount = 1) { return { type: "nodeNoise", nodeId, amount }; };
  window.moveNode = function moveNode(nodeId) { return { type: "moveNode", nodeId }; };

  Object.assign(window, { VILLAGE_NODE_MAP: MAP, ensureNodeState, moveHeroToNode, drawCardForNode, addNoiseToNode, seedCardToNode, addThreatToNode, bestNodeForCard, bestNodeForThreat, renderVillageNodeMap });
  ensureNodeState();
  render?.();
})();