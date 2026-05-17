// Full-map node calibration overlay. Add ?mapCalibrate=1 to enable.
(() => {
  const enabled = new URLSearchParams(window.location.search).get("mapCalibrate") === "1";
  if (!enabled) return;

  const MAP_ASSET = "assets/maps/whispermoor-village-bg.png";
  let selectedId = null;
  let draggingId = null;
  let dragRaf = null;
  const draft = {};

  document.documentElement.classList.add("map-calibrate-enabled");

  const pct = n => Math.round(n * 10) / 10;
  const nodes = () => window.VILLAGE_NODE_MAP?.nodes || {};

  function nodeCoord(id) {
    const node = nodes()[id];
    const pending = draft[id];
    return pending || { x: node.x, y: node.y };
  }

  function renderLines() {
    const seen = new Set();
    return Object.entries(nodes()).flatMap(([id, node]) => {
      const a = nodeCoord(id);
      return (node.connectsTo || []).map(target => {
        if (!nodes()[target]) return "";
        const edgeId = [id, target].sort().join("--");
        if (seen.has(edgeId)) return "";
        seen.add(edgeId);
        const b = nodeCoord(target);
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
      });
    }).join("");
  }

  function renderNodes() {
    return Object.entries(nodes()).map(([id, node]) => {
      const c = nodeCoord(id);
      const current = game?.hero?.currentNodeId === id ? " current" : "";
      const selected = selectedId === id ? " selected" : "";
      return `<div class="gd-map-calibrate-node${current}${selected}" data-node-id="${id}" style="left:${c.x}%;top:${c.y}%" title="${id}: ${node.label} (${c.x}, ${c.y})"><span class="gd-map-calibrate-dot"></span><span class="gd-map-calibrate-node-label">${node.label}<br>${id}</span></div>`;
    }).join("");
  }

  function buildPatchText() {
    const ids = Object.keys(draft).sort();
    if (!ids.length) return "No coordinate changes yet.";
    return ids.map(id => `${id}: { x:${draft[id].x}, y:${draft[id].y} }`).join("\n");
  }

  function showToast(text) {
    const toast = document.querySelector(".gd-map-calibrate-toast");
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function refreshOverlay() {
    const lines = document.querySelector(".gd-map-calibrate-lines");
    const layer = document.querySelector(".gd-map-calibrate-node-layer");
    if (lines) lines.innerHTML = renderLines();
    if (layer) layer.innerHTML = renderNodes();
  }

  function renderOverlay() {
    if (document.querySelector(".gd-map-calibrate-overlay")) return;

    const tab = document.createElement("button");
    tab.className = "gd-map-calibrate-tab";
    tab.type = "button";
    tab.textContent = "Map Test";
    document.body.appendChild(tab);

    const overlay = document.createElement("div");
    overlay.className = "gd-map-calibrate-overlay";
    overlay.innerHTML = `<div class="gd-map-calibrate-toolbar"><div><strong>Village Map Calibration</strong><small>Full PNG with all node coordinates. Drag nodes, or screenshot this view and send it back.</small></div><div class="gd-map-calibrate-actions"><button type="button" data-action="labels">Labels</button><button type="button" data-action="lines">Lines</button><button type="button" data-action="copy">Copy Patch</button><button type="button" data-action="close">Close</button></div></div><div class="gd-map-calibrate-stage-wrap"><div class="gd-map-calibrate-stage"><img src="${MAP_ASSET}" alt="Village map"><svg class="gd-map-calibrate-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${renderLines()}</svg><div class="gd-map-calibrate-node-layer">${renderNodes()}</div></div></div>`;
    document.body.appendChild(overlay);

    const toast = document.createElement("div");
    toast.className = "gd-map-calibrate-toast";
    document.body.appendChild(toast);

    tab.addEventListener("click", () => {
      overlay.classList.add("open");
      refreshOverlay();
    });

    overlay.addEventListener("click", event => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "close") overlay.classList.remove("open");
      if (action === "labels") overlay.classList.toggle("hide-labels");
      if (action === "lines") overlay.classList.toggle("hide-lines");
      if (action === "copy") {
        const text = buildPatchText();
        navigator.clipboard?.writeText(text).then(
          () => showToast("Coordinate patch copied."),
          () => showToast(text)
        );
      }

      const nodeEl = event.target.closest(".gd-map-calibrate-node");
      if (nodeEl) {
        selectedId = nodeEl.dataset.nodeId;
        refreshOverlay();
      }
    });

    overlay.addEventListener("pointerdown", event => {
      const nodeEl = event.target.closest(".gd-map-calibrate-node");
      if (!nodeEl) return;
      selectedId = nodeEl.dataset.nodeId;
      draggingId = selectedId;
      nodeEl.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });

    overlay.addEventListener("pointermove", event => {
      if (!draggingId) return;
      const stage = document.querySelector(".gd-map-calibrate-stage");
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const x = pct(Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)));
      const y = pct(Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)));
      draft[draggingId] = { x, y };

      if (!dragRaf) {
        dragRaf = requestAnimationFrame(() => {
          dragRaf = null;
          refreshOverlay();
        });
      }
    });

    overlay.addEventListener("pointerup", () => {
      if (draggingId && draft[draggingId]) showToast(`${draggingId}: x:${draft[draggingId].x}, y:${draft[draggingId].y}`);
      draggingId = null;
    });

    overlay.addEventListener("pointercancel", () => { draggingId = null; });
  }

  const baseRender = render;
  window.render = function render(...args) {
    const result = baseRender.apply(this, args);
    renderOverlay();
    return result;
  };
  render = window.render;

  renderOverlay();
})();