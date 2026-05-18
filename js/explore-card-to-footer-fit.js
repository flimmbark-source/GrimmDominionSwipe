// Original Explore layout helper: make the event card's bottom edge sit directly above the Goblin bar.
// This preserves the original renderExplore() markup and only corrects the measured card height after render.
(() => {
  const params = new URLSearchParams(window.location.search);
  const visibleMapMode = params.get("mapExplore") === "1" || params.get("mapCalibrate") === "1";
  if (visibleMapMode) return;

  const READY_FLAG = "EXPLORE_CARD_TO_FOOTER_FIT";
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  let queued = false;

  function setImportant(el, prop, value) {
    if (!el) return;
    if (el.style.getPropertyValue(prop) === value && el.style.getPropertyPriority(prop) === "important") return;
    el.style.setProperty(prop, value, "important");
  }

  function px(n) {
    return `${Math.max(0, Math.round(n))}px`;
  }

  function fitExploreCardToFooter() {
    queued = false;

    const screen = document.querySelector(".gd-main-scroll");
    if (!screen || !screen.querySelector(":scope > .gd-card") || !screen.querySelector(":scope > .gd-footer-chip")) return;

    const card = screen.querySelector(":scope > .gd-card");
    const footer = screen.querySelector(":scope > .gd-footer-chip");
    const body = card.querySelector(".gd-card-body");
    const choices = card.querySelector(".gd-choice-row");
    const result = card.querySelector(".gd-action-result");

    const cardTop = card.getBoundingClientRect().top;
    const footerTop = footer.getBoundingClientRect().top;
    const targetHeight = footerTop - cardTop;
    if (targetHeight < 280) return;

    setImportant(card, "height", px(targetHeight));
    setImportant(card, "min-height", px(targetHeight));
    setImportant(card, "display", "grid");
    setImportant(card, "grid-template-rows", "minmax(210px, 48%) minmax(0, 1fr)");
    setImportant(card, "overflow", "hidden");

    if (body) {
      setImportant(body, "display", "flex");
      setImportant(body, "flex-direction", "column");
      setImportant(body, "min-height", "0");
      setImportant(body, "overflow", "hidden");
    }

    if (choices) {
      setImportant(choices, "margin-top", "auto");
      setImportant(choices, "flex-shrink", "0");
    }

    if (result) {
      setImportant(result, "margin-top", "auto");
      setImportant(result, "flex-shrink", "0");
    }
  }

  function scheduleFit() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      fitExploreCardToFooter();
      setTimeout(fitExploreCardToFooter, 80);
    });
  }

  const baseRender = window.render || (typeof render !== "undefined" ? render : null);
  if (baseRender && !baseRender.__exploreCardToFooterFitWrapped) {
    const wrapped = function renderWithExploreCardToFooterFit(...args) {
      const out = baseRender.apply(this, args);
      scheduleFit();
      return out;
    };
    wrapped.__exploreCardToFooterFitWrapped = true;
    window.render = wrapped;
    try { render = wrapped; } catch (_) {}
  }

  window.addEventListener("resize", scheduleFit);
  window.addEventListener("orientationchange", scheduleFit);
  new MutationObserver(scheduleFit).observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
  scheduleFit();
})();