(() => {
  const destinationForGhost = (ghost) => {
    const text = (ghost.textContent || "").toLowerCase();
    if (ghost.classList.contains("item") && text.includes("route")) return "explore";
    if (ghost.classList.contains("item") && text.includes("tunnel")) return "explore";
    if (ghost.classList.contains("item") && text.includes("villager")) return "explore";
    if (ghost.classList.contains("item")) return "inventory";
    if (ghost.classList.contains("gold")) return "inventory";
    if (ghost.classList.contains("food")) return "inventory";
    if (ghost.classList.contains("stat")) return "hero";
    if (ghost.classList.contains("status")) return "hero";
    if (ghost.classList.contains("time")) return "hero";
    if (ghost.classList.contains("xp")) return "hero";
    if (ghost.classList.contains("damage")) return "party";
    if (ghost.classList.contains("heal")) return "party";
    if (ghost.classList.contains("noise")) return "log";
    return "hero";
  };

  const tabForDestination = (destination) => {
    if (destination === "explore") return "Explore";
    if (destination === "hero") return "Hero";
    if (destination === "party") return "Party";
    if (destination === "inventory") return "Inventory";
    if (destination === "log") return "Log";
    return "Hero";
  };

  const findTab = (destination) => {
    const label = tabForDestination(destination);
    return [...document.querySelectorAll(".gd-tab")].find((node) =>
      (node.textContent || "").includes(label)
    );
  };

  const pulseTab = (destination) => {
    const tab = findTab(destination);
    if (!tab) return;
    window.setTimeout(() => {
      tab.classList.remove("ghost-target-pulse");
      void tab.offsetWidth;
      tab.classList.add("ghost-target-pulse");
    }, 1850);
  };

  const classifyGhost = (ghost) => {
    if (ghost.dataset.destinationSet) return;
    ghost.dataset.destinationSet = "true";
    const destination = destinationForGhost(ghost);
    ghost.dataset.destination = destination;
    ghost.classList.add(`to-${destination}`);
    pulseTab(destination);
  };

  const handoffFlyingGhosts = () => {
    document.querySelectorAll(".gd-reward-ghost").forEach((ghost) => {
      const rect = ghost.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const destination = ghost.dataset.destination || destinationForGhost(ghost);
      const tab = findTab(destination);
      const tabRect = tab?.getBoundingClientRect();
      const clone = ghost.cloneNode(true);

      clone.classList.add("gd-ghost-handoff", `to-${destination}`);
      clone.classList.remove("gd-reward-ghost");
      clone.style.left = `${rect.left + rect.width / 2}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.bottom = "auto";
      clone.style.setProperty("--handoff-target-x", `${tabRect ? tabRect.left + tabRect.width / 2 : window.innerWidth / 2}px`);
      clone.style.setProperty("--handoff-target-y", `${tabRect ? tabRect.top + tabRect.height / 2 : window.innerHeight - 32}px`);

      document.body.appendChild(clone);
      clone.addEventListener("animationend", () => clone.remove(), { once: true });
    });
  };

  document.addEventListener(
    "pointerdown",
    (event) => {
      const ack = event.target.closest?.("[data-ack-result]");
      if (!ack || ack.disabled) return;
      handoffFlyingGhosts();
    },
    true
  );

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.classList.contains("gd-reward-ghost")) classifyGhost(node);
        node.querySelectorAll?.(".gd-reward-ghost").forEach(classifyGhost);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
