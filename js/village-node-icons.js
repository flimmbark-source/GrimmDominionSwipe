// Adds compact map icons based on each node's locationType.
(() => {
  if (!window.VILLAGE_NODE_MAP?.nodes) return;

  const ICONS = {
    "forest-edge": "🌲",
    "forest-path": "🌲",
    "stream-bank": "〰️",
    "hedge-gap": "☘️",
    "old-road": "〽️",
    "overgrown-trail": "🌿",
    "road-crossing": "✣",
    "muddy-road": "〽️",

    "cottage-row": "⌂",
    "sleeping-cottage": "⌂",
    "cottage-yard": "▦",
    woodpile: "♨",
    "back-window": "▣",
    "cottage-back-path": "↝",
    "dark-cottage": "◈",

    "baker-lane": "🍞",
    bakery: "🍞",
    "flour-shed": "⚱",

    "market-gate": "⚑",
    "market-square": "◆",
    "market-stalls": "▥",
    "market-back-lane": "↝",
    "shrine-corner": "✦",

    "well-lane": "◌",
    "stone-well": "◎",
    "well-yard": "◎",
    "sewer-grate": "▤",
    "drain-path": "▤",
    "collapsed-drain": "⌁",
    "root-tunnel": "⟲",

    "chapel-path": "✚",
    "chapel-steps": "✚",
    "shrine-cart": "✦",
    "wayside-shrine": "✦",
    "graveyard-path": "☩",
    "wood-trail": "🌲",

    "guard-road": "⚔",
    "guard-post": "⚔",
    "watch-fire": "♨",
    "kennel-fence": "♞",
    "kennel-yard": "♞",
  };

  Object.values(window.VILLAGE_NODE_MAP.nodes).forEach(node => {
    const locationType = node.locationType || node.tags?.[0] || node.kind;
    node.icon = ICONS[locationType] || "•";
    node.iconType = locationType;
  });

  window.VILLAGE_NODE_ICONS = ICONS;

  ensureNodeState?.();
  render?.();
})();