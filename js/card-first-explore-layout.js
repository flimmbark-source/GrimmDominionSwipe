// Deterministic layout for card-first Explore.
// Pins the Goblin Outlaw footer directly above the nav and stretches the event card to it.
(() => {
  const params = new URLSearchParams(window.location.search);
  const visibleMapMode = params.get("mapExplore") === "1" || params.get("mapCalibrate") === "1";
  if (visibleMapMode) return;

  function px(value) { return `${Math.max(0, Math.round(value))}px`; }

  function markCardFirstExploreContainers() {
    document.querySelectorAll(".gd-main-scroll").forEach(screen => {
      const isCardExplore = Boolean(
        screen.querySelector(":scope > .gd-card") &&
        screen.querySelector(":scope > .gd-footer-chip")
      );
      if (isCardExplore) screen.classList.add("gd-card-first-explore");
    });
  }

  function fitCardFirstExplore() {
    markCardFirstExploreContainers();

    const screen = document.querySelector(".gd-card-first-explore");
    if (!screen) return;

    const phone = screen.closest(".gd-phone");
    const card = screen.querySelector(":scope > .gd-card");
    const footer = screen.querySelector(":scope > .gd-footer-chip");
    const tabs = phone?.querySelector(":scope > .gd-tabs");
    if (!phone || !card || !footer || !tabs) return;

    const phoneRect = phone.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const tabHeight = tabs.getBoundingClientRect().height || 64;
    const footerHeight = window.matchMedia("(max-height: 700px)").matches ? 46 : 50;
    const sideInset = 14;

    phone.style.setProperty("position", "relative", "important");
    screen.style.setProperty("position", "relative", "important");
    screen.style.setProperty("height", "100%", "important");
    screen.style.setProperty("min-height", "0", "important");
    screen.style.setProperty("overflow", "hidden", "important");
    screen.style.setProperty("padding-bottom", px(footerHeight), "important");

    footer.style.setProperty("position", "absolute", "important");
    footer.style.setProperty("left", px(sideInset), "important");
    footer.style.setProperty("right", px(sideInset), "important");
    footer.style.setProperty("bottom", "0", "important");
    footer.style.setProperty("height", px(footerHeight), "important");
    footer.style.setProperty("margin", "0", "important");
    footer.style.setProperty("z-index", "8", "important");

    const footerTop = screen.getBoundingClientRect().bottom - footerHeight;
    const targetCardHeight = footerTop - cardRect.top;
    if (targetCardHeight > 260) {
      card.style.setProperty("height", px(targetCardHeight), "important");
      card.style.setProperty("min-height", px(targetCardHeight), "important");
      card.style.setProperty("margin-bottom", "0", "important");
      card.style.setProperty("overflow", "hidden", "important");
    }
  }

  function scheduleFit() {
    fitCardFirstExplore();
    requestAnimationFrame(fitCardFirstExplore);
    setTimeout(fitCardFirstExplore, 0);
    setTimeout(fitCardFirstExplore, 80);
    setTimeout(fitCardFirstExplore, 240);
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
  new MutationObserver(scheduleFit).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });

  scheduleFit();
})();