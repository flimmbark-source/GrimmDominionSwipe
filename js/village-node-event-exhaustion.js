// Exhausts normal/location events on a node after the player resolves an encounter there.
// Dark Lord threat cards may still trigger on exhausted nodes.
(() => {
  const READY_FLAG = "VILLAGE_NODE_EVENT_EXHAUSTION";
  if (window[READY_FLAG]) return;

  function nodeState(id) {
    return game?.mapState?.village?.nodes?.[id] || null;
  }

  function nodeDef(id) {
    return window.VILLAGE_NODE_MAP?.nodes?.[id] || null;
  }

  function darkLordThreatCards(id) {
    const state = nodeState(id);
    if (!state) return [];
    return [...new Set((state.threats || [])
      .map(threatId => DARK_THREATS?.[threatId]?.cardId)
      .filter(cardId => cardId && cards?.[cardId]))];
  }

  function pick(pool) {
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function markNodeNormalEventsSpent(nodeId, cardId) {
    const state = nodeState(nodeId);
    if (!state) return;
    state.nonDarkLordEventsDisabled = true;
    state.normalEventSpent = true;
    state.completedEventCardIds ||= [];
    if (cardId && !state.completedEventCardIds.includes(cardId)) state.completedEventCardIds.push(cardId);
  }

  function restoreNodeIcon(button, id) {
    const icon = button.querySelector(".gd-map-node-icon");
    if (!icon) return;
    icon.textContent = nodeDef(id)?.icon || "•";
  }

  function setExhaustedIcon(button) {
    const icon = button.querySelector(".gd-map-node-icon");
    if (!icon) return;
    icon.textContent = "✓";
  }

  function updateNodeEventRings() {
    document.querySelectorAll(".gd-map-node[data-node-id]").forEach(button => {
      const id = button.dataset.nodeId;
      const state = nodeState(id);
      const exhausted = Boolean(state?.nonDarkLordEventsDisabled);
      const hasDarkLordThreat = darkLordThreatCards(id).length > 0;

      button.classList.toggle("exhausted-node", exhausted);
      button.classList.toggle("dark-threat-node", hasDarkLordThreat);

      if (!exhausted) {
        delete button.dataset.normalEventsDisabled;
        restoreNodeIcon(button, id);
        return;
      }

      button.dataset.normalEventsDisabled = "true";

      if (hasDarkLordThreat) {
        button.classList.add("event-node");
        restoreNodeIcon(button, id);
        return;
      }

      button.classList.remove("event-node");
      setExhaustedIcon(button);
    });
  }

  function wrapDrawCardForNode() {
    const baseDraw = window.drawCardForNode;
    if (!baseDraw || baseDraw.__eventExhaustionWrapped) return false;

    const wrapped = function drawCardForNodeWithExhaustion(id) {
      const state = nodeState(id);
      if (state?.nonDarkLordEventsDisabled) {
        return pick(darkLordThreatCards(id));
      }
      return baseDraw(id);
    };

    wrapped.__eventExhaustionWrapped = true;
    wrapped.__baseDrawCardForNode = baseDraw;
    window.drawCardForNode = wrapped;
    try { drawCardForNode = wrapped; } catch (_) {}
    return true;
  }

  function wrapAcknowledgeResult() {
    const baseAck = window.acknowledgeResult;
    if (!baseAck || baseAck.__eventExhaustionWrapped) return false;

    const wrapped = function acknowledgeResultWithNodeExhaustion(...args) {
      if (game?.activeEncounter && game?.resultReady) {
        markNodeNormalEventsSpent(game.activeEncounter.nodeId, game.activeEncounter.cardId || game.currentCardId);
      }
      return baseAck.apply(this, args);
    };

    wrapped.__eventExhaustionWrapped = true;
    wrapped.__baseAcknowledgeResult = baseAck;
    window.acknowledgeResult = wrapped;
    try { acknowledgeResult = wrapped; } catch (_) {}
    return true;
  }

  function install(attempt = 0) {
    const drawReady = wrapDrawCardForNode();
    const ackReady = wrapAcknowledgeResult();
    if (drawReady && ackReady) {
      window[READY_FLAG] = true;
      updateNodeEventRings();
      return;
    }
    if (attempt < 20) setTimeout(() => install(attempt + 1), 40);
  }

  const baseRender = render;
  window.render = function render(...args) {
    const result = baseRender.apply(this, args);
    updateNodeEventRings();
    requestAnimationFrame(updateNodeEventRings);
    return result;
  };
  render = window.render;

  install();
})();