// Normalizes village nodes around one strong location identity.
// locationType owns event-pool identity; tags intentionally stay narrow.
(() => {
  if (!window.VILLAGE_NODE_MAP?.nodes) return;

  const TAXONOMY = {
    forest_edge_01: { locationType: "forest-edge", tag: "forest-edge", traits: ["entry"] },
    forest_path_01: { locationType: "forest-path", tag: "forest-path", traits: [] },
    stream_bank_01: { locationType: "stream-bank", tag: "stream-bank", traits: [] },
    hedge_gap_01: { locationType: "hedge-gap", tag: "hedge-gap", traits: [] },

    old_road_west_01: { locationType: "old-road", tag: "old-road", traits: ["west"] },
    overgrown_trail_01: { locationType: "overgrown-trail", tag: "overgrown-trail", traits: [] },
    old_road_crossing_01: { locationType: "road-crossing", tag: "road-crossing", traits: [] },
    muddy_turn_01: { locationType: "muddy-road", tag: "muddy-road", traits: [] },

    cottage_row_west_01: { locationType: "cottage-row", tag: "cottage-row", traits: ["west"] },
    sleeping_cottage_01: { locationType: "sleeping-cottage", tag: "sleeping-cottage", traits: [] },
    cottage_yard_01: { locationType: "cottage-yard", tag: "cottage-yard", traits: [] },
    woodpile_01: { locationType: "woodpile", tag: "woodpile", traits: [] },
    back_window_01: { locationType: "back-window", tag: "back-window", traits: [] },
    cottage_back_path_01: { locationType: "cottage-back-path", tag: "cottage-back-path", traits: [] },
    dark_cottage_01: { locationType: "dark-cottage", tag: "dark-cottage", traits: [] },
    cottage_row_east_01: { locationType: "cottage-row", tag: "cottage-row", traits: ["east"] },

    baker_lane_01: { locationType: "baker-lane", tag: "baker-lane", traits: [] },
    baker_back_door_01: { locationType: "bakery", tag: "bakery", traits: ["back-door"] },
    flour_shed_01: { locationType: "flour-shed", tag: "flour-shed", traits: [] },

    market_gate_west_01: { locationType: "market-gate", tag: "market-gate", traits: ["west"] },
    market_square_01: { locationType: "market-square", tag: "market-square", traits: [] },
    market_stall_row_01: { locationType: "market-stalls", tag: "market-stalls", traits: [] },
    market_gate_north_01: { locationType: "market-gate", tag: "market-gate", traits: ["north"] },
    market_back_lane_01: { locationType: "market-back-lane", tag: "market-back-lane", traits: [] },
    shrine_corner_01: { locationType: "shrine-corner", tag: "shrine-corner", traits: [] },

    well_lane_01: { locationType: "well-lane", tag: "well-lane", traits: [] },
    old_stone_well_01: { locationType: "stone-well", tag: "stone-well", traits: [] },
    well_yard_01: { locationType: "well-yard", tag: "well-yard", traits: [] },
    sewer_grate_01: { locationType: "sewer-grate", tag: "sewer-grate", traits: [] },
    drain_path_01: { locationType: "drain-path", tag: "drain-path", traits: [] },
    collapsed_drain_01: { locationType: "collapsed-drain", tag: "collapsed-drain", traits: [] },
    root_tunnel_01: { locationType: "root-tunnel", tag: "root-tunnel", traits: [] },

    chapel_path_west_01: { locationType: "chapel-path", tag: "chapel-path", traits: ["west"] },
    chapel_steps_01: { locationType: "chapel-steps", tag: "chapel-steps", traits: [] },
    shrine_cart_01: { locationType: "shrine-cart", tag: "shrine-cart", traits: [] },
    old_wayside_shrine_01: { locationType: "wayside-shrine", tag: "wayside-shrine", traits: [] },
    graveyard_path_01: { locationType: "graveyard-path", tag: "graveyard-path", traits: [] },
    wood_trail_01: { locationType: "wood-trail", tag: "wood-trail", traits: [] },

    guard_cut_01: { locationType: "guard-road", tag: "guard-road", traits: [] },
    guard_post_01: { locationType: "guard-post", tag: "guard-post", traits: [] },
    watch_fire_01: { locationType: "watch-fire", tag: "watch-fire", traits: [] },
    kennel_fence_01: { locationType: "kennel-fence", tag: "kennel-fence", traits: [] },
    kennel_yard_01: { locationType: "kennel-yard", tag: "kennel-yard", traits: [] },
  };

  Object.entries(TAXONOMY).forEach(([id, meta]) => {
    const node = window.VILLAGE_NODE_MAP.nodes[id];
    if (!node) return;
    node.locationType = meta.locationType;
    node.tags = [meta.tag];
    node.traits = [...meta.traits];
  });

  window.VILLAGE_NODE_TAXONOMY = TAXONOMY;

  ensureNodeState?.();
  render?.();
})();