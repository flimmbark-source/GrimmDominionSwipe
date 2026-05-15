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

  const pulseTab = (destination) => {
    const label = tabForDestination(destination);
    const tab = [...document.querySelectorAll(".gd-tab")].find((node) =>
      (node.textContent || "").includes(label)
    );
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
    ghost.classList.add(`to-${destination}`);
    pulseTab(destination);
  };

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
