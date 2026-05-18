(() => {
  const FLOAT_BEFORE_TAB_FLIGHT_MS = 1150;
  const STACK_GAP_PX = 18;
  const portalTimers = new WeakMap();
  let lastDataBatchKey = "";

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

  const destinationForData = (ghost) => {
    const kind = ghost?.kind || "";
    const className = ghost?.className || "";
    const text = String(ghost?.text || "").toLowerCase();
    if (className.includes("item") && (text.includes("route") || text.includes("tunnel") || text.includes("villager") || text.includes("added"))) return "explore";
    if (kind === "item" || className.includes("item")) return "inventory";
    if (kind === "gold" || kind === "food" || className.includes("gold") || className.includes("food")) return "inventory";
    if (kind === "time" || className.includes("time")) return "timer";
    if (kind === "damage" || kind === "heal" || className.includes("damage") || className.includes("heal")) return "hp";
    if (kind === "noise" || className.includes("noise")) return "log";
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

    clone.className = `${className || ""} gd-ghost-portal to-${destination}`.replace("gd-reward-ghost", "").trim();
    clone.dataset.destination = destination;
    clone.innerHTML = html;
    clone.style.left = `${left}px`;
    clone.style.top = `${top}px`;
    clone.style.bottom = "auto";
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

  const portalGhost = (ghost, delay = FLOAT_BEFORE_TAB_FLIGHT_MS) => {
    if (!ghost || ghost.dataset.portalCloned || portalTimers.has(ghost)) return;
    ghost.dataset.destination = destinationForGhost(ghost);
    const timer = window.setTimeout(() => {
      portalTimers.delete(ghost);
      portalGhostNow(ghost);
    }, delay);
    portalTimers.set(ghost, timer);
  };

  window.handoffRewardGhostsNow = function handoffRewardGhostsNow() {
    let count = 0;
    document.querySelectorAll(".gd-reward-ghost").forEach(ghost => {
      const timer = portalTimers.get(ghost);
      if (timer) {
        clearTimeout(timer);
        portalTimers.delete(ghost);
      }
      if (portalGhostNow(ghost)) count += 1;
    });
    return count;
  };

  window.launchRewardGhostHandoffsFromData = function launchRewardGhostHandoffsFromData(ghosts = [], batchKey = "") {
    if (!ghosts.length) return 0;
    const key = batchKey || JSON.stringify(ghosts.map(g => [g.kind, g.text, g.className]));
    if (key && key === lastDataBatchKey) return 0;
    lastDataBatchKey = key;

    const cardRect = document.querySelector(".gd-card")?.getBoundingClientRect();
    const baseLeft = cardRect ? cardRect.left + cardRect.width / 2 : window.innerWidth / 2;
    const baseTop = cardRect ? cardRect.top + cardRect.height * 0.56 : window.innerHeight * 0.45;
    const spread = Math.min(52, Math.max(26, (cardRect?.width || 320) / 7));
    const centerOffset = (ghosts.length - 1) / 2;

    ghosts.forEach((ghost, index) => {
      const destination = destinationForData(ghost);
      const left = baseLeft + (index - centerOffset) * spread;
      const top = baseTop + (index % 2) * 14;
      const className = `gd-ghost-handoff ${ghost.className || ghost.kind || "status"}`;
      const icon = ghost.icon || "✦";
      const text = ghost.text || "Reward";
      createPortalClone({
        className,
        html: `<span class="ghost-icon">${icon}</span><span class="ghost-text">${text}</span>`,
        left,
        top,
        destination,
      });
    });

    document.querySelectorAll(".gd-reward-ghost").forEach(ghost => {
      ghost.dataset.portalCloned = "true";
      ghost.style.visibility = "hidden";
    });
    return ghosts.length;
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
