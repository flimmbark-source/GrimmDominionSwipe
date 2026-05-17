// Calibrated village node connection graph.
// Keeps movement local and reduces long crossing lines on the full-map overlay.
(() => {
  if (!window.VILLAGE_NODE_MAP?.nodes) return;

  const LINKS = {
    // West forest / outer approaches
    forest_edge_01: ["forest_path_01", "stream_bank_01", "hedge_gap_01"],
    forest_path_01: ["forest_edge_01", "overgrown_trail_01", "old_road_west_01", "hedge_gap_01"],
    stream_bank_01: ["forest_edge_01", "root_tunnel_01"],
    hedge_gap_01: ["forest_edge_01", "forest_path_01", "old_road_west_01"],

    // Western road spine
    old_road_west_01: ["forest_path_01", "hedge_gap_01", "old_road_crossing_01", "sleeping_cottage_01"],
    overgrown_trail_01: ["forest_path_01", "cottage_yard_01", "woodpile_01"],
    old_road_crossing_01: ["old_road_west_01", "cottage_row_west_01", "market_gate_west_01", "well_lane_01"],
    muddy_turn_01: ["well_yard_01", "root_tunnel_01", "drain_path_01"],

    // Western cottage cluster
    sleeping_cottage_01: ["old_road_west_01", "cottage_row_west_01", "cottage_yard_01"],
    cottage_yard_01: ["overgrown_trail_01", "sleeping_cottage_01", "woodpile_01", "back_window_01"],
    woodpile_01: ["overgrown_trail_01", "cottage_yard_01", "cottage_back_path_01"],
    back_window_01: ["cottage_yard_01", "cottage_back_path_01"],
    cottage_row_west_01: ["old_road_crossing_01", "sleeping_cottage_01", "cottage_back_path_01", "cottage_row_east_01"],
    cottage_back_path_01: ["woodpile_01", "back_window_01", "cottage_row_west_01", "dark_cottage_01", "baker_back_door_01"],
    dark_cottage_01: ["cottage_back_path_01", "baker_back_door_01"],
    cottage_row_east_01: ["cottage_row_west_01", "baker_lane_01", "market_gate_north_01"],

    // Baker / food cluster
    baker_back_door_01: ["cottage_back_path_01", "dark_cottage_01", "baker_lane_01"],
    baker_lane_01: ["baker_back_door_01", "cottage_row_east_01", "market_gate_north_01", "market_back_lane_01"],
    flour_shed_01: ["market_gate_north_01", "market_back_lane_01"],

    // Market center
    market_gate_west_01: ["old_road_crossing_01", "well_lane_01", "market_square_01", "market_stall_row_01"],
    market_square_01: ["market_gate_west_01", "market_stall_row_01", "market_back_lane_01", "shrine_corner_01"],
    market_stall_row_01: ["market_gate_west_01", "market_square_01", "market_gate_north_01", "market_back_lane_01"],
    market_gate_north_01: ["cottage_row_east_01", "baker_lane_01", "flour_shed_01", "market_stall_row_01", "guard_cut_01"],
    market_back_lane_01: ["baker_lane_01", "flour_shed_01", "market_square_01", "market_stall_row_01", "shrine_corner_01", "guard_cut_01"],
    shrine_corner_01: ["market_square_01", "market_back_lane_01", "old_wayside_shrine_01", "sewer_grate_01"],

    // Well / lower village / drains
    well_lane_01: ["old_road_crossing_01", "market_gate_west_01", "old_stone_well_01", "well_yard_01"],
    old_stone_well_01: ["well_lane_01", "well_yard_01", "market_stall_row_01"],
    well_yard_01: ["well_lane_01", "old_stone_well_01", "muddy_turn_01", "sewer_grate_01"],
    root_tunnel_01: ["stream_bank_01", "collapsed_drain_01", "muddy_turn_01"],
    collapsed_drain_01: ["root_tunnel_01", "drain_path_01"],
    drain_path_01: ["collapsed_drain_01", "muddy_turn_01", "sewer_grate_01"],
    sewer_grate_01: ["drain_path_01", "well_yard_01", "shrine_corner_01", "old_wayside_shrine_01"],

    // Chapel / shrine / graveyard
    chapel_path_west_01: ["cottage_row_east_01", "chapel_steps_01", "well_lane_01"],
    chapel_steps_01: ["chapel_path_west_01", "graveyard_path_01", "shrine_cart_01"],
    graveyard_path_01: ["chapel_steps_01", "shrine_cart_01", "guard_post_01"],
    shrine_cart_01: ["chapel_steps_01", "graveyard_path_01", "guard_post_01"],
    old_wayside_shrine_01: ["shrine_corner_01", "sewer_grate_01", "guard_cut_01", "wood_trail_01"],
    wood_trail_01: ["old_wayside_shrine_01", "kennel_yard_01"],

    // East guard / kennel cluster
    guard_cut_01: ["market_gate_north_01", "market_back_lane_01", "old_wayside_shrine_01", "kennel_fence_01"],
    guard_post_01: ["graveyard_path_01", "shrine_cart_01", "watch_fire_01"],
    watch_fire_01: ["guard_post_01", "kennel_fence_01"],
    kennel_fence_01: ["guard_cut_01", "watch_fire_01", "kennel_yard_01"],
    kennel_yard_01: ["kennel_fence_01", "wood_trail_01"],
  };

  const nodes = window.VILLAGE_NODE_MAP.nodes;
  Object.values(nodes).forEach(node => { node.connectsTo = []; });

  Object.entries(LINKS).forEach(([id, targets]) => {
    if (!nodes[id]) return;
    targets.forEach(target => {
      if (!nodes[target] || target === id) return;
      if (!nodes[id].connectsTo.includes(target)) nodes[id].connectsTo.push(target);
      if (!nodes[target].connectsTo.includes(id)) nodes[target].connectsTo.push(id);
    });
  });

  window.VILLAGE_CONNECTION_OVERRIDES = LINKS;

  ensureNodeState?.();
  render?.();
})();