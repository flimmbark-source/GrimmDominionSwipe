// On non-Explore tabs, place the hero timer directly beside the Dark Lord timer.
(() => {
  const originalRender = window.render;
  if (typeof originalRender !== "function") return;

  const adjustTimerRows = () => {
    if (game?.activeTab === "explore") return;
    const tops = document.querySelectorAll(".gd-top:not(.single-right)");
    tops.forEach(top => {
      const timers = [...top.querySelectorAll(".gd-timer")];
      if (timers.length < 2 || top.querySelector(".gd-non-explore-timers")) return;
      const heroWrap = timers.find(timer => !timer.classList.contains("red"))?.parentElement;
      const darkWrap = timers.find(timer => timer.classList.contains("red"))?.parentElement;
      if (!heroWrap || !darkWrap) return;
      const group = document.createElement("div");
      group.className = "gd-non-explore-timers";
      heroWrap.before(group);
      group.appendChild(heroWrap);
      group.appendChild(darkWrap);
    });
  };

  window.render = function(...args) {
    const result = originalRender.apply(this, args);
    adjustTimerRows();
    return result;
  };

  render();
})();
