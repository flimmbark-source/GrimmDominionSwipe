// The main prototype intentionally avoids full re-renders during result animations
// so ghosts/wink animations do not replay. This tiny visual bridge keeps the
// visible Dark Lord timer counting down during that result state.
(() => {
  let visibleValue = null;

  function getVisibleDarkTimer() {
    return [...document.querySelectorAll(".gd-timer.red")].find((timer) =>
      /\d+s/.test(timer.textContent || "")
    );
  }

  function syncFromDom() {
    const timer = getVisibleDarkTimer();
    if (!timer) return;
    const match = timer.textContent.match(/(\d+)s/);
    if (match) visibleValue = Number(match[1]);
  }

  const observer = new MutationObserver(syncFromDom);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.setInterval(() => {
    const resultIsShowing = Boolean(document.querySelector(".gd-action-result"));
    const timer = getVisibleDarkTimer();
    if (!timer || !resultIsShowing) {
      syncFromDom();
      return;
    }

    if (visibleValue == null) syncFromDom();
    if (visibleValue == null) return;

    visibleValue = Math.max(0, visibleValue - 1);
    timer.textContent = `${visibleValue}s`;
  }, 1000);
})();
