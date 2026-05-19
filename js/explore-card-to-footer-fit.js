// Original Explore layout helper: make the event card's bottom edge sit directly above the Goblin bar.
// The art/body divider is calculated once per card/height so the full description has room above the choices.
(() => {
  const params = new URLSearchParams(window.location.search);
  const visibleMapMode = params.get("mapExplore") === "1" || params.get("mapCalibrate") === "1";
  if (visibleMapMode) return;

  const READY_FLAG = "EXPLORE_CARD_TO_FOOTER_FIT";
  if (window[READY_FLAG]) return;
  window[READY_FLAG] = true;

  let queued = false;
  const layoutCache = new Map();

  function setImportant(el, prop, value) {
    if (!el) return;
    if (el.style.getPropertyValue(prop) === value && el.style.getPropertyPriority(prop) === "important") return;
    el.style.setProperty(prop, value, "important");
  }

  function px(n) {
    return `${Math.max(0, Math.round(n))}px`;
  }

  function rectHeight(el) {
    return el?.getBoundingClientRect?.().height || 0;
  }

  function stablePreferredArtHeight(targetHeight) {
    if (targetHeight < 430) return 118;
    if (targetHeight < 500) return 132;
    if (targetHeight < 570) return 150;
    if (targetHeight < 650) return 168;
    return 186;
  }

  function minimumArtHeight(targetHeight) {
    if (targetHeight < 430) return 74;
    if (targetHeight < 500) return 88;
    return 104;
  }

  function layoutKey(card, targetHeight) {
    const title = card.querySelector(".gd-card-title")?.textContent || "";
    const text = card.querySelector(".gd-card-text")?.textContent || "";
    const heightBucket = Math.round(targetHeight / 4) * 4;
    return `${game?.currentCardId || title}|${heightBucket}|${title.length}|${text.length}`;
  }

  function prepareTextForMeasurement(text, targetHeight) {
    if (!text) return;
    setImportant(text, "display", "block");
    setImportant(text, "-webkit-line-clamp", "unset");
    setImportant(text, "overflow", "visible");
    setImportant(text, "max-height", "none");
    setImportant(text, "line-height", targetHeight < 500 ? "1.22" : "1.3");
    setImportant(text, "font-size", targetHeight < 500 ? "13px" : "14px");
    setImportant(text, "margin-bottom", "0px");
    setImportant(text, "flex", "0 0 auto");
  }

  function computeStableLayout(card, targetHeight) {
    const key = layoutKey(card, targetHeight);
    const cached = layoutCache.get(key);
    if (cached) return cached;

    const body = card.querySelector(".gd-card-body");
    const badge = card.querySelector(".gd-card-badge");
    const title = card.querySelector(".gd-card-title");
    const text = card.querySelector(".gd-card-text");
    const choices = card.querySelector(".gd-choice-row");
    const activeFooter = choices || card.querySelector(".gd-action-result");

    const paddingTop = targetHeight < 500 ? 16 : 20;
    const paddingBottom = 10;
    const badgeGap = badge ? 6 : 0;
    const titleGap = targetHeight < 500 ? 8 : 10;
    const textToChoicesBuffer = targetHeight < 500 ? 14 : 20;
    const preferredArtHeight = stablePreferredArtHeight(targetHeight);
    const minArtHeight = minimumArtHeight(targetHeight);

    if (body) {
      setImportant(body, "display", "flex");
      setImportant(body, "flex-direction", "column");
      setImportant(body, "padding-top", px(paddingTop));
      setImportant(body, "padding-bottom", px(paddingBottom));
      setImportant(body, "overflow", "hidden");
    }

    if (title) setImportant(title, "margin-bottom", "0px");
    prepareTextForMeasurement(text, targetHeight);

    const fullTextHeight = text?.scrollHeight || rectHeight(text);
    const footerHeight = rectHeight(activeFooter);
    const bodyNeed = paddingTop
      + rectHeight(badge)
      + badgeGap
      + rectHeight(title)
      + titleGap
      + fullTextHeight
      + textToChoicesBuffer
      + footerHeight
      + paddingBottom;

    const rawArtHeight = targetHeight - bodyNeed;
    const artHeight = Math.max(minArtHeight, Math.min(preferredArtHeight, rawArtHeight));
    const bodyHeight = Math.max(0, targetHeight - artHeight);
    const layout = { artHeight, bodyHeight, textToChoicesBuffer, paddingTop, paddingBottom };
    layoutCache.set(key, layout);
    return layout;
  }

  function fitExploreCardToFooter() {
    queued = false;

    const screen = document.querySelector(".gd-main-scroll");
    if (!screen || !screen.querySelector(":scope > .gd-card") || !screen.querySelector(":scope > .gd-footer-chip")) return;

    const card = screen.querySelector(":scope > .gd-card");
    const footer = screen.querySelector(":scope > .gd-footer-chip");
    const body = card.querySelector(".gd-card-body");
    const art = card.querySelector(".gd-card-art");
    const timer = card.querySelector(".gd-card-timer");
    const title = card.querySelector(".gd-card-title");
    const text = card.querySelector(".gd-card-text");
    const choices = card.querySelector(".gd-choice-row");
    const result = card.querySelector(".gd-action-result");

    const cardTop = card.getBoundingClientRect().top;
    const footerTop = footer.getBoundingClientRect().top;
    const targetHeight = Math.round(footerTop - cardTop);
    if (targetHeight < 280) return;

    const { artHeight, bodyHeight, textToChoicesBuffer, paddingTop, paddingBottom } = computeStableLayout(card, targetHeight);
    const timerHeight = timer?.getBoundingClientRect?.().height || 76;

    setImportant(card, "height", px(targetHeight));
    setImportant(card, "min-height", px(targetHeight));
    setImportant(card, "max-height", px(targetHeight));
    setImportant(card, "display", "grid");
    setImportant(card, "grid-template-rows", `${px(artHeight)} minmax(0, 1fr)`);
    setImportant(card, "overflow", "hidden");

    if (art) {
      setImportant(art, "height", "auto");
      setImportant(art, "min-height", "0");
    }

    if (timer) {
      setImportant(timer, "top", px(artHeight - timerHeight / 2));
      setImportant(timer, "left", "50%");
      setImportant(timer, "transform", "translateX(-50%)");
      setImportant(timer, "z-index", "7");
    }

    if (body) {
      setImportant(body, "height", px(bodyHeight));
      setImportant(body, "min-height", "0");
      setImportant(body, "display", "flex");
      setImportant(body, "flex-direction", "column");
      setImportant(body, "padding-top", px(paddingTop));
      setImportant(body, "padding-bottom", px(paddingBottom));
      setImportant(body, "overflow", "hidden");
    }

    if (title) {
      setImportant(title, "margin-bottom", targetHeight < 500 ? "8px" : "10px");
      setImportant(title, "flex-shrink", "0");
    }

    if (text) {
      prepareTextForMeasurement(text, targetHeight);
      setImportant(text, "margin-bottom", px(textToChoicesBuffer));
      setImportant(text, "flex-shrink", "0");
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

  function scheduleFit(force = false) {
    if (queued && !force) return;
    queued = true;
    requestAnimationFrame(fitExploreCardToFooter);
  }

  const baseRender = window.render || (typeof render !== "undefined" ? render : null);
  if (baseRender && !baseRender.__exploreCardToFooterFitWrapped) {
    const wrapped = function renderWithExploreCardToFooterFit(...args) {
      const out = baseRender.apply(this, args);
      scheduleFit(true);
      return out;
    };
    wrapped.__exploreCardToFooterFitWrapped = true;
    window.render = wrapped;
    try { render = wrapped; } catch (_) {}
  }

  window.addEventListener("resize", () => {
    layoutCache.clear();
    scheduleFit(true);
  });
  window.addEventListener("orientationchange", () => {
    layoutCache.clear();
    scheduleFit(true);
  });
  scheduleFit(true);
})();