// Keeps the current/player node visually centered after display offsets are applied.
// Neighbor nodes keep their displayOffset; only the active node anchors to the camera center.
(() => {
  const READY_FLAG = "VILLAGE_CURRENT_NODE_ANCHOR";
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  function currentNodeId() {
    return game?.hero?.currentNodeId || window.VILLAGE_NODE_MAP?.startNodeId;
  }

  function anchorCurrentNode() {
    if (!window.VILLAGE_NODE_MAP?.nodes || game?.pendingNodeMove || game?.activeEncounter) return;
    const map = document.querySelector(".gd-focused-node-map");
    const id = currentNodeId();
    if (!map || !id) return;

    const current = map.querySelector(`.gd-map-node.current[data-node-id="${id}"]`);
    if (current) {
      current.style.left = "50%";
      current.style.top = "50%";
      current.classList.add("camera-anchor");
    }

    map.querySelectorAll(".gd-map-line-layer line[data-edge-id]").forEach(line => {
      const [aId, bId] = (line.dataset.edgeId || "").split("--");
      if (aId === id) {
        line.setAttribute("x1", "50");
        line.setAttribute("y1", "50");
      }
      if (bId === id) {
        line.setAttribute("x2", "50");
        line.setAttribute("y2", "50");
      }
    });
  }

  function scheduleAnchor() {
    anchorCurrentNode();
    requestAnimationFrame(anchorCurrentNode);
  }

  const baseRender = render;
  window.render = function render(...args) {
    const result = baseRender.apply(this, args);
    scheduleAnchor();
    return result;
  };
  render = window.render;

  const root = document.getElementById("app") || document.body;
  new MutationObserver(scheduleAnchor).observe(root, { childList: true, subtree: true });

  scheduleAnchor();
})();