// Hidden-map card flow prototype.
// The encounter flow authors the village run; the hidden node map supplies location context underneath.
(() => {
  const params = new URLSearchParams(window.location.search);
  const visibleMapMode = params.get("mapExplore") === "1" || params.get("mapCalibrate") === "1";
  if (visibleMapMode) {
    document.documentElement.classList.add("village-flow-ready");
    return;
  }

  const READY_FLAG = "HIDDEN_MAP_CARD_FLOW";
  if (window[READY_FLAG]) {
    document.documentElement.classList.add("village-flow-ready");
    return;
  }

  const START_CARD_ID = "village_outskirts";
  const PASS_THROUGH = /road|path|trail|gate|lane|crossing|turn|forest|stream|hedge/;
  const CLEAR_NODE_AFTER_CARDS = new Set([
    "inside_sleeping_house",
    "hidden_pantry",
    "drain_crawl",
  ]);

  function addEncounterCards() {
    cards.village_outskirts ||= {
      id: "village_outskirts",
      title: "Village Outskirts",
      badge: "Encounter Entry",
      art: ART.scout,
      text: "The village lies ahead under shuttered windows and crooked moonlight. Smoke crawls from chimneys. Somewhere inside, food, coin, and danger wait.",
      choices: {
        left: choice("Take the ditch line", "stealth", 2, 2, {
          failure: result("A loose stone clicks down the ditch. Something ahead stops breathing.", [noise()]),
          success: result("You crawl low through nettles and reach the old road unseen.", [status("Hidden"), xp("Clean Entry")]),
          great: result("You find a hedge gap that skips the open road entirely.", [status("Hidden"), time(1), xp("Hedge Gap")]),
        }, ["stealth", "entry", "route"]),
        right: choice("Watch the patrol lamps", "spirit", 2, 2, {
          failure: result("You misread the lamps. A Scout turns its nose toward you.", [noise()]),
          success: result("The lamp pattern reveals a safe moment to cross.", [xp("Patrol Rhythm")]),
          great: result("You catch the village rhythm perfectly and slip toward the cottages.", [time(2), status("Hidden")]),
        }, ["patrol", "entry", "route"]),
      },
    };

    cards.old_road_entry ||= {
      id: "old_road_entry",
      title: "Old Road into the Village",
      badge: "Approach",
      art: ART.scout,
      text: "Cart ruts cut through the mud toward the first cottages. The road is open, but fences and hedges offer broken cover.",
      choices: {
        left: choice("Slip along the hedges", "stealth", 3, 3, {
          failure: result("A sleeping bird bursts from the hedge and gives you away.", [noise()]),
          success: result("You move from hedge to hedge until the cottages crowd around you.", [status("Hidden"), xp("Hedge Walker")]),
          great: result("A hidden side lane carries you past the worst of the road.", [status("Hidden"), time(2), xp("Side Lane")]),
        }, ["stealth", "road", "route"]),
        right: choice("Read the muddy tracks", "survival", 3, 3, {
          failure: result("You follow the freshest tracks straight toward trouble.", [noise()]),
          success: result("The tracks show which doors are still asleep.", [xp("Village Tracks")]),
          great: result("You find a quiet cottage with a crooked lock and no dog prints.", [time(1), xp("Soft Target")]),
        }, ["survival", "road", "house"]),
      },
    };

    cards.cottage_row_entry ||= {
      id: "cottage_row_entry",
      title: "Cottage Row",
      badge: "Infiltration Choice",
      art: ART.scout,
      text: "Low cottages lean over the lane. One warm window glows. One crooked door hangs loose. Somewhere a kettle ticks itself cold.",
      choices: {
        left: choice("Try the warm window", "stealth", 3, 3, {
          failure: result("A curtain twitches before you even touch the sill.", [noise()]),
          success: result("The window sits low enough for a small thief.", [xp("Chosen Window")]),
          great: result("You spot the sleeping pattern inside before touching the latch.", [status("Hidden"), time(1)]),
        }, ["stealth", "house", "entry"]),
        right: choice("Try the crooked door", "cunning", 3, 3, {
          failure: result("The door hinge squeals into the lane.", [noise()]),
          success: result("The crooked door has an old lock and a weak frame.", [xp("Weak Door")]),
          great: result("You find the cottage key tucked beneath a loose stone.", [item("House Key"), time(1)]),
        }, ["cunning", "house", "lock"]),
      },
    };

    cards.market_back_exit ||= {
      id: "market_back_exit",
      title: "Market Back Exit",
      badge: "Encounter Exit",
      art: ART.scout,
      text: "Behind the market, barrels and hanging tarps make a crooked path out of sight. You can vanish with what you have, or mark the way for another run.",
      choices: {
        left: choice("Fade into the alleys", "stealth", 2, 2, {
          failure: result("A bottle rolls under your foot as you leave. The village wakes behind you.", [noise()]),
          success: result("You melt into the alleys with your haul intact.", [status("Hidden"), xp("Clean Exit")]),
          great: result("You leave no trail and gain a perfect line back in.", [status("Hidden"), time(2), xp("Clean Exit")]),
        }, ["stealth", "exit", "route"]),
        right: choice("Mark the return path", "cunning", 2, 2, {
          failure: result("Your mark is too obvious. Someone will notice it soon.", [noise()]),
          success: result("You scratch a subtle sign into the barrel hoop.", [xp("Marked Route")]),
          great: result("You leave a hidden mark only the party will read.", [xp("Marked Route"), time(1), status("Hidden")]),
        }, ["cunning", "exit", "mark"]),
      },
    };

    ["village_outskirts", "old_road_entry", "cottage_row_entry", "market_back_exit"].forEach(id => {
      if (!villageStartingDeck.includes(id)) villageStartingDeck.push(id);
      const deck = game?.regions?.village?.deck;
      if (deck && !deck.includes(id)) deck.push(id);
    });
  }

  const FLOW_STEPS = {
    village_outskirts: { encounterId: "village_infiltration", role: "entry", nodeId: "forest_edge_01", place: "Forest Edge", beat: "Village Edge", next: { left: { success: "old_road_entry", great: "cottage_row_entry", failure: "scout_sniffs_path" }, right: { success: "old_road_entry", great: "cottage_row_entry", failure: "scout_sniffs_path" } } },
    old_road_entry: { encounterId: "village_infiltration", role: "approach", nodeId: "old_road_01", place: "Old Road", beat: "Approach", next: { left: { success: "cottage_row_entry", great: "quiet_alley", failure: "scout_sniffs_path" }, right: { success: "cottage_row_entry", great: "locked_cottage", failure: "angry_villager" } } },
    cottage_row_entry: { encounterId: "village_infiltration", role: "choice", nodeId: "cottage_row_01", place: "Cottage Row", beat: "Choose a Door", next: { left: { success: "village_house_window", great: "village_house_window", failure: "angry_villager" }, right: { success: "locked_cottage", great: "locked_cottage", failure: "scout_sniffs_path" } } },
    village_house_window: { encounterId: "village_infiltration", role: "threshold", nodeId: "sleeping_cottage_01", place: "Sleeping Cottage", beat: "Window", next: { left: { success: "inside_sleeping_house", great: "inside_sleeping_house", failure: "angry_villager" }, right: { success: "quiet_alley", great: "old_rooftops", failure: "scout_sniffs_path" } } },
    locked_cottage: { encounterId: "village_infiltration", role: "threshold", nodeId: "sleeping_cottage_02", place: "Locked Cottage", beat: "Crooked Door", next: { left: { success: "inside_sleeping_house", great: "inside_sleeping_house", failure: "angry_villager" }, right: { success: "quiet_alley", great: "cellar_route", failure: "scout_sniffs_path" } } },
    inside_sleeping_house: { encounterId: "village_infiltration", role: "interior", nodeId: "sleeping_cottage_01", place: "Inside Cottage", beat: "Room", next: { left: { success: "quiet_alley", great: "quiet_alley", failure: "angry_villager" }, right: { success: "quiet_alley", great: "cellar_route", failure: "scout_sniffs_path" } } },
    angry_villager: { encounterId: "village_infiltration", role: "complication", nodeId: "cottage_row_01", place: "Cottage Row", beat: "Alarm", next: { left: { success: "quiet_alley", great: "quiet_alley", failure: "scout_sniffs_path" }, right: { success: "quiet_alley", great: "market_back_exit", failure: "scout_sniffs_path" } } },
    scout_sniffs_path: { encounterId: "village_infiltration", role: "complication", nodeId: "old_road_01", place: "Old Road", beat: "Patrol", next: { left: { success: "cottage_row_entry", great: "quiet_alley", failure: "angry_villager" }, right: { success: "quiet_alley", great: "quiet_alley", failure: "angry_villager" } } },
    quiet_alley: { encounterId: "village_infiltration", role: "exit", nodeId: "back_lane_01", place: "Back Lane", beat: "Alley", next: { left: { success: "market_stall", great: "old_rooftops", failure: "scout_sniffs_path" }, right: { success: "market_stall", great: "market_back_exit", failure: "angry_villager" } } },
    cellar_route: { encounterId: "village_infiltration", role: "shortcut", nodeId: "back_lane_01", place: "Cellar Route", beat: "Hidden Passage", next: { left: { success: "market_back_exit", great: "market_back_exit", failure: "scout_sniffs_path" }, right: { success: "market_back_exit", great: "market_back_exit", failure: "angry_villager" } } },
    market_stall: { encounterId: "village_infiltration", role: "payoff", nodeId: "moonlit_market_01", place: "Moonlit Market", beat: "Stall", next: { left: { success: "market_back_exit", great: "market_back_exit", failure: "angry_villager" }, right: { success: "well_bucket", great: "old_rooftops", failure: "scout_sniffs_path" } } },
    old_rooftops: { encounterId: "village_infiltration", role: "shortcut", nodeId: "market_back_01", place: "Rooftops", beat: "High Path", next: { left: { success: "market_back_exit", great: "market_back_exit", failure: "scout_sniffs_path" }, right: { success: "market_back_exit", great: "market_back_exit", failure: "angry_villager" } } },
    well_bucket: { encounterId: "village_infiltration", role: "detour", nodeId: "old_stone_well_01", place: "Old Stone Well", beat: "Well", next: { left: { success: "market_back_exit", great: "market_back_exit", failure: "scout_sniffs_path" }, right: { success: "market_back_exit", great: "market_back_exit", failure: "angry_villager" } } },
    market_back_exit: { encounterId: "village_infiltration", role: "exit", nodeId: "market_back_01", place: "Market Back", beat: "Exit", endsEncounter: true, next: { left: { success: "village_outskirts", great: "village_outskirts", failure: "scout_sniffs_path" }, right: { success: "village_outskirts", great: "village_outskirts", failure: "scout_sniffs_path" } } },
  };

  const ROLE_LABELS = { entry: "Entry", approach: "Approach", choice: "Branch", threshold: "Threshold", interior: "Interior", complication: "Complication", exit: "Exit", shortcut: "Shortcut", payoff: "Payoff", detour: "Detour" };
  function map() { return window.VILLAGE_NODE_MAP; }
  function nodes() { return map()?.nodes || {}; }
  function nodeDef(id) { return nodes()[id] || null; }
  function currentNodeId() { return game?.hero?.currentNodeId && nodeDef(game.hero.currentNodeId) ? game.hero.currentNodeId : map()?.startNodeId; }
  function connected(id) { return nodeDef(id)?.connectsTo || []; }
  function state(id) { return game?.mapState?.village?.nodes?.[id] || null; }
  function valid(ids) { return [...new Set((ids || []).filter(id => id && cards?.[id]))]; }
  function pick(ids) { const pool = valid(ids); return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null; }
  function flowStep(cardId) { return FLOW_STEPS[cardId] || null; }
  function flowNodeForCard(cardId, fallbackNodeId = currentNodeId()) { return flowStep(cardId)?.nodeId && nodeDef(flowStep(cardId).nodeId) ? flowStep(cardId).nodeId : fallbackNodeId; }
  function resetEncounterFlow(startFresh = false) { const run = (game.villageEncounter?.run || 0) + (startFresh ? 1 : 0); game.villageEncounter = { encounterId: "village_infiltration", run, trail: ["Forest Edge"], phase: "entry", pressure: 0, completed: false }; game.villageCardFlow = { routeId: "village_infiltration", trail: ["Forest Edge"], role: "Entry", beat: "Village Edge" }; }
  function ensureFlowState() { if (!game.villageEncounter || !game.villageCardFlow) resetEncounterFlow(false); game.villageCardFlow.trail ||= ["Forest Edge"]; game.villageEncounter.trail ||= ["Forest Edge"]; }
  function startAtVillageEntry(force = false) { addEncounterCards(); ensureFlowState(); if (force || !game.villageEncounter.started) { game.currentCardId = START_CARD_ID; game.pendingNextCardId = null; game.hero.currentNodeId = flowNodeForCard(START_CARD_ID, map()?.startNodeId); game.villageEncounter.started = true; rememberFlowCard(START_CARD_ID, game.hero.currentNodeId); } }
  function rememberFlowCard(cardId, nodeId = null) { ensureFlowState(); const step = flowStep(cardId); const node = nodeDef(nodeId || step?.nodeId || currentNodeId()); const place = step?.place || node?.label || "Village"; const trail = game.villageCardFlow.trail || []; if (step?.role === "entry" && cardId === START_CARD_ID) trail.length = 0; if (trail[trail.length - 1] !== place) trail.push(place); game.villageCardFlow.trail = trail.slice(-4); game.villageCardFlow.routeId = step?.encounterId || game.villageCardFlow.routeId || "village_infiltration"; game.villageCardFlow.role = ROLE_LABELS[step?.role] || "Village"; game.villageCardFlow.beat = step?.beat || cards?.[cardId]?.title || "Event"; game.villageEncounter.phase = step?.role || game.villageEncounter.phase; game.villageEncounter.trail = [...game.villageCardFlow.trail]; game.villageEncounter.completed = Boolean(step?.endsEncounter); }
  function chooseFlowNextCard(cardId, side, outcomeType) { const step = flowStep(cardId); const outcomeMap = step?.next?.[side] || step?.next?.any; const nextCardId = outcomeMap?.[outcomeType] || outcomeMap?.default; return cards?.[nextCardId] ? nextCardId : null; }
  function renderFlowBreadcrumb() { ensureFlowState(); const flow = game.villageCardFlow; const trail = (flow.trail || ["Village"]).slice(-3); const crumbs = trail.map(label => `<span>${label}</span>`).join(`<i>›</i>`); return `<section class="gd-route-breadcrumb"><div class="gd-route-crumbs">${crumbs}</div><div class="gd-route-role"><b>${flow.role || "Village"}</b><small>${flow.beat || "Event"}</small></div></section>`; }
  function threatCards(id) { const s = state(id); return valid((s?.threats || []).map(threatId => DARK_THREATS?.[threatId]?.cardId)); }
  function normalCards(id) { const node = nodeDef(id); const s = state(id); if (!node) return []; if (s?.nonDarkLordEventsDisabled) return threatCards(id); return valid([...(s?.seededCards || []), ...threatCards(id), ...(node.eventPool || []), ...(node.randomPool || [])]); }
  function drawCardForHiddenNode(id) { return pick(normalCards(id)) || pick(villageStartingDeck || []); }
  function nodeMatchesCard(id, cardId) { const node = nodeDef(id); const card = cards?.[cardId]; return Boolean(node && card?.locationTypes?.includes(node.locationType)); }
  function findNodeForCard(cardId) { const flowNode = flowNodeForCard(cardId, null); if (flowNode && nodeDef(flowNode)) return flowNode; const matching = Object.keys(nodes()).filter(id => nodeMatchesCard(id, cardId)); return matching.find(id => !PASS_THROUGH.test(nodeDef(id)?.locationType || "")) || matching[0] || currentNodeId(); }
  function scoreMoveTarget(id, choiceData, outcomeType) { const node = nodeDef(id); if (!node) return -999; const location = `${node.locationType || ""} ${node.kind || ""} ${(node.traits || []).join(" ")}`; const tags = new Set(choiceData?.tags || []); let score = 1; if (outcomeType === "failure") score -= 1; if (outcomeType === "great") score += 1; if (tags.has("route") || tags.has("escape") || tags.has("avoid")) { if (PASS_THROUGH.test(location)) score += 4; if (/alley|back-lane|trail|path|gate/.test(location)) score += 2; } if (tags.has("stealth") || tags.has("hide")) { if (/alley|back|hedge|forest|trail|cottage/.test(location)) score += 3; if (/guard|watch|market-square/.test(location)) score -= 2; } if (tags.has("food")) { if (/bakery|flour|pantry|cottage|market/.test(location)) score += 3; } if (tags.has("theft") || tags.has("lock") || tags.has("search")) { if (/market|cottage|bakery|shed|well|house/.test(location)) score += 2; } if (tags.has("combat") || tags.has("scout") || tags.has("patrol")) { if (/guard|watch|kennel|road|gate/.test(location)) score += 3; } if (tags.has("spirit") || tags.has("magic") || tags.has("lore")) { if (/chapel|shrine|grave|wayside/.test(location)) score += 4; } if (tags.has("dark") || tags.has("tunnel") || tags.has("climb")) { if (/sewer|drain|tunnel|well/.test(location)) score += 4; } const nodeCards = normalCards(id); if (nodeCards.length) score += 2; if (state(id)?.nonDarkLordEventsDisabled && !threatCards(id).length) score -= 5; return score + Math.random() * 0.5; }
  function chooseNextNode(fromId, choiceData, outcomeType) { const from = nodeDef(fromId); if (!from) return currentNodeId(); const candidates = connected(fromId).filter(nodeDef); if (!candidates.length) return fromId; return candidates.map(id => ({ id, score: scoreMoveTarget(id, choiceData, outcomeType) })).sort((a, b) => b.score - a.score)[0]?.id || fromId; }
  function markNodeSpent(id, cardId) { const s = state(id); if (!s) return; s.nonDarkLordEventsDisabled = true; s.normalEventSpent = true; s.completedEventCardIds ||= []; if (cardId && !s.completedEventCardIds.includes(cardId)) s.completedEventCardIds.push(cardId); }
  function installRenderExploreWrapper() { const baseRenderExplore = window.renderExplore || renderExplore; if (!baseRenderExplore || baseRenderExplore.__villageFlowWrapped) return false; const wrapped = function renderExploreWithVillageFlow(...args) { rememberFlowCard(game.currentCardId, game.hero?.currentNodeId); const html = baseRenderExplore.apply(this, args); if (html.includes("gd-route-breadcrumb")) return html; return html.replace(`<section class="gd-region-header">`, `${renderFlowBreadcrumb()}<section class="gd-region-header">`); }; wrapped.__villageFlowWrapped = true; window.renderExplore = wrapped; try { renderExplore = wrapped; } catch (_) {} return true; }
  function installChooseWrapper() { const baseChoose = window.choose || choose; if (!baseChoose || baseChoose.__hiddenMapWrapped) return false; const wrapped = function chooseWithHiddenMap(side) { if (game.heroTimer <= 0 || game.awaitingResultAck) return; const cardId = game.currentCardId; const card = cards[cardId]; const choiceData = card?.choices?.[side]; const nodeId = currentNodeId(); baseChoose(side); const outcomeType = game.lastAction?.outcomeType; if (!outcomeType || !choiceData) return; const flowNextCardId = chooseFlowNextCard(cardId, side, outcomeType); if (flowNextCardId && cards[flowNextCardId]) { const nextNodeId = flowNodeForCard(flowNextCardId, chooseNextNode(nodeId, choiceData, outcomeType)); game.pendingNextCardId = flowNextCardId; game.hiddenMapPendingMove = { fromNodeId: nodeId, toNodeId: nextNodeId, cardId, nextCardId: flowNextCardId, chain: false, flow: true }; game.log.unshift(`Village encounter: ${cards[cardId]?.title || "Event"} → ${cards[flowNextCardId].title}.`); return; } const nextNodeId = chooseNextNode(nodeId, choiceData, outcomeType); const nextCardId = drawCardForHiddenNode(nextNodeId) || drawNextCardId(); game.pendingNextCardId = nextCardId; game.hiddenMapPendingMove = { fromNodeId: nodeId, toNodeId: flowNodeForCard(nextCardId, nextNodeId), cardId, nextCardId, chain: false }; game.log.unshift(`Hidden map: ${nodeDef(nodeId)?.label || "Node"} → ${nodeDef(nextNodeId)?.label || "Node"}.`); }; wrapped.__hiddenMapWrapped = true; window.choose = wrapped; try { choose = wrapped; } catch (_) {} return true; }
  function installAckWrapper() { const baseAck = window.acknowledgeResult || acknowledgeResult; if (!baseAck || baseAck.__hiddenMapWrapped) return false; const wrapped = function acknowledgeHiddenMapResult(...args) { const move = game.hiddenMapPendingMove; if (move) { game.hero.currentNodeId = move.toNodeId; rememberFlowCard(move.nextCardId, move.toNodeId); } const result = baseAck.apply(this, args); if (move && !game.awaitingResultAck) { if (!move.chain || CLEAR_NODE_AFTER_CARDS.has(move.cardId)) markNodeSpent(move.fromNodeId, move.cardId); if (flowStep(move.cardId)?.endsEncounter && game.currentCardId === START_CARD_ID) resetEncounterFlow(true); game.hiddenMapPendingMove = null; syncPartyHeroSummary?.(); } return result; }; wrapped.__hiddenMapWrapped = true; window.acknowledgeResult = wrapped; try { acknowledgeResult = wrapped; } catch (_) {} return true; }
  function installResetWrapper() { const baseReset = window.resetGame || resetGame; if (!baseReset || baseReset.__villageEncounterWrapped) return true; const wrapped = function resetWithVillageEncounter(...args) { const result = baseReset.apply(this, args); resetEncounterFlow(false); startAtVillageEntry(true); render?.(); return result; }; wrapped.__villageEncounterWrapped = true; window.resetGame = wrapped; try { resetGame = wrapped; } catch (_) {} return true; }
  function install(attempt = 0) { if (!window.VILLAGE_NODE_MAP?.nodes || typeof cards === "undefined" || typeof renderExplore !== "function") { if (attempt < 30) setTimeout(() => install(attempt + 1), 40); else document.documentElement.classList.add("village-flow-ready"); return; } addEncounterCards(); ensureNodeState?.(); ensureFlowState(); startAtVillageEntry(!game.villageEncounter?.started); const renderReady = installRenderExploreWrapper(); const chooseReady = installChooseWrapper(); const ackReady = installAckWrapper(); const resetReady = installResetWrapper(); window[READY_FLAG] = renderReady && chooseReady && ackReady && resetReady; game.hiddenMapMode = true; game.activeEncounter = null; game.pendingNodeMove = null; game.eventTransition = null; render?.(); document.documentElement.classList.add("village-flow-ready"); }
  install();
})();