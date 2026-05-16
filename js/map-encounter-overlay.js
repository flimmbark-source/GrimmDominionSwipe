// Map-first Explore flow: movement stays on the map; real encounters appear as an overlay, not a tab.
(() => {
  const LOCAL_DEPTH = 2;
  const LOCAL_ZOOM = 2.35;
  const NO_EVENT_CARD = "quiet_village_path";

  const hasMap = () => window.VILLAGE_NODE_MAP && game?.mapState?.village?.nodes;
  const map = () => window.VILLAGE_NODE_MAP;
  const nodeDef = id => map()?.nodes?.[id];
  const nodeState = id => game.mapState.village.nodes[id];
  const connected = id => nodeDef(id)?.connectsTo || [];
  const currentNodeId = () => game.hero.currentNodeId || map()?.startNodeId;
  const moveCost = id => nodeDef(id)?.tags?.includes("exposed") ? 2 : 1;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function chance(id) {
    const def = nodeDef(id);
    const state = nodeState(id);
    if (!def || !state) return 0;
    return clamp((def.encounterChance || 0) + state.noise * 5 + state.danger * 8 + state.corruption * 6 + state.threats.length * 10, 0, 85);
  }

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
    return {
      x: 50 + (def.x - center.x) * LOCAL_ZOOM,
      y: 50 + (def.y - center.y) * LOCAL_ZOOM,
    };
  }

  function inViewport(point) {
    return point.x >= -8 && point.x <= 108 && point.y >= -8 && point.y <= 108;
  }

  function localEdges(centerId, visible) {
    const direct = new Set(connected(centerId));
    return Object.entries(map().nodes).flatMap(([id, def]) => {
      if (!visible.has(id)) return [];
      return def.connectsTo
        .filter(target => id < target && visible.has(target))
        .filter(target => id === centerId || target === centerId || direct.has(id) || direct.has(target))
        .map(target => {
          const a = projectNode(id, centerId);
          const b = projectNode(target, centerId);
          if (!inViewport(a) && !inViewport(b)) return "";
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const length = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          const primary = id === centerId || target === centerId;
          return `<i class="gd-map-edge ${primary ? "primary" : "preview"}" style="left:${a.x}%;top:${a.y}%;width:${length}%;transform:rotate(${angle}deg)"></i>`;
        });
    }).join("");
  }

  function pressureClass(id) {
    const s = nodeState(id);
    if (!s) return "";
    if (s.noise >= 7) return "loud";
    if (s.noise >= 4) return "noisy";
    if (s.threats?.length) return "threat";
    return "";
  }

  function renderLocalNodes(centerId, visible) {
    const direct = new Set(connected(centerId));
    return Object.entries(map().nodes).filter(([id]) => visible.has(id)).map(([id, def]) => {
      const point = projectNode(id, centerId);
      if (!inViewport(point)) return "";
      const current = id === centerId;
      const reachable = direct.has(id);
      const preview = !current && !reachable;
      return `<button class="gd-map-node ${def.kind} ${current ? "current" : ""} ${reachable ? "reachable" : ""} ${preview ? "preview" : ""} ${pressureClass(id)}" data-node-id="${id}" style="left:${point.x}%;top:${point.y}%" ${reachable && !game.awaitingResultAck ? "" : "disabled"} title="${def.label}\n${def.tags.join(", ")}"><span></span></button>`;
    }).join("");
  }

  function renderDestinations(centerId) {
    return `<div class="gd-local-destinations">${connected(centerId).map(id => {
      const def = nodeDef(id);
      const state = nodeState(id);
      const p = state.noise >= 7 ? "Alarm" : state.noise >= 4 ? "Noise" : state.threats.length ? "Threat" : "Clear";
      return `<button class="gd-local-destination ${def.kind}" data-node-id="${id}" ${game.awaitingResultAck || game.activeEncounter ? "disabled" : ""}><strong>${def.label}</strong><span>-${moveCost(id)}s · ${chance(id)}% risk</span><em>${p}</em></button>`;
    }).join("")}</div>`;
  }

  function renderEncounterOverlay() {
    if (!game.activeEncounter) return "";
    const card = cards[game.currentCardId];
    if (!card) return "";
    const badge = card.badge ? `<div class="gd-card-badge">${card.badge}</div>` : "";
    return `<section class="gd-map-encounter-overlay"><div class="gd-map-encounter-scrim"></div><section class="gd-card gd-encounter-card"><div class="gd-timer gd-card-timer">${game.heroTimer}s</div>${renderGhostLayer()}<div class="gd-card-art" style="background-image:url('${card.art}')"></div><div class="gd-card-body">${badge}<div class="gd-card-title">${card.title}</div><div class="gd-card-text">${card.text}</div>${game.lastAction ? renderActionResult() : ""}<div class="gd-choice-row">${renderChoice("left", card.choices.left)}<div class="gd-or">OR</div>${renderChoice("right", card.choices.right)}</div></div></section></section>`;
  }

  window.renderMapFirstExplore = function renderMapFirstExplore() {
    if (!hasMap()) return renderExplore();
    ensureNodeState?.();
    const centerId = currentNodeId();
    const center = nodeDef(centerId);
    const state = nodeState(centerId);
    const visible = localSet(centerId);
    const tags = center.tags.slice(0, 4).map(tag => `<b>${tag}</b>`).join("");
    const bgX = clamp(center.x, 12, 88);
    const bgY = clamp(center.y, 12, 88);
    return `<div class="gd-main-scroll gd-map-first-screen">
      <section class="gd-top single-right"><div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-title">Village</div><div class="gd-subtitle">${center.label}</div></div></div><div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-focused-map-card">
        <div class="gd-focused-map-head"><div><strong>Whispermoor Village</strong><small>${center.label}</small></div><div class="gd-node-tags">${tags}</div></div>
        <div class="gd-focused-node-map gd-node-map" style="--map-focus-x:${bgX}%;--map-focus-y:${bgY}%">${localEdges(centerId, visible)}${renderLocalNodes(centerId, visible)}</div>
        <div class="gd-node-current-readout"><span>Noise ${state.noise} · Danger ${state.danger} · ${chance(centerId)}% risk</span><span>${state.threats.length ? `Threats: ${state.threats.length}` : "No active threat"}</span></div>
        ${renderDestinations(centerId)}
      </section>
      <div class="gd-result-toast">${game.result || "Choose a connected node to move."}</div>${renderHeroFooter()}${renderEncounterOverlay()}
    </div>`;
  };

  const baseDrawCardForNode = window.drawCardForNode;
  window.drawCardForNode = function drawCardForNode(id) {
    const cardId = baseDrawCardForNode?.(id);
    return cardId === NO_EVENT_CARD ? null : cardId;
  };
  drawCardForNode = window.drawCardForNode;

  window.moveHeroToNode = function moveHeroToNode(id) {
    if (!hasMap() || !nodeDef(id) || !connected(currentNodeId()).includes(id) || game.awaitingResultAck || game.activeEncounter) return false;
    game.hero.currentNodeId = id;
    nodeState(id).visited = true;
    nodeState(id).visible = true;
    connected(id).forEach(next => nodeState(next).visible = true);
    game.heroTimer = Math.max(0, game.heroTimer - moveCost(id));
    const cardId = window.drawCardForNode(id);
    if (cardId) {
      game.currentCardId = cardId;
      game.activeEncounter = { nodeId: id, cardId };
      game.result = `Encounter at ${nodeDef(id).label}.`;
    } else {
      game.currentCardId = null;
      game.activeEncounter = null;
      game.result = `Moved to ${nodeDef(id).label}.`;
    }
    game.log.unshift(game.result);
    render();
    return true;
  };

  const baseRenderScreen = renderScreen;
  window.renderScreen = function renderScreen() {
    if (game.activeTab === "explore") return renderMapFirstExplore();
    return baseRenderScreen();
  };
  renderScreen = window.renderScreen;

  const baseRenderTabs = renderTabs;
  window.renderTabs = function renderTabs() {
    const html = baseRenderTabs();
    return html.replace(/<button class="gd-tab[^>]*data-tab="event"[\s\S]*?<\/button>/g, "");
  };
  renderTabs = window.renderTabs;

  const baseAck = acknowledgeResult;
  window.acknowledgeResult = function acknowledgeResult() {
    baseAck();
    if (!game.awaitingResultAck) {
      game.activeEncounter = null;
      game.currentCardId = null;
      game.activeTab = "explore";
      render();
    }
  };
  acknowledgeResult = window.acknowledgeResult;

  const baseBind = bindEvents;
  window.bindEvents = function bindEvents() {
    baseBind();
    document.querySelectorAll(".gd-focused-map-card [data-node-id], .gd-local-destination[data-node-id]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        window.moveHeroToNode(button.dataset.nodeId);
      });
    });
  };
  bindEvents = window.bindEvents;

  game.activeEncounter ||= null;
  if (game.activeTab === "event") game.activeTab = "explore";
  render?.();
})();
