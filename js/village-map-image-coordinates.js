// Image-derived village map coordinates.
// This is the intentional coordinate-tuning table for the full PNG calibration view.
// Coordinates are percentages of assets/maps/whispermoor-village-bg.png.
(() => {
  if (!window.VILLAGE_NODE_MAP?.nodes) return;

  const IMAGE_COORDS = {
    // West forest / village edge
    forest_edge_01: [6.2, 33.5],
    forest_path_01: [13.5, 27.5],
    stream_bank_01: [5.0, 59.2],
    hedge_gap_01: [12.5, 43.0],

    // Western roads
    old_road_west_01: [21.0, 35.5],
    overgrown_trail_01: [21.0, 23.0],
    old_road_crossing_01: [31.0, 36.0],
    muddy_turn_01: [32.5, 72.0],

    // Western cottage cluster
    cottage_row_west_01: [28.5, 32.5],
    sleeping_cottage_01: [24.0, 30.0],
    cottage_yard_01: [24.5, 17.5],
    woodpile_01: [30.5, 26.0],
    back_window_01: [33.0, 12.5],
    cottage_back_path_01: [39.0, 25.6],
    dark_cottage_01: [42.0, 24.5],
    cottage_row_east_01: [43.2, 35.6],

    // Baker / food cluster
    baker_lane_01: [50.5, 37.0],
    baker_back_door_01: [46.2, 39.0],
    flour_shed_01: [58.5, 45.0],

    // Market center
    market_gate_west_01: [35.0, 44.6],
    market_square_01: [45.8, 54.2],
    market_stall_row_01: [47.2, 46.0],
    market_gate_north_01: [55.8, 41.0],
    market_back_lane_01: [59.2, 51.4],
    shrine_corner_01: [55.2, 62.0],

    // Well / drain / lower village
    well_lane_01: [34.5, 49.0],
    old_stone_well_01: [46.2, 45.4],
    well_yard_01: [38.0, 58.0],
    sewer_grate_01: [58.0, 70.0],
    drain_path_01: [47.5, 83.0],
    collapsed_drain_01: [6.8, 87.0],
    root_tunnel_01: [9.4, 73.0],

    // Chapel / shrine / graveyard
    chapel_path_west_01: [45.0, 31.0],
    chapel_steps_01: [52.5, 24.0],
    shrine_cart_01: [59.0, 28.0],
    old_wayside_shrine_01: [63.0, 64.0],
    graveyard_path_01: [62.0, 27.5],
    wood_trail_01: [84.0, 76.0],

    // East guard / kennel cluster
    guard_cut_01: [68.0, 44.0],
    guard_post_01: [79.0, 18.0],
    watch_fire_01: [80.5, 22.8],
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