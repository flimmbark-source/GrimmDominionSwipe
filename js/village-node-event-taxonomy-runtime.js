// Derives node event pools from card.locationTypes.
(() => {
  function isPassThrough(locationType) {
    return /road|path|trail|gate|lane|stream|forest/.test(locationType || "");
  }

  function isAmbient(card) {
    return ["patrol", "consequence", "trap", "curse", "hound-threat"].includes(card?.encounterType);
  }

  function valid(ids) {
    return [...new Set(ids.filter(id => id && cards?.[id]))];
  }

  function apply() {
    if (!window.VILLAGE_NODE_MAP?.nodes || typeof cards === "undefined" || !window.VILLAGE_CARD_TAXONOMY) return false;

    const summary = {};
    Object.entries(window.VILLAGE_NODE_MAP.nodes).forEach(([nodeId, node]) => {
      const locationType = node.locationType || node.tags?.[0] || node.kind;
      const eventPool = [];
      const randomPool = [];

      Object.entries(cards).forEach(([cardId, card]) => {
        if (!Array.isArray(card.locationTypes) || !card.locationTypes.includes(locationType)) return;
        if (isPassThrough(locationType) || isAmbient(card)) randomPool.push(cardId);
        else eventPool.push(cardId);
      });

      node.eventPool = valid(eventPool);
      node.randomPool = valid(randomPool);
      summary[nodeId] = { locationType, eventPool: node.eventPool, randomPool: node.randomPool };
    });

    window.VILLAGE_NODE_EVENT_POOLS = summary;
    window.VILLAGE_NODE_EVENT_TAXONOMY_RUNTIME = true;
    ensureNodeState?.();
    render?.();
    return true;
  }

  let attempts = 0;
  function retry() {
    if (apply()) return;
    attempts += 1;
    if (attempts < 12) setTimeout(retry, 40);
  }

  retry();
})();