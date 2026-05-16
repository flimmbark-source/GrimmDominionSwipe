// Removes the old Swipe to Choose text now that the whole card is draggable.
(() => {
  const baseRenderExplore = typeof renderExplore === "function" ? renderExplore : null;
  if (!baseRenderExplore) return;

  window.renderExplore = function renderExplore() {
    return baseRenderExplore().replace(`<div class="gd-swipe-label">Swipe to Choose</div>`, "");
  };
  renderExplore = window.renderExplore;

  if (typeof render === "function") render();
})();
