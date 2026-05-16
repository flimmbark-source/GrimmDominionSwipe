// Dev helper: add ?mapDebug=1 to show node IDs and log click coordinates for alignment.
(() => {
  const enabled = new URLSearchParams(window.location.search).get("mapDebug") === "1";
  if (!enabled) return;

  document.documentElement.classList.add("map-debug");

  const injectLabels = () => {
    if (!window.VILLAGE_NODE_MAP) return;
    const map = document.querySelector(".gd-node-map");
    if (!map || map.dataset.debugBound) return;
    map.dataset.debugBound = "true";

    Object.entries(window.VILLAGE_NODE_MAP.nodes).forEach(([id, node]) => {
      const label = document.createElement("div");
      label.className = "gd-map-debug-label";
      label.textContent = id;
      label.style.left = `${node.x}%`;
      label.style.top = `${node.y}%`;
      map.appendChild(label);
    });

    map.addEventListener("click", (event) => {
      if (event.target.closest("[data-node-id]")) return;
      const rect = map.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((event.clientY - rect.top) / rect.height * 100).toFixed(1);
      console.log(`Village map coordinate: x:${x}, y:${y}`);
      game.result = `Map coordinate x:${x}, y:${y}`;
      document.querySelector(".gd-result-toast")?.replaceChildren(document.createTextNode(game.result));
    });
  };

  const baseRender = render;
  window.render = function(...args) {
    const result = baseRender.apply(this, args);
    injectLabels();
    return result;
  };
  render = window.render;

  injectLabels();
})();
