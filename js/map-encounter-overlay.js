// Map-first Explore flow: Explore is the map; encounters use the original card screen.
(() => {
  const LOCAL_DEPTH = 2;
  const LOCAL_ZOOM = 2.45;
  const MAP_SIZE_PERCENT = LOCAL_ZOOM * 100;
  const MAP_ASSET = "assets/maps/whispermoor-village-bg.png";
  const WALK_MS = 560;
  const EVENT_ENTER_MS = 240;
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
    window.setTimeout(() => {
      if (game.activeEncounter?.nodeId === id && game.currentCardId === cardId && game.eventTransition === "enter") {
        game.eventTransition = "active";
      }
    }, EVENT_ENTER_MS);
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

  function cameraPoint() {
    const move = game.pendingNodeMove;
    if (!move) {
      const current = nodeDef(currentNodeId());
      return { x: current.x, y: current.y, centerId: currentNodeId(), moving: false };
    }
    const from = nodeDef(move.from);
    const to = nodeDef(move.to);
    const t = clamp(((performance.now() - move.startedAt) / WALK_MS), 0, 1);
    const eased = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased, centerId: move.from, moving: true };
  }

  function projectNode(id, camera) {
    const def = nodeDef(id);
    return { x: 50 + (def.x - camera.x) * LOCAL_ZOOM, y: 50 + (def.y - camera.y) * LOCAL_ZOOM };
  }

  function mapArtStyle(camera) {
    return {
      left: 50 - camera.x * LOCAL_ZOOM,
      top: 50 - camera.y * LOCAL_ZOOM,
      size: MAP_SIZE_PERCENT,
    };
  }

  function renderMapArtLayer(camera) {
    const style = mapArtStyle(camera);
    return `<img class="gd-map-art-layer" src="${MAP_ASSET}" alt="" aria-hidden="true" draggable="false" style="left:${style.left}%;top:${style.top}%;width:${style.size}%;height:${style.size}%"><div class="gd-map-shade-layer" aria-hidden="true"></div>`;
  }

  function syncMapArtLayer(camera = cameraPoint(), root = document) {
    const style = mapArtStyle(camera);
    root.querySelectorAll?.(".gd-focused-node-map .gd-map-art-layer").forEach(img => {
      img.style.left = `${style.left}%`;
      img.style.top = `${style.top}%`;
      img.style.width = `${style.size}%`;
      img.style.height = `${style.size}%`;
    });
  }

  function inViewport(point) { return point.x >= -8 && point.x <= 108 && point.y >= -8 && point.y <= 108; }
  function edgeId(a, b) { return [a, b].sort().join("--"); }

  function edgeModels(centerId, visible, camera) {
    const direct = new Set(connected(centerId));
    return Object.entries(map().nodes).flatMap(([id, def]) => {
      if (!visible.has(id)) return [];
      return def.connectsTo
        .filter(target => id < target && visible.has(target))
        .filter(target => id === centerId || target === centerId || direct.has(id) || direct.has(target))
        .map(target => {
          const a = projectNode(id, camera);
          const b = projectNode(target, camera);
          if (!inViewport(a) && !inViewport(b)) return null;
          return { id: edgeId(id, target), from: id, to: target, a, b, primary: id === centerId || target === centerId };
        })
        .filter(Boolean);
    });
  }

  function localEdges(centerId, visible, camera) {
    const lines = edgeModels(centerId, visible, camera).map(edge => `<line data-edge-id="${edge.id}" class="${edge.primary ? "primary" : "preview"}" x1="${edge.a.x}" y1="${edge.a.y}" x2="${edge.b.x}" y2="${edge.b.y}" />`).join("");
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

  function renderLocalNodes(centerId, visible, camera) {
    const direct = new Set(connected(centerId));
    const walking = game.pendingNodeMove;
    return Object.entries(map().nodes).filter(([id]) => visible.has(id)).map(([id, def]) => {
      const point = projectNode(id, camera);
      if (!inViewport(point)) return "";
      const current = id === centerId && !walking;
      const reachable = direct.has(id);
      const preview = !current && !reachable;
      const canMove = reachable && !game.awaitingResultAck && !game.activeEncounter && !walking;
      const handler = canMove ? `onclick="event.preventDefault();event.stopImmediatePropagation();window.moveHeroToNode('${id}')"` : "";
      return `<button class="gd-map-node ${def.kind} ${current ? "current" : ""} ${reachable ? "reachable" : ""} ${preview ? "preview" : ""} ${hasGuaranteedEvent(id) ? "event-node" : ""} ${walking?.to === id ? "walk-target" : ""} ${walking?.from === id ? "walk-origin" : ""} ${pressureClass(id)}" data-node-id="${id}" style="left:${point.x}%;top:${point.y}%" ${handler} ${canMove ? "" : "disabled"} title="${def.label}\n${def.tags.join(", ")}"><span></span></button>`;
    }).join("");
  }

  function renderPlayerToken() {
    return `<div class="gd-map-player-token ${game.pendingNodeMove ? "walking camera-centered" : "idle"}" style="left:50%;top:50%"><span>♟</span></div>`;
  }

  function nodeTagHtml(center) {
    return center.tags.slice(0, 4).map(tag => `<b>${tag}</b>`).join("");
  }

  function nodeReadoutHtml(centerId) {
    const state = nodeState(centerId);
    return `<span>Noise ${state.noise} · Danger ${state.danger} · ${chance(centerId)}% risk</span><span>${state.threats.length ? `Threats: ${state.threats.length}` : "No active threat"}</span>`;
  }

  function renderMapScreen() {
    if (!hasMap()) return renderExplore();
    ensureNodeState?.();
    const move = game.pendingNodeMove;
    const camera = cameraPoint();
    const centerId = move?.from || currentNodeId();
    const center = nodeDef(centerId);
    const visible = localSet(centerId);
    const tags = nodeTagHtml(center);
    const hint = move ? `Moving to ${nodeDef(move.to)?.label}.` : (game.result || "Tap a connected node on the map to move.");
    return `<div class="gd-main-scroll gd-map-first-screen map-mode ${game.eventTransition || "active"}">
      <section class="gd-top single-right"><div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-title">Village</div><div class="gd-subtitle">${move ? nodeDef(move.to)?.label : center.label}</div></div></div><div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-focused-map-card">
        <div class="gd-focused-map-head"><div><strong>Whispermoor Village</strong><small>${move ? `To ${nodeDef(move.to)?.label}` : center.label}</small></div><div class="gd-node-tags">${tags}</div></div>
        <div class="gd-focused-node-map gd-node-map is-camera-following">${renderMapArtLayer(camera)}${localEdges(centerId, visible, camera)}${renderLocalNodes(centerId, visible, camera)}${renderPlayerToken()}</div>
        <div class="gd-node-current-readout">${nodeReadoutHtml(centerId)}</div>
      </section>
      <div class="gd-result-toast">${hint}</div>${renderHeroFooter()}
    </div>`;
  }

  function refreshArrivedMapDom(centerId) {
    const mapEl = document.querySelector(".gd-focused-node-map");
    const screen = document.querySelector(".gd-map-first-screen");
    if (!mapEl || !screen || !nodeDef(centerId)) return false;

    const center = nodeDef(centerId);
    const camera = cameraPoint();
    const visible = localSet(centerId);

    screen.querySelector(".gd-top .gd-subtitle")?.replaceChildren(document.createTextNode(center.label));
    screen.querySelector(".gd-focused-map-head small")?.replaceChildren(document.createTextNode(center.label));
    const tagRow = screen.querySelector(".gd-node-tags");
    if (tagRow) tagRow.innerHTML = nodeTagHtml(center);
    const readout = screen.querySelector(".gd-node-current-readout");
    if (readout) readout.innerHTML = nodeReadoutHtml(centerId);
    const toast = screen.querySelector(".gd-result-toast");
    if (toast) toast.textContent = game.result;

    mapEl.classList.remove("is-moving");
    mapEl.innerHTML = `${renderMapArtLayer(camera)}${localEdges(centerId, visible, camera)}${renderLocalNodes(centerId, visible, camera)}${renderPlayerToken()}`;
    window.updateTimerDom?.();
    return true;
  }

  function cardFlavorText(card) {
    return card.text || card.flavor || card.description || "";
  }

  function renderEventScreen() {
    const card = cards[game.currentCardId];
    const region = game.regions[game.hero.regionId];
    const node = nodeDef(game.activeEncounter?.nodeId || currentNodeId());
    if (!card) return renderMapScreen();
    const badge = card.badge ? `<div class="gd-card-badge">${card.badge}</div>` : "";
    const flavorText = cardFlavorText(card);
    return `<div class="gd-main-scroll gd-map-event-screen ${game.eventTransition || "active"}">
      <section class="gd-top single-right"><div></div><div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-region-header"><div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-region-title">${node?.label || region.name}</div><div class="gd-subtitle">${region.subtitle}</div></div></div><div class="gd-pill">◉ ${region.state}</div></section>
      <section class="gd-card"><div class="gd-timer gd-card-timer">${game.heroTimer}s</div>${renderGhostLayer()}<div class="gd-card-art" style="background-image:url('${card.art}')"></div><div class="gd-card-body">${badge}<div class="gd-card-title">${card.title}</div><div class="gd-card-text gd-event-card-text">${flavorText}</div>${game.lastAction ? renderActionResult() : ""}<div class="gd-choice-row">${renderChoice("left", card.choices.left)}<div class="gd-or">OR</div>${renderChoice("right", card.choices.right)}</div></div></section>
      ${renderHeroFooter()}
      <div class="gd-result-toast">${game.result}</div>
    </div>`;
  }

  function restoreVisibleCardFlavor() {
    if (game.activeTab !== "explore") return;
    const card = cards?.[game.currentCardId];
    const text = card ? cardFlavorText(card) : "";
    if (!text) return;
    const body = document.querySelector(".gd-card .gd-card-body");
    const title = body?.querySelector(".gd-card-title");
    if (!body || !title) return;

    let textNode = body.querySelector(".gd-card-text");
    if (!textNode) {
      textNode = document.createElement("div");
      textNode.className = "gd-card-text gd-event-card-text gd-forced-event-text";
      title.insertAdjacentElement("afterend", textNode);
    }

    textNode.classList.add("gd-event-card-text", "gd-forced-event-text");
    if (textNode.textContent.trim() !== text) textNode.textContent = text;
  }

  function fillEventCardFooterGap() {
    if (game.activeTab !== "explore" || !game.activeEncounter) return;
    const screen = document.querySelector(".gd-map-event-screen");
    const card = screen?.querySelector(".gd-card");
    const body = card?.querySelector(".gd-card-body");
    const choiceRow = card?.querySelector(".gd-choice-row");
    const footer = screen?.querySelector(".gd-footer-chip");
    if (!screen || !card || !footer) return;

    card.style.removeProperty("height");
    card.style.removeProperty("min-height");
    card.style.removeProperty("margin-bottom");

    const cardRect = card.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const gap = Math.floor(footerRect.top - cardRect.bottom);
    if (gap <= 2) return;

    const nextHeight = Math.ceil(cardRect.height + gap);
    card.style.setProperty("height", `${nextHeight}px`, "important");
    card.style.setProperty("min-height", `${nextHeight}px`, "important");
    card.style.setProperty("margin-bottom", `${-gap}px`, "important");
    card.style.setProperty("position", "relative", "important");
    card.style.setProperty("z-index", "1", "important");
    footer.style.setProperty("position", "relative", "important");
    footer.style.setProperty("z-index", "2", "important");

    if (body) {
      body.style.setProperty("display", "flex", "important");
      body.style.setProperty("flex-direction", "column", "important");
    }
    if (choiceRow) choiceRow.style.setProperty("margin-top", "auto", "important");
  }

  function afterExploreRender() {
    restoreVisibleCardFlavor();
    syncMapArtLayer();
    fillEventCardFooterGap();
    requestAnimationFrame(() => {
      syncMapArtLayer();
      fillEventCardFooterGap();
    });
  }

  window.renderMapFirstExplore = function renderMapFirstExplore() {
    return game.activeEncounter ? renderEventScreen() : renderMapScreen();
  };

  window.drawCardForNode = function drawCardForNode(id) { return drawNodeEncounter(id); };
  drawCardForNode = window.drawCardForNode;

  function applyCameraFrame() {
    const mapEl = document.querySelector(".gd-focused-node-map");
    if (!mapEl || !game.pendingNodeMove) return;
    const move = game.pendingNodeMove;
    const camera = cameraPoint();
    const centerId = move.from;
    const visible = localSet(centerId);
    syncMapArtLayer(camera, mapEl);

    edgeModels(centerId, visible, camera).forEach(edge => {
      const line = mapEl.querySelector(`[data-edge-id="${edge.id}"]`);
      if (!line) return;
      line.setAttribute("x1", edge.a.x);
      line.setAttribute("y1", edge.a.y);
      line.setAttribute("x2", edge.b.x);
      line.setAttribute("y2", edge.b.y);
    });

    visible.forEach(id => {
      const button = mapEl.querySelector(`[data-node-id="${id}"]`);
      if (!button) return;
      const point = projectNode(id, camera);
      button.style.left = `${point.x}%`;
      button.style.top = `${point.y}%`;
    });
  }

  function completeMove(id) {
    if (game.pendingMoveFrame) cancelAnimationFrame(game.pendingMoveFrame);
    game.pendingMoveFrame = null;
    game.hero.currentNodeId = id;
    nodeState(id).visited = true;
    nodeState(id).visible = true;
    connected(id).forEach(next => nodeState(next).visible = true);
    game.heroTimer = Math.max(0, game.heroTimer - moveCost(id));
    game.pendingNodeMove = null;
    document.querySelector(".gd-focused-node-map")?.classList.remove("is-moving");

    const cardId = window.drawCardForNode(id);
    if (!openNodeEncounter(id, cardId)) {
      game.currentCardId = null;
      game.activeEncounter = null;
      game.eventTransition = null;
      game.result = `Moved to ${nodeDef(id).label}.`;
      game.log.unshift(game.result);
      if (!refreshArrivedMapDom(id)) render();
    }
  }

  function animateCameraMove() {
    if (!game.pendingNodeMove) return;
    applyCameraFrame();
    if (performance.now() - game.pendingNodeMove.startedAt < WALK_MS) {
      game.pendingMoveFrame = requestAnimationFrame(animateCameraMove);
    }
  }

  window.moveHeroToNode = function moveHeroToNode(id) {
    const from = currentNodeId();
    if (!hasMap() || !nodeDef(id) || !connected(from).includes(id) || game.awaitingResultAck || game.activeEncounter || game.pendingNodeMove) return false;
    game.pendingNodeMove = { from, to: id, startedAt: performance.now() };
    game.result = `Moving to ${nodeDef(id).label}.`;
    if (game.pendingMoveFrame) cancelAnimationFrame(game.pendingMoveFrame);
    const toast = document.querySelector(".gd-result-toast");
    if (toast) toast.textContent = game.result;
    const mapEl = document.querySelector(".gd-focused-node-map");
    mapEl?.classList.add("is-moving");
    mapEl?.querySelectorAll(".gd-map-node").forEach(node => node.disabled = true);
    applyCameraFrame();
    game.pendingMoveFrame = requestAnimationFrame(animateCameraMove);
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
      const nodeId = game.activeEncounter.nodeId || currentNodeId();
      game.eventTransition = "exit";
      render();
      setTimeout(() => {
        if (resultReadyTimeoutId) clearTimeout(resultReadyTimeoutId);
        resultReadyTimeoutId = null;
        game.pendingNextCardId = null;
        game.awaitingResultAck = false;
        game.resultReady = false;
        game.lastAction = null;
        game.activeEncounter = null;
        game.currentCardId = null;
        game.eventTransition = null;
        game.activeTab = "explore";
        game.result = `Returned to ${nodeDef(nodeId)?.label || "the map"}.`;
        syncPartyHeroSummary();
        render();
      }, EVENT_EXIT_MS);
      return;
    }
    baseAck();
  };
  acknowledgeResult = window.acknowledgeResult;

  const baseRender = render;
  window.render = function render(...args) {
    const result = baseRender.apply(this, args);
    afterExploreRender();
    return result;
  };
  render = window.render;

  game.activeEncounter ||= null;
  game.pendingNodeMove ||= null;
  game.pendingMoveFrame ||= null;
  game.eventTransition ||= null;
  if (game.activeTab === "event") game.activeTab = "explore";
  render?.();
})();