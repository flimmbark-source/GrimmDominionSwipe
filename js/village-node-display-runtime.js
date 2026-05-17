// Applies visual-only display offsets after map render.
// True node x/y remain unchanged for camera and coordinate calibration.
(() => {
  const LOCAL_ZOOM = 2.45;
  const WALK_MS = 560;

  const nodes = () => window.VILLAGE_NODE_MAP?.nodes || {};
  const currentNodeId = () => game?.hero?.currentNodeId || window.VILLAGE_NODE_MAP?.startNodeId;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function nodeDef(id) {
    return nodes()[id];
  }

  function offsetFor(id) {
    const offset = nodeDef(id)?.displayOffset || { x: 0, y: 0 };
    return { x: Number(offset.x) || 0, y: Number(offset.y) || 0 };
  }

  function cameraPoint() {
    const move = game?.pendingNodeMove;
    if (!move) {
      const current = nodeDef(currentNodeId());
      return current ? { x: current.x, y: current.y } : { x: 50, y: 50 };
    }
    const from = nodeDef(move.from);
    const to = nodeDef(move.to);
    if (!from || !to) return { x: 50, y: 50 };
    const t = clamp((performance.now() - move.startedAt) / WALK_MS, 0, 1);
    const eased = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased };
  }

  function project(id, camera) {
    const node = nodeDef(id);
    if (!node) return null;
    const offset = offsetFor(id);
    return {
      x: 50 + (node.x + offset.x - camera.x) * LOCAL_ZOOM,
      y: 50 + (node.y + offset.y - camera.y) * LOCAL_ZOOM,
    };
  }

  function applyExploreOffsets() {
    const map = document.querySelector(".gd-focused-node-map");
    if (!map || !window.VILLAGE_NODE_MAP?.nodes) return;
    const camera = cameraPoint();

    map.querySelectorAll(".gd-map-node[data-node-id]").forEach(button => {
      const id = button.dataset.nodeId;
      const point = project(id, camera);
      if (!point) return;
      button.style.left = `${point.x}%`;
      button.style.top = `${point.y}%`;
    });

    map.querySelectorAll(".gd-map-line-layer line[data-edge-id]").forEach(line => {
      const [aId, bId] = (line.dataset.edgeId || "").split("--");
      const a = project(aId, camera);
      const b = project(bId, camera);
      if (!a || !b) return;
      line.setAttribute("x1", a.x);
      line.setAttribute("y1", a.y);
      line.setAttribute("x2", b.x);
      line.setAttribute("y2", b.y);
    });
  }

  function applyCalibrationLabelOffsets() {
    document.querySelectorAll(".gd-map-calibrate-node[data-node-id]").forEach(nodeEl => {
      const node = nodeDef(nodeEl.dataset.nodeId);
      const label = nodeEl.querySelector(".gd-map-calibrate-node-label");
      if (!node || !label) return;
      const offset = node.labelOffset || { x: 0, y: 0 };
      label.style.transform = `translate(${Number(offset.x) || 0}px, ${Number(offset.y) || 0}px)`;
    });
  }

  function applyOffsets() {
    applyExploreOffsets();
    applyCalibrationLabelOffsets();
  }

  let frame = null;
  function tickWhileMoving() {
    frame = null;
    applyOffsets();
    if (game?.pendingNodeMove) frame = requestAnimationFrame(tickWhileMoving);
  }

  const baseRender = render;
  window.render = function render(...args) {
    const result = baseRender.apply(this, args);
    applyOffsets();
    requestAnimationFrame(applyOffsets);
    if (game?.pendingNodeMove && !frame) frame = requestAnimationFrame(tickWhileMoving);
    return result;
  };
  render = window.render;

  document.addEventListener("click", event => {
    if (event.target.closest(".gd-map-calibrate-tab, .gd-map-calibrate-actions, .gd-map-calibrate-node")) {
      requestAnimationFrame(applyCalibrationLabelOffsets);
    }
  }, true);

  applyOffsets();
  requestAnimationFrame(applyOffsets);
})();