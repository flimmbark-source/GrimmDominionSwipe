// Deterministic layout for card-first Explore.
// Pins the Goblin Outlaw footer directly above the nav and stretches the event card to it.
(() => {
  const params = new URLSearchParams(window.location.search);
  const visibleMapMode = params.get("mapExplore") === "1" || params.get("mapCalibrate") === "1";
  if (visibleMapMode) return;

  let fitQueued = false;
  let lateFitTimer = null;

  function px(value) { return `${Math.max(0, Math.round(value))}px`; }

  function setImportant(el, prop, value) {
    if (!el) return;
    if (el.style.getPropertyValue(prop) === value && el.style.getPropertyPriority(prop) === "important") return;
    el.style.setProperty(prop, value, "important");
  }

  function markCardFirstExploreContainers() {
    document.querySelectorAll(".gd-main-scroll").forEach(screen => {
      const isCardExplore = Boolean(
        screen.querySelector(":scope > .gd-card") &&
        screen.querySelector(":scope > .gd-footer-chip")
      );
      if (isCardExplore && !screen.classList.contains("gd-card-first-explore")) {
        screen.classList.add("gd-card-first-explore");
      }
    });
  }

  function fitCardFirstExplore() {
    fitQueued = false;
    markCardFirstExploreContainers();

    const screen = document.querySelector(".gd-card-first-explore");
    if (!screen) return;

    const phone = screen.closest(".gd-phone");
    const card = screen.querySelector(":scope > .gd-card");
    const footer = screen.querySelector(":scope > .gd-footer-chip");
    if (!phone || !card || !footer) return;

    const cardRect = card.getBoundingClientRect();
    const footerHeight = window.matchMedia("(max-height: 700px)").matches ? 46 : 50;
    const sideInset = 14;

    setImportant(phone, "position", "relative");
    setImportant(screen, "position", "relative");
    setImportant(screen, "height", "100%");
    setImportant(screen, "min-height", "0");
    setImportant(screen, "overflow", "hidden");
    setImportant(screen, "padding-bottom", px(footerHeight));

    setImportant(footer, "position", "absolute");
    setImportant(footer, "left", px(sideInset));
    setImportant(footer, "right", px(sideInset));
    setImportant(footer, "bottom", "0");
    setImportant(footer, "height", px(footerHeight));
    setImportant(footer, "margin", "0");
    setImportant(footer, "z-index", "8");

    const footerTop = screen.getBoundingClientRect().bottom - footerHeight;
    const targetCardHeight = footerTop - cardRect.top;
    if (targetCardHeight > 260) {
      setImportant(card, "height", px(targetCardHeight));
      setImportant(card, "min-height", px(targetCardHeight));
      setImportant(card, "margin-bottom", "0");
      setImportant(card, "overflow", "hidden");
    }
  }

  function scheduleFit() {
    if (!fitQueued) {
      fitQueued = true;
      requestAnimationFrame(fitCardFirstExplore);
    }
    clearTimeout(lateFitTimer);
    lateFitTimer = setTimeout(() => requestAnimationFrame(fitCardFirstExplore), 120);
  }

  const baseRender = window.render || (typeof render !== "undefined" ? render : null);
  if (baseRender && !baseRender.__cardFirstExploreLayoutWrapped) {
    const wrapped = function renderWithCardFirstExploreLayout(...args) {
      const result = baseRender.apply(this, args);
      scheduleFit();
      return result;
    };
    wrapped.__cardFirstExploreLayoutWrapped = true;
    window.render = wrapped;
    try { render = wrapped; } catch (_) {}
  }

  window.addEventListener("resize", scheduleFit);
  window.addEventListener("orientationchange", scheduleFit);

  const root = document.getElementById("app") || document.body;
  new MutationObserver(scheduleFit).observe(root, { childList: true, subtree: true });

  scheduleFit();
})();