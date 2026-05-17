// Applies visual-only label offsets for the full-map calibration overlay.
// Explore node/line display offsets are rendered directly by map-encounter-overlay.js.
(() => {
  const nodes = () => window.VILLAGE_NODE_MAP?.nodes || {};

  function nodeDef(id) {
    return nodes()[id];
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

  const baseRender = render;
  window.render = function render(...args) {
    const result = baseRender.apply(this, args);
    applyCalibrationLabelOffsets();
    requestAnimationFrame(applyCalibrationLabelOffsets);
    return result;
  };
  render = window.render;

  document.addEventListener("click", event => {
    if (event.target.closest(".gd-map-calibrate-tab, .gd-map-calibrate-actions, .gd-map-calibrate-node")) {
      requestAnimationFrame(applyCalibrationLabelOffsets);
    }
  }, true);

  applyCalibrationLabelOffsets();
  requestAnimationFrame(applyCalibrationLabelOffsets);
})();