// Visual-only node offsets for crowded map clusters.
// x/y remain the true map coordinates; displayOffset shifts rendered markers/lines slightly.
// labelOffset shifts only the full-map calibration label so screenshots stay readable.
(() => {
  if (!window.VILLAGE_NODE_MAP?.nodes) return;

  const OFFSETS = {
    // Cottage cluster
    sleeping_cottage_01: { displayOffset: [-0.8, 0.7], labelOffset: [-42, 3] },
    cottage_row_west_01: { displayOffset: [0.6, -1.2], labelOffset: [8, -20] },
    cottage_yard_01: { displayOffset: [-0.6, -0.9], labelOffset: [-44, -10] },
    woodpile_01: { displayOffset: [0.9, -0.2], labelOffset: [10, -2] },
    back_window_01: { displayOffset: [0, -0.9], labelOffset: [10, -18] },
    cottage_back_path_01: { displayOffset: [0.8, -0.4], labelOffset: [10, -14] },
    dark_cottage_01: { displayOffset: [0.9, -1.0], labelOffset: [10, -20] },
    cottage_row_east_01: { displayOffset: [0.8, 0.9], labelOffset: [10, 4] },

    // Baker / market / well center
    baker_back_door_01: { displayOffset: [-0.8, 0.4], labelOffset: [-52, -3] },
    baker_lane_01: { displayOffset: [0.8, -0.5], labelOffset: [9, -16] },
    flour_shed_01: { displayOffset: [0.9, -0.8], labelOffset: [9, -16] },
    market_gate_north_01: { displayOffset: [0.5, -1.0], labelOffset: [8, -18] },
    market_back_lane_01: { displayOffset: [1.0, 0.8], labelOffset: [9, 6] },
    market_stall_row_01: { displayOffset: [-0.9, -0.7], labelOffset: [-64, -13] },
    market_square_01: { displayOffset: [0.7, 1.1], labelOffset: [9, 9] },
    market_gate_west_01: { displayOffset: [-0.8, 0.3], labelOffset: [-68, 0] },
    well_lane_01: { displayOffset: [-1.1, 0], labelOffset: [-55, -2] },
    old_stone_well_01: { displayOffset: [0.5, -0.8], labelOffset: [8, -18] },
    well_yard_01: { displayOffset: [-0.5, 0.9], labelOffset: [-58, 8] },

    // Chapel / graveyard
    chapel_path_west_01: { displayOffset: [-0.9, 0.4], labelOffset: [-72, 2] },
    chapel_steps_01: { displayOffset: [0, -1.0], labelOffset: [8, -20] },
    graveyard_path_01: { displayOffset: [0.9, 0.5], labelOffset: [9, 4] },
    shrine_cart_01: { displayOffset: [-0.6, 1.0], labelOffset: [-62, 8] },

    // Shrine / drain cluster
    shrine_corner_01: { displayOffset: [-0.9, -0.6], labelOffset: [-68, -13] },
    old_wayside_shrine_01: { displayOffset: [0.8, 0.6], labelOffset: [9, 6] },
    sewer_grate_01: { displayOffset: [0.4, 1.0], labelOffset: [8, 7] },

    // East danger cluster
    guard_post_01: { displayOffset: [-0.3, -0.8], labelOffset: [8, -18] },
    watch_fire_01: { displayOffset: [0.7, 0.6], labelOffset: [9, 6] },
    kennel_fence_01: { displayOffset: [-0.6, -0.5], labelOffset: [-66, -12] },
    kennel_yard_01: { displayOffset: [0.8, 0.7], labelOffset: [9, 6] },
  };

  Object.entries(OFFSETS).forEach(([id, offsets]) => {
    const node = window.VILLAGE_NODE_MAP.nodes[id];
    if (!node) return;
    node.displayOffset = offsets.displayOffset ? { x: offsets.displayOffset[0], y: offsets.displayOffset[1] } : { x: 0, y: 0 };
    node.labelOffset = offsets.labelOffset ? { x: offsets.labelOffset[0], y: offsets.labelOffset[1] } : { x: 0, y: 0 };
  });

  window.VILLAGE_NODE_DISPLAY_OVERRIDES = OFFSETS;

  ensureNodeState?.();
  render?.();
})();