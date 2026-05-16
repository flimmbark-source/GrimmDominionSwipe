// Coordinate alignment pass for the SVG village background.
// Keeps topology separate from visual placement so we can tune the overlay safely.
(() => {
  if (!window.VILLAGE_NODE_MAP?.nodes) return;

  const aligned = {
    // Forest / west entry
    forest_edge_01: [8, 42],
    forest_path_01: [17, 37],
    stream_bank_01: [6, 66],
    hedge_gap_01: [16, 50],

    // Old road / approach
    old_road_west_01: [25, 43],
    overgrown_trail_01: [27, 32],
    old_road_crossing_01: [36, 42],
    muddy_turn_01: [35, 80],

    // Cottage cluster
    cottage_row_west_01: [38, 36],
    sleeping_cottage_01: [30, 34],
    cottage_yard_01: [28, 27],
    woodpile_01: [33, 35],
    back_window_01: [38, 23],
    cottage_back_path_01: [45, 36],
    dark_cottage_01: [48, 27],
    cottage_row_east_01: [52, 35],

    // Baker / food cluster
    baker_lane_01: [60, 36],
    baker_back_door_01: [66, 27],
    flour_shed_01: [70, 33],

    // Market core
    market_gate_west_01: [41, 51],
    market_square_01: [52, 52],
    market_stall_row_01: [53, 45],
    market_gate_north_01: [62, 43],
    market_back_lane_01: [63, 50],
    shrine_corner_01: [60, 61],

    // Well / stream / drain
    well_lane_01: [31, 58],
    old_stone_well_01: [25, 70],
    well_yard_01: [36, 67],
    sewer_grate_01: [13, 66],
    drain_path_01: [23, 83],
    collapsed_drain_01: [13, 88],
    root_tunnel_01: [14, 76],

    // Shrine / chapel
    chapel_path_west_01: [48, 74],
    chapel_steps_01: [58, 80],
    shrine_cart_01: [65, 67],
    old_wayside_shrine_01: [72, 67],
    graveyard_path_01: [72, 82],
    wood_trail_01: [86, 83],

    // Guard / kennel side
    guard_cut_01: [75, 52],
    guard_post_01: [82, 25],
    watch_fire_01: [82, 27],
    kennel_fence_01: [84, 58],
    kennel_yard_01: [84, 63],
  };

  Object.entries(aligned).forEach(([id, [x, y]]) => {
    const node = window.VILLAGE_NODE_MAP.nodes[id];
    if (!node) return;
    node.x = x;
    node.y = y;
  });

  ensureNodeState?.();
  render?.();
})();
