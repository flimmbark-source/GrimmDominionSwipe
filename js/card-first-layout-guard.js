// Keeps the card-first Explore layout class applied even when older prototype render wrappers
// replace the Explore DOM after the hidden-map renderer has already produced the right layout.
(() => {
  const READY_FLAG = "CARD_FIRST_LAYOUT_GUARD";
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  function isCardFirstExploreContainer(el) {
    return Boolean(
      el &&
      el.classList?.contains("gd-main-scroll") &&
      el.querySelector(":scope > .gd-card") &&
      el.querySelector(":scope > .gd-footer-chip")
    );
  }

  function applyCardFirstClass() {
    document.querySelectorAll(".gd-main-scroll").forEach(el => {
      if (isCardFirstExploreContainer(el)) el.classList.add("gd-card-first-explore");
    });
  }

  function scheduleApply() {
    applyCardFirstClass();
    requestAnimationFrame(applyCardFirstClass);
    setTimeout(applyCardFirstClass, 0);
    setTimeout(applyCardFirstClass, 80);
    setTimeout(applyCardFirstClass, 250);
  }

  const baseRender = window.render || (typeof render !== "undefined" ? render : null);
  if (baseRender && !baseRender.__cardFirstLayoutGuardWrapped) {
    const wrapped = function renderWithCardFirstLayoutGuard(...args) {
      const result = baseRender.apply(this, args);
      scheduleApply();
      return result;
    };
    wrapped.__cardFirstLayoutGuardWrapped = true;
    window.render = wrapped;
    try { render = wrapped; } catch (_) {}
  }

  const root = document.getElementById("app") || document.body;
  new MutationObserver(scheduleApply).observe(root, { childList: true, subtree: true });

  scheduleApply();
})();