// Keeps the zoomed PNG background aligned with the node projection.
// CSS background-position percentages do not directly mean "center this image coordinate".
// This converts the current camera coordinate into the background-position value that
// places that image coordinate at the center of the map viewport, matching projectNode().
(() => {
  const LOCAL_ZOOM = 2.45;
  const MAP_ZOOM_PERCENT = `${LOCAL_ZOOM * 100}%`;
  const WALK_MS = 560;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const map = () => window.VILLAGE_NODE_MAP;
  const nodeDef = id => map()?.nodes?.[id];
  const currentNodeId = () => game?.hero?.currentNodeId || map()?.startNodeId;

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
    return {
      x: from.x + (to.x - from.x) * eased,
      y: from.y + (to.y - from.y) * eased,
    };
  }

  function centeredBackgroundPosition(imageCoordinate) {
    return (50 - LOCAL_ZOOM * imageCoordinate) / (1 - LOCAL_ZOOM);
  }

  function applyMapProjection() {
    const camera = cameraPoint();
    const bgX = centeredBackgroundPosition(camera.x);
    const bgY = centeredBackgroundPosition(camera.y);

    document.querySelectorAll(".gd-focused-node-map").forEach(mapEl => {
      mapEl.style.setProperty("--map-focus-x", `${bgX}%`);
      mapEl.style.setProperty("--map-focus-y", `${bgY}%`);
      mapEl.style.setProperty("background-size", MAP_ZOOM_PERCENT, "important");
    });
  }

  function runWhileMoving() {
    applyMapProjection();
    if (game?.pendingNodeMove) requestAnimationFrame(runWhileMoving);
  }

  const baseRender = render;
  window.render = function render(...args) {
    const result = baseRender.apply(this, args);
    applyMapProjection();
    requestAnimationFrame(applyMapProjection);
    return result;
  };
  render = window.render;

  const baseMoveHeroToNode = window.moveHeroToNode;
  if (typeof baseMoveHeroToNode === "function") {
    window.moveHeroToNode = function moveHeroToNodeWithProjection(...args) {
      const result = baseMoveHeroToNode.apply(this, args);
      applyMapProjection();
      requestAnimationFrame(runWhileMoving);
      return result;
    };
  }

  applyMapProjection();
})();