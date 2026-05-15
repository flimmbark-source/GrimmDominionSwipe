(() => {
  const FLOAT_BEFORE_TAB_FLIGHT_MS = 2000;

  const destinationForGhost = (ghost) => {
    const text = (ghost.textContent || "").toLowerCase();
    if (ghost.classList.contains("item") && text.includes("route")) return "explore";
    if (ghost.classList.contains("item") && text.includes("tunnel")) return "explore";
    if (ghost.classList.contains("item") && text.includes("villager")) return "explore";
    if (ghost.classList.contains("item") && text.includes("added")) return "explore";
    if (ghost.classList.contains("item")) return "inventory";
    if (ghost.classList.contains("gold")) return "inventory";
    if (ghost.classList.contains("food")) return "inventory";
    if (ghost.classList.contains("time")) return "timer";
    if (ghost.classList.contains("stat")) return "hero";
    if (ghost.classList.contains("status")) return "hero";
    if (ghost.classList.contains("xp")) return "hero";
    if (ghost.classList.contains("damage")) return "party";
    if (ghost.classList.contains("heal")) return "party";
    if (ghost.classList.contains("noise")) return "log";
    return "hero";
  };

  const tabForDestination = (destination) => ({
    explore: "Explore",
    hero: "Hero",
    party: "Party",
    inventory: "Inventory",
    log: "Log",
  }[destination] || "Hero");

  const findDestinationTarget = (destination) => {
    if (destination === "timer") return document.querySelector(".gd-card-timer") || document.querySelector(".gd-timer:not(.red)");
    const label = tabForDestination(destination);
    return [...document.querySelectorAll(".gd-tab")].find((node) =>
      (node.textContent || "").includes(label)
    );
  };

  const pulseTarget = (destination, delay = 1850) => {
    window.setTimeout(() => {
      const target = findDestinationTarget(destination);
      if (!target) return;
      target.classList.remove(destination === "timer" ? "ghost-timer-pulse" : "ghost-target-pulse");
      void target.offsetWidth;
      target.classList.add(destination === "timer" ? "ghost-timer-pulse" : "ghost-target-pulse");
    }, delay);
  };

  const portalGhost = (ghost) => {
    if (ghost.dataset.portalSet) return;
    ghost.dataset.portalSet = "true";
    const destination = destinationForGhost(ghost);
    ghost.dataset.destination = destination;

    window.setTimeout(() => {
      if (!ghost.isConnected) return;
      const rect = ghost.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const target = findDestinationTarget(destination);
      const targetRect = target?.getBoundingClientRect();
      const clone = ghost.cloneNode(true);

      clone.className = ghost.className;
      clone.classList.add("gd-ghost-portal", `to-${destination}`);
      clone.classList.remove("gd-reward-ghost");
      clone.style.left = `${rect.left + rect.width / 2}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.bottom = "auto";
      clone.style.setProperty("--handoff-target-x", `${targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2}px`);
      clone.style.setProperty("--handoff-target-y", `${targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight - 32}px`);

      document.body.appendChild(clone);
      ghost.style.visibility = "hidden";
      pulseTarget(destination, 2100);
      clone.addEventListener("animationend", () => clone.remove(), { once: true });
    }, FLOAT_BEFORE_TAB_FLIGHT_MS);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.classList.contains("gd-reward-ghost")) portalGhost(node);
        node.querySelectorAll?.(".gd-reward-ghost").forEach(portalGhost);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
