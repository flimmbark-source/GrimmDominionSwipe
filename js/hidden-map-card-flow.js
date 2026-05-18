// Hidden-map card flow prototype.
// Default Explore stays as the original swipe/card screen, while the node map quietly
// chooses the next location/card underneath. Visible map testing remains available with
// ?mapExplore=1 or ?mapCalibrate=1.
(() => {
  const params = new URLSearchParams(window.location.search);
  const visibleMapMode = params.get("mapExplore") === "1" || params.get("mapCalibrate") === "1";
  if (visibleMapMode) return;

  const READY_FLAG = "HIDDEN_MAP_CARD_FLOW";
  if (window[READY_FLAG]) return;

  const PASS_THROUGH = /road|path|trail|gate|lane|crossing|turn|forest|stream|hedge/;
  const CLEAR_NODE_AFTER_CARDS = new Set([
    "inside_sleeping_house",
    "hidden_pantry",
    "drain_crawl",
  ]);

  const PASS_ONE_CHAINS = {
    village_house_window: {
      left: { success: "inside_sleeping_house", great: "inside_sleeping_house" },
    },
    baker_backdoor: {
      left: { success: "hidden_pantry", great: "hidden_pantry" },
    },
    sewer_grate: {
      left: { success: "drain_crawl", great: "drain_crawl" },
    },
  };

  function map() { return window.VILLAGE_NODE_MAP; }
  function nodes() { return map()?.nodes || {}; }
  function nodeDef(id) { return nodes()[id] || null; }
  function currentNodeId() {
    return game?.hero?.currentNodeId && nodeDef(game.hero.currentNodeId)
      ? game.hero.currentNodeId
      : map()?.startNodeId;
  }
  function connected(id) { return nodeDef(id)?.connectsTo || []; }
  function state(id) { return game?.mapState?.village?.nodes?.[id] || null; }
  function valid(ids) { return [...new Set((ids || []).filter(id => id && cards?.[id]))]; }
  function pick(ids) { const pool = valid(ids); return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null; }

  function threatCards(id) {
    const s = state(id);
    return valid((s?.threats || []).map(threatId => DARK_THREATS?.[threatId]?.cardId));
  }

  function normalCards(id) {
    const node = nodeDef(id);
    const s = state(id);
    if (!node) return [];
    if (s?.nonDarkLordEventsDisabled) return threatCards(id);
    return valid([...(s?.seededCards || []), ...threatCards(id), ...(node.eventPool || []), ...(node.randomPool || [])]);
  }

  function drawCardForHiddenNode(id) {
    return pick(normalCards(id)) || pick(villageStartingDeck || []);
  }

  function nodeMatchesCard(id, cardId) {
    const node = nodeDef(id);
    const card = cards?.[cardId];
    return Boolean(node && card?.locationTypes?.includes(node.locationType));
  }

  function findNodeForCard(cardId) {
    const matching = Object.keys(nodes()).filter(id => nodeMatchesCard(id, cardId));
    return matching.find(id => !PASS_THROUGH.test(nodeDef(id)?.locationType || "")) || matching[0] || currentNodeId();
  }

  function scoreMoveTarget(id, choiceData, outcomeType) {
    const node = nodeDef(id);
    if (!node) return -999;
    const location = `${node.locationType || ""} ${node.kind || ""} ${(node.traits || []).join(" ")}`;
    const tags = new Set(choiceData?.tags || []);
    let score = 1;

    if (outcomeType === "failure") score -= 1;
    if (outcomeType === "great") score += 1;

    if (tags.has("route") || tags.has("escape") || tags.has("avoid")) {
      if (PASS_THROUGH.test(location)) score += 4;
      if (/alley|back-lane|trail|path|gate/.test(location)) score += 2;
    }
    if (tags.has("stealth") || tags.has("hide")) {
      if (/alley|back|hedge|forest|trail|cottage/.test(location)) score += 3;
      if (/guard|watch|market-square/.test(location)) score -= 2;
    }
    if (tags.has("food")) {
      if (/bakery|flour|pantry|cottage|market/.test(location)) score += 3;
    }
    if (tags.has("theft") || tags.has("lock") || tags.has("search")) {
      if (/market|cottage|bakery|shed|well|house/.test(location)) score += 2;
    }
    if (tags.has("combat") || tags.has("scout") || tags.has("patrol")) {
      if (/guard|watch|kennel|road|gate/.test(location)) score += 3;
    }
    if (tags.has("spirit") || tags.has("magic") || tags.has("lore")) {
      if (/chapel|shrine|grave|wayside/.test(location)) score += 4;
    }
    if (tags.has("dark") || tags.has("tunnel") || tags.has("climb")) {
      if (/sewer|drain|tunnel|well/.test(location)) score += 4;
    }

    const nodeCards = normalCards(id);
    if (nodeCards.length) score += 2;
    if (state(id)?.nonDarkLordEventsDisabled && !threatCards(id).length) score -= 5;
    return score + Math.random() * 0.5;
  }

  function chooseNextNode(fromId, choiceData, outcomeType) {
    const from = nodeDef(fromId);
    if (!from) return currentNodeId();
    if (outcomeType === "failure" && Math.random() < 0.45) return fromId;

    const candidates = connected(fromId).filter(nodeDef);
    if (!candidates.length) return fromId;

    return candidates
      .map(id => ({ id, score: scoreMoveTarget(id, choiceData, outcomeType) }))
      .sort((a, b) => b.score - a.score)[0]?.id || fromId;
  }

  function markNodeSpent(id, cardId) {
    const s = state(id);
    if (!s) return;
    s.nonDarkLordEventsDisabled = true;
    s.normalEventSpent = true;
    s.completedEventCardIds ||= [];
    if (cardId && !s.completedEventCardIds.includes(cardId)) s.completedEventCardIds.push(cardId);
  }

  function renderCardOnlyExplore() {
    const card = cards[game.currentCardId];
    const region = game.regions[game.hero.regionId];
    if (!card) return "";
    const badge = card.badge ? `<div class="gd-card-badge">${card.badge}</div>` : "";
    return `<div class="gd-main-scroll">
      <section class="gd-top single-right"><div></div><div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-region-header"><div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-region-title">${region.name}</div><div class="gd-subtitle">${region.subtitle}</div></div></div><div class="gd-pill">◉ ${region.state}</div></section>
      <section class="gd-card"><div class="gd-timer gd-card-timer">${game.heroTimer}s</div>${renderGhostLayer()}<div class="gd-card-art" style="background-image:url('${card.art}')"></div><div class="gd-card-body">${badge}<div class="gd-card-title">${card.title}</div><div class="gd-card-text">${card.text}</div>${game.lastAction ? renderActionResult() : ""}<div class="gd-choice-row">${renderChoice("left", card.choices.left)}<div class="gd-or">OR</div>${renderChoice("right", card.choices.right)}</div></div></section>
      <div class="gd-result-toast">${game.result}</div>${renderHeroFooter()}
    </div>`;
  }

  function installCardFirstRender() {
    window.renderExplore = renderCardOnlyExplore;
    try { renderExplore = window.renderExplore; } catch (_) {}

    window.renderScreen = function renderScreen() {
      if (game.activeTab === "darklord") return renderDarkLord();
      if (game.activeTab === "hero") return renderHero();
      if (game.activeTab === "party") return renderParty();
      if (game.activeTab === "inventory") return renderInventory();
      if (game.activeTab === "log") return renderLog();
      return renderCardOnlyExplore();
    };
    try { renderScreen = window.renderScreen; } catch (_) {}
  }

  function installChooseWrapper() {
    const baseChoose = window.choose || choose;
    if (!baseChoose || baseChoose.__hiddenMapWrapped) return false;

    const wrapped = function chooseWithHiddenMap(side) {
      if (game.heroTimer <= 0 || game.awaitingResultAck) return;
      const cardId = game.currentCardId;
      const card = cards[cardId];
      const choiceData = card?.choices?.[side];
      const nodeId = currentNodeId();

      baseChoose(side);

      const outcomeType = game.lastAction?.outcomeType;
      if (!outcomeType || !choiceData) return;

      const explicitChain = PASS_ONE_CHAINS[cardId]?.[side]?.[outcomeType] || null;
      const builtInChain = cards?.[game.pendingNextCardId] && nodeMatchesCard(nodeId, game.pendingNextCardId)
        ? game.pendingNextCardId
        : null;
      const chainCardId = explicitChain || builtInChain;

      if (chainCardId && cards[chainCardId]) {
        game.pendingNextCardId = chainCardId;
        game.hiddenMapPendingMove = { fromNodeId: nodeId, toNodeId: nodeId, cardId, nextCardId: chainCardId, chain: true };
        game.log.unshift(`Hidden map: ${nodeDef(nodeId)?.label || "Node"} continues to ${cards[chainCardId].title}.`);
        return;
      }

      const nextNodeId = chooseNextNode(nodeId, choiceData, outcomeType);
      const nextCardId = drawCardForHiddenNode(nextNodeId) || drawNextCardId();
      game.pendingNextCardId = nextCardId;
      game.hiddenMapPendingMove = { fromNodeId: nodeId, toNodeId: nextNodeId, cardId, nextCardId, chain: false };
      game.log.unshift(`Hidden map: ${nodeDef(nodeId)?.label || "Node"} → ${nodeDef(nextNodeId)?.label || "Node"}.`);
    };

    wrapped.__hiddenMapWrapped = true;
    window.choose = wrapped;
    try { choose = wrapped; } catch (_) {}
    return true;
  }

  function installAckWrapper() {
    const baseAck = window.acknowledgeResult || acknowledgeResult;
    if (!baseAck || baseAck.__hiddenMapWrapped) return false;

    const wrapped = function acknowledgeHiddenMapResult(...args) {
      const move = game.hiddenMapPendingMove;
      const result = baseAck.apply(this, args);

      if (move && !game.awaitingResultAck) {
        if (!move.chain || CLEAR_NODE_AFTER_CARDS.has(move.cardId)) markNodeSpent(move.fromNodeId, move.cardId);
        game.hero.currentNodeId = move.toNodeId;
        game.hiddenMapPendingMove = null;
        const nodeLabel = nodeDef(move.toNodeId)?.label || "the village";
        if (cards?.[game.currentCardId]) game.result = `You move through ${nodeLabel}.`;
        syncPartyHeroSummary?.();
        render();
      }

      return result;
    };

    wrapped.__hiddenMapWrapped = true;
    window.acknowledgeResult = wrapped;
    try { acknowledgeResult = wrapped; } catch (_) {}
    return true;
  }

  function install(attempt = 0) {
    if (!window.VILLAGE_NODE_MAP?.nodes || typeof cards === "undefined" || typeof renderExplore !== "function") {
      if (attempt < 30) setTimeout(() => install(attempt + 1), 40);
      return;
    }

    ensureNodeState?.();
    game.hero.currentNodeId = findNodeForCard(game.currentCardId) || currentNodeId();
    installCardFirstRender();
    const chooseReady = installChooseWrapper();
    const ackReady = installAckWrapper();
    window[READY_FLAG] = chooseReady && ackReady;
    game.hiddenMapMode = true;
    game.activeEncounter = null;
    game.pendingNodeMove = null;
    game.eventTransition = null;
    render?.();
  }

  install();
})();