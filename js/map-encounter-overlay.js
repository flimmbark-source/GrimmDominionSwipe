// Map-first Explore flow: Explore is the map; encounters use the original card screen.
(() => {
  const LOCAL_DEPTH = 2;
  const LOCAL_ZOOM = 2.35;
  const WALK_MS = 560;
  const EVENT_EXIT_MS = 220;
  const NO_EVENT_CARD = "quiet_village_path";

  const hasMap = () => window.VILLAGE_NODE_MAP && game?.mapState?.village?.nodes;
  const map = () => window.VILLAGE_NODE_MAP;
  const nodeDef = id => map()?.nodes?.[id];
  const nodeState = id => game.mapState.village.nodes[id];
  const connected = id => nodeDef(id)?.connectsTo || [];
  const currentNodeId = () => game.hero.currentNodeId || map()?.startNodeId;
  const moveCost = id => nodeDef(id)?.tags?.includes("exposed") ? 2 : 1;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const validCards = pool => (pool || []).filter(id => id && id !== NO_EVENT_CARD && cards?.[id]);
  const pick = pool => pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;

  function chance(id) {
    const def = nodeDef(id);
    const state = nodeState(id);
    if (!def || !state) return 0;
    return clamp((def.encounterChance || 0) + state.noise * 5 + state.danger * 8 + state.corruption * 6 + state.threats.length * 10, 0, 85);
  }

  function fallbackCardForNode(def) {
    if (!def) return null;
    const tags = new Set([def.kind, ...(def.tags || [])]);
    const ordered = [];
    if (tags.has("house")) ordered.push("village_house_window", "baker_backdoor", "apothecary_drawer");
    if (tags.has("food") || tags.has("shed")) ordered.push("hidden_pantry", "baker_backdoor");
    if (tags.has("market")) ordered.push("market_stall", "shrine_vendor", "false_cache");
    if (tags.has("well") || tags.has("water")) ordered.push("well_bucket", "plague_well", "sewer_grate");
    if (tags.has("sewer") || tags.has("tunnel")) ordered.push("sewer_grate", "drain_crawl", "secret_tunnel");
    if (tags.has("shrine") || tags.has("spirit") || tags.has("magic")) ordered.push("shrine_vendor", "grave_bell", "whispering_idol");
    if (tags.has("guard") || tags.has("patrol")) ordered.push("guard_post", "watch_patrol", "scout_sniffs_path");
    if (tags.has("kennel") || tags.has("hounds")) ordered.push("kennel_yard", "hound_pack");
    if (tags.has("forest") || tags.has("route") || tags.has("path")) ordered.push("secret_route", "scout_sniffs_path", "bloodroot");
    return pick(validCards(ordered));
  }

  function drawNodeEncounter(id) {
    const def = nodeDef(id);
    const state = nodeState(id);
    if (!def || !state) return null;
    const threatCards = (state.threats || []).map(threatId => DARK_THREATS?.[threatId]?.cardId);
    const direct = validCards([...(state.seededCards || []), ...threatCards, ...(def.eventPool || [])]);
    if (direct.length) return pick(direct);
    if ((def.eventPool || []).length) return fallbackCardForNode(def);
    if (Math.random() * 100 < chance(id)) {
      const random = validCards(def.randomPool || []);
      return pick(random) || fallbackCardForNode(def);
    }
    return null;
  }

  function openNodeEncounter(id, cardId = drawNodeEncounter(id)) {
    if (!cardId || !cards?.[cardId]) return false;
    game.pendingNodeMove = null;
    game.currentCardId = cardId;
    game.activeEncounter = { nodeId: id, cardId };
    game.eventTransition = "enter";
    game.result = `Encounter at ${nodeDef(id)?.label || "Node"}: ${cards[cardId]?.title || "Event"}.`;
    game.log.unshift(game.result);
    render();
    requestAnimationFrame(() => {
      game.eventTransition = "active";
      render();
    });
    return true;
  }

  window.forceNodeEncounter = function forceNodeEncounter(id) {
    const target = id || currentNodeId();
    return openNodeEncounter(target, drawNodeEncounter(target) || fallbackCardForNode(nodeDef(target)) || "scout_sniffs_path");
  };

  function localSet(centerId) {
    const seen = new Set([centerId]);
    let frontier = [centerId];
    for (let d = 0; d < LOCAL_DEPTH; d++) {
      const next = [];
      frontier.forEach(id => connected(id).forEach(adj => {
        if (!seen.has(adj)) {
          seen.add(adj);
          next.push(adj);
        }
      }));
      frontier = next;
    }
    return seen;
  }

  function projectNode(id, centerId) {
    const center = nodeDef(centerId);
    const def = nodeDef(id);
    return { x: 50 + (def.x - center.x) * LOCAL_ZOOM, y: 50 + (def.y - center.y) * LOCAL_ZOOM };
  }

  function inViewport(point) { return point.x >= -8 && point.x <= 108 && point.y >= -8 && point.y <= 108; }

  function localEdges(centerId, visible) {
    const direct = new Set(connected(centerId));
    const lines = Object.entries(map().nodes).flatMap(([id, def]) => {
      if (!visible.has(id)) return [];
      return def.connectsTo
        .filter(target => id < target && visible.has(target))
        .filter(target => id === centerId || target === centerId || direct.has(id) || direct.has(target))
        .map(target => {
          const a = projectNode(id, centerId);
          const b = projectNode(target, centerId);
          if (!inViewport(a) && !inViewport(b)) return "";
          const primary = id === centerId || target === centerId;
          return `<line class="${primary ? "primary" : "preview"}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
        });
    }).join("");
    return `<svg class="gd-map-line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>`;
  }

  function pressureClass(id) {
    const s = nodeState(id);
    if (!s) return "";
    if (s.noise >= 7) return "loud";
    if (s.noise >= 4) return "noisy";
    if (s.threats?.length) return "threat";
    return "";
  }

  function hasGuaranteedEvent(id) {
    const def = nodeDef(id);
    const state = nodeState(id);
    return Boolean(def && state && ((def.eventPool || []).length || (state.seededCards || []).length || (state.threats || []).length));
  }

  function renderLocalNodes(centerId, visible) {
    const direct = new Set(connected(centerId));
    const walking = game.pendingNodeMove;
    return Object.entries(map().nodes).filter(([id]) => visible.has(id)).map(([id, def]) => {
      const point = projectNode(id, centerId);
      if (!inViewport(point)) return "";
      const current = id === centerId;
      const reachable = direct.has(id);
      const preview = !current && !reachable;
      const canMove = reachable && !game.awaitingResultAck && !game.activeEncounter && !walking;
      const handler = canMove ? `onclick="event.preventDefault();event.stopPropagation();window.moveHeroToNode('${id}')"` : "";
      return `<button class="gd-map-node ${def.kind} ${current ? "current" : ""} ${reachable ? "reachable" : ""} ${preview ? "preview" : ""} ${hasGuaranteedEvent(id) ? "event-node" : ""} ${walking?.to === id ? "walk-target" : ""} ${walking?.from === id ? "walk-origin" : ""} ${pressureClass(id)}" data-node-id="${id}" style="left:${point.x}%;top:${point.y}%" ${handler} ${canMove ? "" : "disabled"} title="${def.label}\n${def.tags.join(", ")}"><span></span></button>`;
    }).join("");
  }

  function renderPlayerToken(centerId) {
    const walking = game.pendingNodeMove;
    const fromId = walking?.from || centerId;
    const toId = walking?.to || fromId;
    const from = projectNode(fromId, centerId);
    const to = projectNode(toId, centerId);
    return `<div class="gd-map-player-token ${walking ? "walking" : "idle"}" style="--walk-from-x:${from.x}%;--walk-from-y:${from.y}%;--walk-to-x:${to.x}%;--walk-to-y:${to.y}%"><span>♟</span></div>`;
  }

  function renderEventHeroBar() {
    return `<section class="gd-event-goblin-bar"><img class="gd-portrait" src="${ART.goblinSmall}"><div><div class="gd-name">${game.hero.name} <span class="gd-inline-hp">♥ ${game.partyHealth}/10</span></div><div class="gd-status">◉ ${game.hero.status}</div></div><div class="gd-resource">Gold ${game.hero.resourceValue}<br><b>Food ${game.hero.food}</b></div></section>`;
  }

  function renderMapScreen() {
    if (!hasMap()) return renderExplore();
    ensureNodeState?.();
    const move = game.pendingNodeMove;
    const centerId = move?.from || currentNodeId();
    const center = nodeDef(centerId);
    const state = nodeState(centerId);
    const visible = localSet(centerId);
    const tags = center.tags.slice(0, 4).map(tag => `<b>${tag}</b>`).join("");
    const bgX = clamp(center.x, 12, 88);
    const bgY = clamp(center.y, 12, 88);
    const hint = move ? `Moving to ${nodeDef(move.to)?.label}.` : (game.result || "Tap a connected node on the map to move.");
    return `<div class="gd-main-scroll gd-map-first-screen map-mode ${game.eventTransition || "active"}">
      <section class="gd-top single-right"><div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-title">Village</div><div class="gd-subtitle">${center.label}</div></div></div><div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-focused-map-card">
        <div class="gd-focused-map-head"><div><strong>Whispermoor Village</strong><small>${center.label}</small></div><div class="gd-node-tags">${tags}</div></div>
        <div class="gd-focused-node-map gd-node-map" style="--map-focus-x:${bgX}%;--map-focus-y:${bgY}%">${localEdges(centerId, visible)}${renderLocalNodes(centerId, visible)}${renderPlayerToken(centerId)}</div>
        <div class="gd-node-current-readout"><span>Noise ${state.noise} · Danger ${state.danger} · ${chance(centerId)}% risk</span><span>${state.threats.length ? `Threats: ${state.threats.length}` : "No active threat"}</span></div>
      </section>
      <div class="gd-result-toast">${hint}</div>${renderHeroFooter()}
    </div>`;
  }

  function renderEventScreen() {
    const card = cards[game.currentCardId];
    const region = game.regions[game.hero.regionId];
    const node = nodeDef(game.activeEncounter?.nodeId || currentNodeId());
    if (!card) return renderMapScreen();
    const badge = card.badge ? `<div class="gd-card-badge">${card.badge}</div>` : "";
    return `<div class="gd-main-scroll gd-map-event-screen ${game.eventTransition || "active"}">
      <section class="gd-top single-right"><div></div><div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-region-header"><div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-region-title">${node?.label || region.name}</div><div class="gd-subtitle">${region.subtitle}</div></div></div><div class="gd-pill">Event</div></section>
      ${renderEventHeroBar()}
      <section class="gd-card"><div class="gd-timer gd-card-timer">${game.heroTimer}s</div>${renderGhostLayer()}<div class="gd-card-art" style="background-image:url('${card.art}')"></div><div class="gd-card-body">${badge}<div class="gd-card-title">${card.title}</div><div class="gd-card-text">${card.text}</div>${game.lastAction ? renderActionResult() : ""}<div class="gd-choice-row">${renderChoice("left", card.choices.left)}<div class="gd-or">OR</div>${renderChoice("right", card.choices.right)}</div></div></section>
      <div class="gd-result-toast">${game.result}</div>
    </div>`;
  }

  window.renderMapFirstExplore = function renderMapFirstExplore() {
    return game.activeEncounter ? renderEventScreen() : renderMapScreen();
  };

  window.drawCardForNode = function drawCardForNode(id) { return drawNodeEncounter(id); };
  drawCardForNode = window.drawCardForNode;

  function completeMove(id) {
    game.hero.currentNodeId = id;
    nodeState(id).visited = true;
    nodeState(id).visible = true;
    connected(id).forEach(next => nodeState(next).visible = true);
    game.heroTimer = Math.max(0, game.heroTimer - moveCost(id));
    game.pendingNodeMove = null;
    const cardId = window.drawCardForNode(id);
    if (!openNodeEncounter(id, cardId)) {
      game.currentCardId = null;
      game.activeEncounter = null;
      game.eventTransition = null;
      game.result = `Moved to ${nodeDef(id).label}.`;
      game.log.unshift(game.result);
      render();
    }
  }

  window.moveHeroToNode = function moveHeroToNode(id) {
    const from = currentNodeId();
    if (!hasMap() || !nodeDef(id) || !connected(from).includes(id) || game.awaitingResultAck || game.activeEncounter || game.pendingNodeMove) return false;
    game.pendingNodeMove = { from, to: id };
    game.result = `Moving to ${nodeDef(id).label}.`;
    render();
    setTimeout(() => completeMove(id), WALK_MS);
    return true;
  };

  const baseRenderScreen = renderScreen;
  window.renderScreen = function renderScreen() {
    if (game.activeTab === "explore") return renderMapFirstExplore();
    return baseRenderScreen();
  };
  renderScreen = window.renderScreen;

  const baseAck = acknowledgeResult;
  window.acknowledgeResult = function acknowledgeResult() {
    if (game.activeEncounter && game.resultReady) {
      game.eventTransition = "exit";
      render();
      setTimeout(() => {
        baseAck();
        game.activeEncounter = null;
        game.currentCardId = null;
        game.eventTransition = null;
        game.activeTab = "explore";
        render();
      }, EVENT_EXIT_MS);
      return;
    }
    baseAck();
  };
  acknowledgeResult = window.acknowledgeResult;

  game.activeEncounter ||= null;
  game.pendingNodeMove ||= null;
  game.eventTransition ||= null;
  if (game.activeTab === "event") game.activeTab = "explore";
  render?.();
})();