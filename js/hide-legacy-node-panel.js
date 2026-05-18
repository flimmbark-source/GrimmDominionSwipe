// Hides the old inline node-map panel during normal card-first Explore.
// The hidden map can still drive card selection underneath; this only removes the visible legacy panel.
(() => {
  const params = new URLSearchParams(window.location.search);
  const showLegacyPanel = params.get("legacyNodePanel") === "1";
  if (showLegacyPanel) return;

  const PANEL_PATTERN = /<section class="gd-node-map-panel">[\s\S]*?<\/section>(?=<section class="gd-region-header">)/;

  function stripLegacyPanel(html) {
    return typeof html === "string" ? html.replace(PANEL_PATTERN, "") : html;
  }

  function install(attempt = 0) {
    const currentRenderExplore = window.renderExplore || (typeof renderExplore !== "undefined" ? renderExplore : null);
    if (!currentRenderExplore) {
      if (attempt < 20) setTimeout(() => install(attempt + 1), 40);
      return;
    }

    if (currentRenderExplore.__legacyNodePanelHidden) return;

    const wrapped = function renderExploreWithoutLegacyNodePanel(...args) {
      return stripLegacyPanel(currentRenderExplore.apply(this, args));
    };
    wrapped.__legacyNodePanelHidden = true;
    wrapped.__baseRenderExplore = currentRenderExplore;

    window.renderExplore = wrapped;
    try { renderExplore = wrapped; } catch (_) {}

    render?.();
  }

  const baseRender = render;
  window.render = function render(...args) {
    const result = baseRender.apply(this, args);
    const app = document.getElementById("app");
    const panel = app?.querySelector(".gd-node-map-panel");
    if (panel) panel.remove();
    return result;
  };
  try { render = window.render; } catch (_) {}

  install();
})();