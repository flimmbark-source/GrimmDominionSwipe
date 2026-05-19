(() => {
  const STACK_GAP_PX = 18;

  const GHOST_COLORS = {
    gold: "#e4b84e",
    damage: "#f05c5c",
    status: "#7ce58d",
    noise: "#b78cff",
    item: "#71d5ff",
    xp: "#f3ec83",
    food: "#cf9f5a",
    heal: "#5ff08a",
    stat: "#88d8ff",
    time: "#f0df7a",
    card: "#71d5ff",
  };

  const rewardKindFromClass = (className = "") =>
    Object.keys(GHOST_COLORS).find(kind => className.split(/\s+/).includes(kind)) || "status";

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

  const createPortalClone = ({ className, html, left, top, destination }) => {
    const target = findDestinationTarget(destination);
    const targetRect = target?.getBoundingClientRect();
    const stackIndex = activeStackIndex(destination);
    const point = targetPoint(destination, targetRect, stackIndex);
    const clone = document.createElement("div");
    const kind = rewardKindFromClass(className);

    clone.className = `${className || ""} gd-ghost-portal to-${destination}`.replace("gd-reward-ghost", "").trim();
    clone.classList.add(kind);
    clone.dataset.destination = destination;
    clone.innerHTML = html;
    clone.style.left = `${left}px`;
    clone.style.top = `${top}px`;
    clone.style.bottom = "auto";
    clone.style.setProperty("--ghost-color", GHOST_COLORS[kind] || GHOST_COLORS.status);
    clone.style.setProperty("color", `var(--ghost-color)`);
    clone.style.setProperty("--handoff-target-x", `${point.x}px`);
    clone.style.setProperty("--handoff-target-y", `${point.y}px`);

    document.body.appendChild(clone);
    pulseTarget(destination, 1850);
    clone.addEventListener("animationend", () => clone.remove(), { once: true });
    return clone;
  };

  const portalGhostNow = (ghost) => {
    if (!ghost || ghost.dataset.portalCloned) return false;
    if (!ghost.isConnected) return false;

    const rect = ghost.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;

    ghost.dataset.portalCloned = "true";
    const destination = ghost.dataset.destination || destinationForGhost(ghost);
    ghost.dataset.destination = destination;

    createPortalClone({
      className: ghost.className,
      html: ghost.innerHTML,
      left: rect.left + rect.width / 2,
      top: rect.top,
      destination,
    });
    ghost.style.visibility = "hidden";
    return true;
  };

  window.handoffRewardGhostsNow = function handoffRewardGhostsNow() {
    let count = document.querySelectorAll(".gd-ghost-portal").length;
    document.querySelectorAll(".gd-reward-ghost:not([data-portal-cloned])").forEach(ghost => {
      if (portalGhostNow(ghost)) count += 1;
    });
    return count;
  };

  // No automatic observer handoff. Visible ghosts rise first; result-overlay-auto-advance
  // calls handoffRewardGhostsNow() once before it advances to the next event.
  window.launchRewardGhostHandoffsFromData = function launchRewardGhostHandoffsFromData() {
    return 0;
  };
})();
