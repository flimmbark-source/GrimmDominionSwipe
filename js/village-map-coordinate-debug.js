// Loads calibrated map coordinates/location graph/taxonomy/display/event/icon tools, and adds ?mapDebug=1 tools when requested.
(() => {
  function scriptAlreadyLoaded(dataKey, readyFlag) {
    return Boolean(window[readyFlag] || document.querySelector(`script[${dataKey}]`));
  }

  function loadMapUtilityScript(src, dataKey, readyFlag, done = () => {}) {
    if (scriptAlreadyLoaded(dataKey, readyFlag)) {
      done();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.setAttribute(dataKey, "true");
    script.onload = done;
    script.onerror = done;
    document.body.appendChild(script);
  }

  function loadUtilitySequence(items, done = () => {}) {
    const [next, ...rest] = items;
    if (!next) {
      done();
      return;
    }
    loadMapUtilityScript(next.src, next.dataKey, next.readyFlag, () => loadUtilitySequence(rest, done));
  }

  const params = new URLSearchParams(window.location.search);
  const visibleMapMode = params.get("mapExplore") === "1" || params.get("mapCalibrate") === "1";

  const baseUtilities = [
    { src: "js/village-map-image-coordinates.js", dataKey: "data-village-image-coords", readyFlag: "VILLAGE_IMAGE_COORDS" },
    { src: "js/village-location-inventory.js", dataKey: "data-village-location-inventory", readyFlag: "VILLAGE_LOCATION_INVENTORY" },
    { src: "js/village-location-graph-runtime.js", dataKey: "data-village-location-graph-runtime", readyFlag: "VILLAGE_LOCATION_GRAPH_ACTIVE" },
    { src: "js/village-node-icons.js", dataKey: "data-village-node-icons", readyFlag: "VILLAGE_NODE_ICONS" },
    { src: "js/village-card-taxonomy.js", dataKey: "data-village-card-taxonomy", readyFlag: "VILLAGE_CARD_TAXONOMY" },
    { src: "js/village-node-event-taxonomy-runtime.js", dataKey: "data-village-node-event-taxonomy-runtime", readyFlag: "VILLAGE_NODE_EVENT_TAXONOMY_RUNTIME" },
    { src: "js/village-node-event-exhaustion.js", dataKey: "data-village-node-event-exhaustion", readyFlag: "VILLAGE_NODE_EVENT_EXHAUSTION" },
  ];

  const modeUtilities = visibleMapMode
    ? [
      { src: "js/village-node-display-overrides.js", dataKey: "data-village-node-display-overrides", readyFlag: "VILLAGE_NODE_DISPLAY_OVERRIDES" },
      { src: "js/village-node-display-runtime.js", dataKey: "data-village-node-display-runtime", readyFlag: "VILLAGE_NODE_DISPLAY_RUNTIME" },
      { src: "js/village-current-node-anchor.js", dataKey: "data-village-current-node-anchor", readyFlag: "VILLAGE_CURRENT_NODE_ANCHOR" },
    ]
    : [
      { src: "js/hidden-map-card-flow.js", dataKey: "data-hidden-map-card-flow", readyFlag: "HIDDEN_MAP_CARD_FLOW" },
    ];

  loadUtilitySequence([...baseUtilities, ...modeUtilities], () => {
    render?.();
  });

  const enabled = params.get("mapDebug") === "1";
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