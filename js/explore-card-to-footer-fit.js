// Original Explore layout helper: make the event card's bottom edge sit directly above the Goblin bar.
// The art/body divider and player timer move upward when card text needs more room.
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

  function rectHeight(el) {
    return el?.getBoundingClientRect?.().height || 0;
  }

  function computeBodyNeed(card, targetHeight) {
    const body = card.querySelector(".gd-card-body");
    const badge = card.querySelector(".gd-card-badge");
    const title = card.querySelector(".gd-card-title");
    const text = card.querySelector(".gd-card-text");
    const choices = card.querySelector(".gd-choice-row");
    const result = card.querySelector(".gd-action-result");
    const activeFooter = result || choices;

    if (text) {
      setImportant(text, "display", "block");
      setImportant(text, "-webkit-line-clamp", "unset");
      setImportant(text, "overflow", "visible");
      setImportant(text, "margin-bottom", "0");
    }

    const bodyStyle = body ? getComputedStyle(body) : null;
    const paddingTop = bodyStyle ? parseFloat(bodyStyle.paddingTop) || 0 : 28;
    const paddingBottom = bodyStyle ? parseFloat(bodyStyle.paddingBottom) || 0 : 18;
    const titleGap = 12;
    const textToChoicesBuffer = targetHeight < 520 ? 16 : 24;
    const safeTextHeight = Math.min(text?.scrollHeight || rectHeight(text), targetHeight * 0.24);

    const need = paddingTop
      + rectHeight(badge)
      + (badge ? 6 : 0)
      + rectHeight(title)
      + titleGap
      + safeTextHeight
      + textToChoicesBuffer
      + rectHeight(activeFooter)
      + paddingBottom;

    return { need, textToChoicesBuffer };
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
    const choices = card.querySelector(".gd-choice-row");
    const result = card.querySelector(".gd-action-result");
    const text = card.querySelector(".gd-card-text");

    const cardTop = card.getBoundingClientRect().top;
    const footerTop = footer.getBoundingClientRect().top;
    const targetHeight = footerTop - cardTop;
    if (targetHeight < 280) return;

    const { need: bodyNeed, textToChoicesBuffer } = computeBodyNeed(card, targetHeight);
    const minArt = targetHeight < 500 ? 118 : 138;
    const maxArt = Math.min(targetHeight * 0.48, targetHeight - 230);
    const rawArtHeight = targetHeight - bodyNeed;
    const artHeight = Math.max(minArt, Math.min(maxArt, rawArtHeight));
    const timerHeight = timer?.getBoundingClientRect?.().height || 76;

    setImportant(card, "height", px(targetHeight));
    setImportant(card, "min-height", px(targetHeight));
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
      setImportant(body, "display", "flex");
      setImportant(body, "flex-direction", "column");
      setImportant(body, "min-height", "0");
      setImportant(body, "overflow", "hidden");
      setImportant(body, "padding-top", targetHeight < 500 ? "18px" : "22px");
      setImportant(body, "padding-bottom", "10px");
    }

    if (text) {
      setImportant(text, "display", "block");
      setImportant(text, "-webkit-line-clamp", "unset");
      setImportant(text, "overflow", "visible");
      setImportant(text, "margin-bottom", px(textToChoicesBuffer));
      setImportant(text, "flex", "0 1 auto");
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