// Visual-only helper: when the player chooses an action, show the action's
// time cost as a ghost originating from the player timer.
(() => {
  document.addEventListener(
    "pointerdown",
    (event) => {
      const choice = event.target.closest?.("[data-choice]");
      if (!choice || choice.disabled) return;

      const timeText = [...choice.querySelectorAll("span")]
        .map((node) => node.textContent || "")
        .find((text) => /⌛\s*\d+s/.test(text));

      const match = timeText?.match(/(\d+)s/);
      if (!match) return;

      window.setTimeout(() => spawnTimeGhost(match[1]), 90);
    },
    true
  );

  function spawnTimeGhost(seconds) {
    const card = document.querySelector(".gd-card");
    const timer = document.querySelector(".gd-card .gd-card-timer");
    if (!card || !timer) return;

    const cardBox = card.getBoundingClientRect();
    const timerBox = timer.getBoundingClientRect();
    const ghost = document.createElement("div");
    ghost.className = "gd-time-spend-ghost";
    ghost.style.setProperty("--time-ghost-top", `${timerBox.top - cardBox.top + 6}px`);
    ghost.innerHTML = `<span class="ghost-icon">⌛</span><span class="ghost-text">-${seconds}s</span>`;

    card.appendChild(ghost);
    ghost.addEventListener("animationend", () => ghost.remove(), { once: true });
  }
})();
