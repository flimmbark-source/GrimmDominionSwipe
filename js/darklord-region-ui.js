// Adds readable Dark Lord pressure info to region nodes.
(() => {
  const patchRegionNodes = () => {
    if (!game?.regions) return;
    document.querySelectorAll("[data-region]").forEach(node => {
      const region = game.regions[node.dataset.region];
      const button = node.querySelector("button");
      if (!region || !button || button.querySelector(".gd-region-pressure")) return;
      const threats = (region.threats || []).map(active => window.DARK_THREATS?.[active.id]?.title || active.id);
      const pressure = document.createElement("div");
      pressure.className = "gd-region-pressure";
      pressure.innerHTML = `<span>Noise: ${window.noiseLabel?.(region.noise || 0) || region.noise || 0}</span><span>Corruption: ${window.corruptionLabel?.(region.corruption || 0) || region.corruption || 0}</span>${threats.length ? `<span>Threats: ${threats.join(", ")}</span>` : ""}`;
      button.appendChild(pressure);
    });
  };

  const baseRender = render;
  window.render = function(...args) {
    const result = baseRender.apply(this, args);
    patchRegionNodes();
    return result;
  };
  render = window.render;
  render();
})();
