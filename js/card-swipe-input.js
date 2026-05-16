// Adds Reigns-style swipe input to the event card while keeping choice containers visible.
(() => {
  const SWIPE_THRESHOLD = 72;
  const MAX_DRAG = 132;
  const CONFIRM_MS = 280;
  let state = null;
  let resultState = null;
  let pendingRender = false;

  const clampDrag = (value) => Math.max(-MAX_DRAG, Math.min(MAX_DRAG, value));

  const setCardDrag = (card, dx, active = true) => {
    const drag = clampDrag(dx);
    const rotate = drag * 0.045;
    const progress = Math.min(1, Math.abs(drag) / SWIPE_THRESHOLD);
    const side = drag < 0 ? "left" : drag > 0 ? "right" : "neutral";
    card.style.setProperty("--swipe-x", `${drag}px`);
    card.style.setProperty("--swipe-rotate", `${rotate}deg`);
    card.style.setProperty("--swipe-progress", `${progress}`);
    card.dataset.swipeSide = side;
    card.classList.toggle("is-swiping", active);
    card.classList.toggle("swipe-left", side === "left" && progress > 0.18);
    card.classList.toggle("swipe-right", side === "right" && progress > 0.18);
  };

  const resetCard = (card) => {
    card.classList.remove("is-swiping", "swipe-left", "swipe-right", "swipe-ready", "swipe-confirm-left", "swipe-confirm-right");
    card.dataset.swipeSide = "neutral";
    card.style.setProperty("--swipe-x", "0px");
    card.style.setProperty("--swipe-rotate", "0deg");
    card.style.setProperty("--swipe-progress", "0");
  };

  const resetResult = (node) => {
    node.classList.remove("gd-result-swiping", "gd-result-confirm-left", "gd-result-confirm-right");
    node.style.setProperty("--result-swipe-x", "0px");
    node.style.setProperty("--result-swipe-rotate", "0deg");
  };

  const flushPendingRender = () => {
    if (!pendingRender) return;
    pendingRender = false;
    window.requestAnimationFrame(() => render?.());
  };

  const resolveAfterSlide = (card, side) => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      card.removeEventListener("transitionend", onTransitionEnd);
      if (!game.awaitingResultAck && !game.lastAction) choose(side);
    };
    const onTransitionEnd = (event) => {
      if (event.target === card && event.propertyName === "transform") finish();
    };
    card.addEventListener("transitionend", onTransitionEnd);
    window.setTimeout(finish, CONFIRM_MS + 80);
  };

  const acknowledgeAfterResultSlide = (node, side) => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      node.removeEventListener("transitionend", onTransitionEnd);
      acknowledgeResult();
    };
    const onTransitionEnd = (event) => {
      if (event.target === node && event.propertyName === "transform") finish();
    };
    node.classList.add(side === "left" ? "gd-result-confirm-left" : "gd-result-confirm-right");
    node.addEventListener("transitionend", onTransitionEnd);
    window.setTimeout(finish, CONFIRM_MS + 120);
  };

  const bindResultSwipe = () => {
    const result = document.querySelector(".gd-action-result");
    if (!result || result.dataset.resultSwipeBound) return;
    result.dataset.resultSwipeBound = "true";
    resetResult(result);

    result.addEventListener("pointerdown", (event) => {
      if (!game.awaitingResultAck || !game.resultReady) return;
      event.preventDefault();
      resultState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dx: 0,
        dy: 0,
        node: result,
      };
      result.setPointerCapture?.(event.pointerId);
      result.classList.add("gd-result-swiping");
    }, { passive: false });

    result.addEventListener("pointermove", (event) => {
      if (!resultState || resultState.pointerId !== event.pointerId || resultState.node !== result) return;
      resultState.dx = event.clientX - resultState.startX;
      resultState.dy = event.clientY - resultState.startY;
      if (Math.abs(resultState.dx) < 4 && Math.abs(resultState.dy) < 4) return;
      event.preventDefault();
      const drag = clampDrag(resultState.dx);
      result.style.setProperty("--result-swipe-x", `${drag}px`);
      result.style.setProperty("--result-swipe-rotate", `${drag * 0.035}deg`);
    }, { passive: false });

    const endResultSwipe = (event) => {
      if (!resultState || resultState.pointerId !== event.pointerId || resultState.node !== result) return;
      event.preventDefault();
      const dx = resultState.dx;
      const dy = resultState.dy;
      const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.1;
      const side = dx < 0 ? "left" : "right";
      resultState = null;
      result.releasePointerCapture?.(event.pointerId);
      result.classList.remove("gd-result-swiping");

      if (isHorizontal && Math.abs(dx) >= SWIPE_THRESHOLD && game.awaitingResultAck && game.resultReady) {
        acknowledgeAfterResultSlide(result, side);
      } else {
        resetResult(result);
      }
    };

    result.addEventListener("pointerup", endResultSwipe, { passive: false });
    result.addEventListener("pointercancel", (event) => {
      if (resultState?.pointerId === event.pointerId) {
        resultState = null;
        resetResult(result);
      }
    });
  };

  const bindSwipe = () => {
    const card = document.querySelector(".gd-card");
    if (!card || card.dataset.swipeBound) return;
    card.dataset.swipeBound = "true";
    card.dataset.swipeSide = "neutral";
    resetCard(card);

    card.addEventListener("pointerdown", (event) => {
      if (game.activeTab !== "explore" || game.awaitingResultAck || game.lastAction || game.heroTimer <= 0) return;
      if (event.target.closest("[data-ack-result]")) return;
      event.preventDefault();
      pendingRender = false;
      state = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dx: 0,
        dy: 0,
        card,
      };
      card.setPointerCapture?.(event.pointerId);
      card.classList.add("swipe-ready");
    }, { passive: false });

    card.addEventListener("pointermove", (event) => {
      if (!state || state.pointerId !== event.pointerId || state.card !== card) return;
      state.dx = event.clientX - state.startX;
      state.dy = event.clientY - state.startY;
      if (Math.abs(state.dx) < 4 && Math.abs(state.dy) < 4) return;
      event.preventDefault();
      setCardDrag(card, state.dx, true);
    }, { passive: false });

    const endSwipe = (event) => {
      if (!state || state.pointerId !== event.pointerId || state.card !== card) return;
      event.preventDefault();
      const dx = state.dx;
      const dy = state.dy;
      const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
      const side = dx < 0 ? "left" : "right";
      state = null;
      card.releasePointerCapture?.(event.pointerId);
      card.classList.remove("swipe-ready", "is-swiping");

      if (isHorizontal && Math.abs(dx) >= SWIPE_THRESHOLD && !game.awaitingResultAck && !game.lastAction) {
        pendingRender = false;
        card.classList.add(side === "left" ? "swipe-confirm-left" : "swipe-confirm-right");
        resolveAfterSlide(card, side);
      } else {
        resetCard(card);
        flushPendingRender();
      }
    };

    card.addEventListener("pointerup", endSwipe, { passive: false });
    card.addEventListener("pointercancel", (event) => {
      if (state?.pointerId === event.pointerId) {
        state = null;
        resetCard(card);
        flushPendingRender();
      }
    });
  };

  const installRewardChipCleanup = () => {
    if (window.__regionCardAddedCleanup || typeof applyRewards !== "function") return;
    window.__regionCardAddedCleanup = true;
    const baseApplyRewards = applyRewards;
    window.applyRewards = function applyRewards(rewards = []) {
      const ghosts = baseApplyRewards(rewards);
      ghosts?.forEach(ghost => {
        if (ghost.kind === "card") ghost.text = String(ghost.text || "").replace(/\s+added$/i, "");
      });
      return ghosts;
    };
    applyRewards = window.applyRewards;
  };

  const installLightweightTimer = () => {
    if (window.__lightweightTimerInstalled || typeof tick !== "function") return;
    window.__lightweightTimerInstalled = true;

    window.updateTimerDom = function updateTimerDom() {
      document.querySelectorAll(".gd-timer").forEach(node => {
        const label = node.parentElement?.querySelector(".gd-timer-label")?.textContent || "";
        const isDark = node.classList.contains("red") || label.includes("Dark Lord");
        node.textContent = `${isDark ? game.darkLordTimer : game.heroTimer}s`;
      });
    };

    window.tick = function tick() {
      game.darkLordTimer = Math.max(0, game.darkLordTimer - 1);

      if (game.darkLordTimer === 0) {
        if (typeof resultReadyTimeoutId !== "undefined" && resultReadyTimeoutId) clearTimeout(resultReadyTimeoutId);
        resultReadyTimeoutId = null;
        resolveDarkLordPlan();
        if (typeof applyFoodUpkeep === "function") applyFoodUpkeep();
        game.darkLordTimer = 60;
        game.heroTimer = 40;
        game.awaitingResultAck = false;
        game.resultReady = false;
        game.pendingNextCardId = null;
        game.lastAction = null;
        render();
        return;
      }

      updateTimerDom();
    };
    tick = window.tick;
    startTimers?.();
    updateTimerDom();
  };

  const baseRender = render;
  window.render = function(...args) {
    if (state?.card?.isConnected && game?.activeTab === "explore" && !game.awaitingResultAck && !game.lastAction) {
      pendingRender = true;
      return;
    }
    const result = baseRender.apply(this, args);
    bindSwipe();
    bindResultSwipe();
    window.updateTimerDom?.();
    return result;
  };
  render = window.render;

  installRewardChipCleanup();
  bindSwipe();
  bindResultSwipe();
  installLightweightTimer();
})();
