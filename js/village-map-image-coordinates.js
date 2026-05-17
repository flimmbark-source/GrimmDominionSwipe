// Image-derived village map coordinates.
// These positions are calibrated against assets/maps/whispermoor-village-bg.png.
(() => {
  if (!window.VILLAGE_NODE_MAP?.nodes) return;

  const IMAGE_COORDS = {
    // West forest / village edge
    forest_edge_01: [9, 43],
    forest_path_01: [15, 24],
    stream_bank_01: [9, 57],
    hedge_gap_01: [16, 47],

    // Western roads
    old_road_west_01: [26, 39],
    overgrown_trail_01: [28, 25],
    old_road_crossing_01: [32, 39],
    muddy_turn_01: [39, 69],

    // Western cottage cluster
    cottage_row_west_01: [24, 31],
    sleeping_cottage_01: [22, 28],
    cottage_yard_01: [31, 17],
    woodpile_01: [19, 34],
    back_window_01: [27, 25],
    cottage_back_path_01: [28, 35],
    dark_cottage_01: [22, 39],
    cottage_row_east_01: [37, 36],

    // Baker / food cluster
    baker_lane_01: [23, 55],
    baker_back_door_01: [15, 54],
    flour_shed_01: [29, 65],

    // Market center
    market_gate_west_01: [34, 48],
    market_square_01: [46, 49],
    market_stall_row_01: [47, 44],
    market_gate_north_01: [52, 38],
    market_back_lane_01: [56, 44],
    shrine_corner_01: [58, 54],

    // Well / drain / lower village
    well_lane_01: [37, 50],
    old_stone_well_01: [45, 45],
    well_yard_01: [40, 53],
    sewer_grate_01: [58, 67],
    drain_path_01: [51, 74],
    collapsed_drain_01: [44, 73],
    root_tunnel_01: [58, 69],

    // Chapel / shrine / graveyard
    chapel_path_west_01: [48, 32],
    chapel_steps_01: [53, 22],
    shrine_cart_01: [59, 29],
    old_wayside_shrine_01: [62, 61],
    graveyard_path_01: [56, 29],
    wood_trail_01: [82, 75],

    // East guard / kennel cluster
    guard_cut_01: [70, 43],
    guard_post_01: [82, 20],
    watch_fire_01: [89, 31],
    kennel_fence_01: [84, 43],
    kennel_yard_01: [83, 58],
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