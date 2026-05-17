// Image-derived village map coordinates.
// This is the intentional coordinate-tuning table for the full PNG calibration view.
// Coordinates are percentages of assets/maps/whispermoor-village-bg.png.
(() => {
  if (!window.VILLAGE_NODE_MAP?.nodes) return;

  const IMAGE_COORDS = {
    // West forest / village edge
    forest_edge_01: [4.5, 33.5],
    forest_path_01: [13.5, 27.5],
    stream_bank_01: [2.4, 61.0],
    hedge_gap_01: [12.5, 43.0],

    // Western roads
    old_road_west_01: [21.5, 35.0],
    overgrown_trail_01: [21.0, 23.0],
    old_road_crossing_01: [31.0, 36.0],
    muddy_turn_01: [33.0, 72.0],

    // Western cottage cluster
    cottage_row_west_01: [28.0, 31.0],
    sleeping_cottage_01: [24.0, 30.0],
    cottage_yard_01: [24.5, 17.5],
    woodpile_01: [30.5, 26.0],
    back_window_01: [33.0, 12.5],
    cottage_back_path_01: [38.5, 27.5],
    dark_cottage_01: [43.5, 27.0],
    cottage_row_east_01: [43.5, 38.0],

    // Baker / food cluster
    baker_lane_01: [50.0, 39.5],
    baker_back_door_01: [45.0, 39.5],
    flour_shed_01: [58.5, 45.0],

    // Market center
    market_gate_west_01: [36.0, 45.5],
    market_square_01: [47.0, 53.0],
    market_stall_row_01: [47.0, 47.0],
    market_gate_north_01: [56.5, 41.0],
    market_back_lane_01: [59.0, 50.5],
    shrine_corner_01: [56.0, 61.0],

    // Well / drain / lower village
    well_lane_01: [36.0, 49.0],
    old_stone_well_01: [46.0, 48.0],
    well_yard_01: [39.0, 59.0],
    sewer_grate_01: [58.0, 70.0],
    drain_path_01: [48.0, 83.0],
    collapsed_drain_01: [10.5, 86.0],
    root_tunnel_01: [10.5, 72.5],

    // Chapel / shrine / graveyard
    chapel_path_west_01: [45.0, 31.0],
    chapel_steps_01: [53.0, 26.0],
    shrine_cart_01: [59.0, 28.0],
    old_wayside_shrine_01: [63.0, 64.0],
    graveyard_path_01: [62.0, 28.0],
    wood_trail_01: [84.0, 76.0],

    // East guard / kennel cluster
    guard_cut_01: [68.0, 44.0],
    guard_post_01: [79.0, 18.0],
    watch_fire_01: [80.0, 22.5],
    kennel_fence_01: [81.5, 48.0],
    kennel_yard_01: [83.5, 56.5],
  };

  Object.entries(IMAGE_COORDS).forEach(([id, [x, y]]) => {
    const node = window.VILLAGE_NODE_MAP.nodes[id];
    if (!node) return;
    node.x = x;
    node.y = y;
  });

  window.VILLAGE_IMAGE_COORDS = IMAGE_COORDS;

  ensureNodeState?.();
  render?.();
})();