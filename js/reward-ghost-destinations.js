(() => {
  const FLOAT_BEFORE_TAB_FLIGHT_MS = 2000;
  const STACK_GAP_PX = 18;

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
    if (ghost.classList.contains("damage")) return "hp";
    if (ghost.classList.contains("heal")) return "hp";
    if (ghost.classList.contains("stat")) return "hero";
    if (ghost.classList.contains("status")) return "hero";
    if (ghost.classList.contains("xp")) return "hero";
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
    if (destination === "hp") return document.querySelector(".gd-inline-hp") || [...document.querySelectorAll(".gd-meter")].find(node => node.textContent?.includes("Party Health"));
    const label = tabForDestination(destination);
    return [...document.querySelectorAll(".gd-tab")].find((node) =>
      (node.textContent || "").includes(label)
    );
  };

  const activeStackIndex = (destination) => {
    const active = [...document.querySelectorAll(`.gd-ghost-portal[data-destination="${destination}"]`)];
    return active.length;
  };

  const targetPoint = (destination, targetRect, stackIndex) => {
    const fallbackX = window.innerWidth / 2;
    const fallbackY = destination === "timer" ? window.innerHeight * 0.38 : window.innerHeight - 32;
    const baseX = targetRect ? targetRect.left + targetRect.width / 2 : fallbackX;
    const baseY = targetRect ? targetRect.top + targetRect.height / 2 : fallbackY;
    const stackDirection = destination === "timer" || destination === "hp" ? 1 : -1;
    const smallFan = (stackIndex % 2 === 0 ? -1 : 1) * Math.min(5, Math.floor(stackIndex / 2) * 2);

    return {
      x: baseX + smallFan,
      y: baseY + stackDirection * stackIndex * STACK_GAP_PX,
    };
  };

  const pulseTarget = (destination, delay = 1850) => {
    window.setTimeout(() => {
      const target = findDestinationTarget(destination);
      if (!target) return;
      const pulseClass = destination === "timer" ? "ghost-timer-pulse" : destination === "hp" ? "ghost-hp-pulse" : "ghost-target-pulse";
      target.classList.remove(pulseClass);
      void target.offsetWidth;
      target.classList.add(pulseClass);
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
      const stackIndex = activeStackIndex(destination);
      const point = targetPoint(destination, targetRect, stackIndex);

      clone.className = ghost.className;
      clone.classList.add("gd-ghost-portal", `to-${destination}`);
      clone.classList.remove("gd-reward-ghost");
      clone.dataset.destination = destination;
      clone.style.left = `${rect.left + rect.width / 2}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.bottom = "auto";
      clone.style.setProperty("--handoff-target-x", `${point.x}px`);
      clone.style.setProperty("--handoff-target-y", `${point.y}px`);

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
