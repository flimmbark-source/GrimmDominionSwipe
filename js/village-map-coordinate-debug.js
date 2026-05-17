// Loads calibrated map coordinates/connections/taxonomy/display tools, and adds ?mapDebug=1 tools when requested.
(() => {
  function loadMapUtilityScript(src, dataKey, readyFlag) {
    if (window[readyFlag] || document.querySelector(`script[${dataKey}]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.setAttribute(dataKey, "true");
    document.body.appendChild(script);
  }

  loadMapUtilityScript("js/village-map-image-coordinates.js", "data-village-image-coords", "VILLAGE_IMAGE_COORDS");
  loadMapUtilityScript("js/village-node-taxonomy.js", "data-village-node-taxonomy", "VILLAGE_NODE_TAXONOMY");
  loadMapUtilityScript("js/village-card-taxonomy.js", "data-village-card-taxonomy", "VILLAGE_CARD_TAXONOMY");
  loadMapUtilityScript("js/village-node-display-overrides.js", "data-village-node-display-overrides", "VILLAGE_NODE_DISPLAY_OVERRIDES");
  loadMapUtilityScript("js/village-map-connection-overrides.js", "data-village-connection-overrides", "VILLAGE_CONNECTION_OVERRIDES");
  loadMapUtilityScript("js/village-node-display-runtime.js", "data-village-node-display-runtime", "VILLAGE_NODE_DISPLAY_RUNTIME");

  const enabled = new URLSearchParams(window.location.search).get("mapDebug") === "1";
  if (!enabled) return;

  document.documentElement.classList.add("map-debug");

  const injectLabels = () => {
    const map = document.querySelector(".gd-node-map");
    if (!window.VILLAGE_NODE_MAP || !map || map.dataset.debugBound) return;
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