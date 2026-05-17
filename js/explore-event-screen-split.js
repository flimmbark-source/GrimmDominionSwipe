// Splits Explore into a focused local map screen and moves card play into a separate Event screen.
(() => {
  const LOCAL_DEPTH = 2;

  const hasMap = () => window.VILLAGE_NODE_MAP && game?.mapState?.village?.nodes;
  const map = () => window.VILLAGE_NODE_MAP;
  const nodeDef = id => map()?.nodes?.[id];
  const nodeState = id => game.mapState.village.nodes[id];
  const connected = id => nodeDef(id)?.connectsTo || [];
  const currentNodeId = () => game.hero.currentNodeId || map()?.startNodeId;
  const moveCost = id => nodeDef(id)?.tags?.includes("exposed") ? 2 : 1;
  const localChance = id => {
    const def = nodeDef(id);
    const state = nodeState(id);
    if (!def || !state) return 0;
    return Math.max(0, Math.min(85, (def.encounterChance || 0) + state.noise * 5 + state.danger * 8 + state.corruption * 6 + state.threats.length * 10));
  };

  function localNodeSet(centerId) {
    const seen = new Set([centerId]);
    let frontier = [centerId];
    for (let depth = 0; depth < LOCAL_DEPTH; depth++) {
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

  function localEdges(centerId, visible) {
    const direct = new Set(connected(centerId));
    return Object.entries(map().nodes).flatMap(([id, def]) => {
      if (!visible.has(id)) return [];
      return def.connectsTo
        .filter(target => id < target && visible.has(target))
        .filter(target => id === centerId || target === centerId || direct.has(id) || direct.has(target))
        .map(target => {
          const a = def;
          const b = nodeDef(target);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const length = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          const primary = id === centerId || target === centerId;
          return `<i class="gd-map-edge ${primary ? "primary" : "preview"}" style="left:${a.x}%;top:${a.y}%;width:${length}%;transform:rotate(${angle}deg)"></i>`;
        });
    }).join("");
  }

  function nodePressureClass(id) {
    const state = nodeState(id);
    if (!state) return "";
    if (state.noise >= 7) return "loud";
    if (state.noise >= 4) return "noisy";
    if (state.threats?.length) return "threat";
    return "";
  }

  function renderLocalNodes(centerId, visible) {
    const direct = new Set(connected(centerId));
    return Object.entries(map().nodes).filter(([id]) => visible.has(id)).map(([id, def]) => {
      const current = id === centerId;
      const reachable = direct.has(id);
      const preview = !current && !reachable;
      return `<button class="gd-map-node ${def.kind} ${current ? "current" : ""} ${reachable ? "reachable" : ""} ${preview ? "preview" : ""} ${nodePressureClass(id)}" data-node-id="${id}" style="left:${def.x}%;top:${def.y}%" ${reachable && !game.awaitingResultAck ? "" : "disabled"} title="${def.label}\n${def.tags.join(", ")}"><span></span></button>`;
    }).join("");
  }

  function renderDestinationRail(centerId) {
    return `<div class="gd-local-destinations">${connected(centerId).map(id => {
      const def = nodeDef(id);
      const state = nodeState(id);
      const pressure = state.noise >= 7 ? "Alarm" : state.noise >= 4 ? "Noise" : state.threats.length ? "Threat" : "Clear";
      return `<button class="gd-local-destination ${def.kind}" data-node-id="${id}" ${game.awaitingResultAck ? "disabled" : ""}><strong>${def.label}</strong><span>-${moveCost(id)}s · ${localChance(id)}% risk</span><em>${pressure}</em></button>`;
    }).join("")}</div>`;
  }

  window.renderFocusedExploreMap = function renderFocusedExploreMap() {
    if (!hasMap()) return `<div class="gd-main-scroll"><section class="gd-panel">Map unavailable.</section></div>`;
    ensureNodeState?.();
    const centerId = currentNodeId();
    const center = nodeDef(centerId);
    const state = nodeState(centerId);
    const visible = localNodeSet(centerId);
    const tags = center.tags.slice(0, 4).map(tag => `<b>${tag}</b>`).join("");
    return `<div class="gd-main-scroll gd-explore-map-screen">
      <section class="gd-top single-right"><div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-title">Explore</div><div class="gd-subtitle">${center.label}</div></div></div><div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-focused-map-card">
        <div class="gd-focused-map-head"><div><strong>Whispermoor Village</strong><small>${center.label}</small></div><div class="gd-node-tags">${tags}</div></div>
        <div class="gd-focused-node-map gd-node-map">${localEdges(centerId, visible)}${renderLocalNodes(centerId, visible)}</div>
        <div class="gd-node-current-readout"><span>Noise ${state.noise} · Danger ${state.danger} · ${localChance(centerId)}% risk</span><span>${state.threats.length ? `Threats: ${state.threats.length}` : "No active threat"}</span></div>
        ${renderDestinationRail(centerId)}
      </section>
      <div class="gd-result-toast">${game.result || "Choose a connected node to move through the village."}</div>
      ${renderHeroFooter()}
    </div>`;
  };

  window.renderEventScreen = function renderEventScreen() {
    const card = cards[game.currentCardId] || cards.quiet_village_path;
    const region = game.regions[game.hero.regionId];
    const node = hasMap() ? nodeDef(currentNodeId()) : null;
    const badge = card.badge ? `<div class="gd-card-badge">${card.badge}</div>` : "";
    return `<div class="gd-main-scroll gd-event-screen">
      <section class="gd-top single-right"><button class="gd-back-map" data-tab="explore">← Map</button><div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
      <section class="gd-region-header"><div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-region-title">${node?.label || region.name}</div><div class="gd-subtitle">${region.subtitle}</div></div></div><div class="gd-pill">Event</div></section>
      <section class="gd-card"><div class="gd-timer gd-card-timer">${game.heroTimer}s</div>${renderGhostLayer()}<div class="gd-card-art" style="background-image:url('${card.art}')"></div><div class="gd-card-body">${badge}<div class="gd-card-title">${card.title}</div><div class="gd-card-text">${card.text}</div>${game.lastAction ? renderActionResult() : ""}<div class="gd-choice-row">${renderChoice("left", card.choices.left)}<div class="gd-or">OR</div>${renderChoice("right", card.choices.right)}</div></div></section>
      <div class="gd-result-toast">${game.result}</div>${renderHeroFooter()}
    </div>`;
  };

  const baseRenderScreen = renderScreen;
  window.renderScreen = function renderScreen() {
    if (game.activeTab === "explore") return renderFocusedExploreMap();
    if (game.activeTab === "event") return renderEventScreen();
    return baseRenderScreen();
  };
  renderScreen = window.renderScreen;

  const baseRenderTabs = renderTabs;
  window.renderTabs = function renderTabs() {
    if (game.activeTab === "darklord") return baseRenderTabs();
    const hasEvent = Boolean(game.currentCardId && cards[game.currentCardId]);
    const tabs = [["explore", "✥", "Explore"], ...(hasEvent ? [["event", "▣", "Event"]] : []), ["hero", "⛑", "Hero"], ["inventory", "▣", "Inventory"], ["log", "☰", "Log"]];
    return `<nav class="gd-tabs" style="grid-template-columns:repeat(${tabs.length},1fr)">${tabs.map(([id, icon, label]) => `<button class="gd-tab ${game.activeTab === id ? "active" : ""}" data-tab="${id}"><div class="gd-tab-icon">${icon}</div>${label}</button>`).join("")}</nav>`;
  };
  renderTabs = window.renderTabs;

  const baseMoveHeroToNode = window.moveHeroToNode;
  window.moveHeroToNode = function moveHeroToNode(id) {
    const ok = baseMoveHeroToNode?.(id);
    if (!ok) return false;
    if (game.currentCardId && game.currentCardId !== "quiet_village_path") {
      game.activeTab = "event";
      game.result = `Event at ${nodeDef(id)?.label || "node"}.`;
    } else {
      game.activeTab = "explore";
      game.result = `Moved to ${nodeDef(id)?.label || "node"}.`;
    }
    render();
    return true;
  };

  const baseAcknowledgeResult = acknowledgeResult;
  window.acknowledgeResult = function acknowledgeResult() {
    baseAcknowledgeResult();
    if (!game.awaitingResultAck && game.activeTab === "event") {
      game.activeTab = "explore";
      render();
    }
  };
  acknowledgeResult = window.acknowledgeResult;

  const baseBindEvents = bindEvents;
  window.bindEvents = function bindEvents() {
    baseBindEvents();
    document.querySelectorAll(".gd-focused-map-card [data-node-id], .gd-local-destination[data-node-id]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        window.moveHeroToNode(button.dataset.nodeId);
      });
    });
  };
  bindEvents = window.bindEvents;

  if (game.activeTab === "event") game.activeTab = "explore";
  render?.();
})();
