// Builds the active playable graph from VILLAGE_LOCATION_INVENTORY.
// The PNG/location inventory becomes the source of truth; old abstract node IDs are replaced at runtime.
(() => {
  if (!window.VILLAGE_NODE_MAP || !window.VILLAGE_LOCATION_INVENTORY) return;

  const START_NODE = "west_forest_entry_01";

  const OLD_TO_NEW = {
    forest_edge_01: "west_forest_entry_01",
    forest_path_01: "west_forest_path_01",
    stream_bank_01: "west_stream_bank_01",
    hedge_gap_01: "west_hedge_gap_01",
    old_road_west_01: "west_old_road_01",
    overgrown_trail_01: "nw_overgrown_trail_01",
    old_road_crossing_01: "central_crossroads_01",
    muddy_turn_01: "lower_muddy_turn_01",
    cottage_row_west_01: "nw_sleeping_cottage_01",
    sleeping_cottage_01: "nw_sleeping_cottage_01",
    cottage_yard_01: "nw_cottage_yard_01",
    woodpile_01: "nw_woodpile_01",
    back_window_01: "nw_back_window_cottage_01",
    cottage_back_path_01: "central_baker_lane_01",
    dark_cottage_01: "nw_back_window_cottage_01",
    cottage_row_east_01: "central_baker_lane_01",
    baker_lane_01: "central_baker_lane_01",
    baker_back_door_01: "central_baker_back_door_01",
    flour_shed_01: "central_flour_shed_01",
    market_gate_west_01: "central_market_west_gate_01",
    market_square_01: "central_market_square_01",
    market_stall_row_01: "central_market_stalls_01",
    market_gate_north_01: "central_market_north_gate_01",
    market_back_lane_01: "central_market_back_lane_01",
    shrine_corner_01: "lower_shrine_corner_01",
    well_lane_01: "lower_well_lane_01",
    old_stone_well_01: "central_old_stone_well_01",
    well_yard_01: "lower_well_yard_01",
    sewer_grate_01: "lower_sewer_grate_01",
    drain_path_01: "lower_drain_path_01",
    collapsed_drain_01: "lower_collapsed_drain_01",
    root_tunnel_01: "lower_root_tunnel_01",
    chapel_path_west_01: "chapel_west_path_01",
    chapel_steps_01: "chapel_front_door_01",
    shrine_cart_01: "chapel_statue_yard_01",
    old_wayside_shrine_01: "lower_wayside_shrine_01",
    graveyard_path_01: "chapel_graveyard_01",
    wood_trail_01: "east_wood_trail_01",
    guard_cut_01: "east_guard_cut_01",
    guard_post_01: "east_guard_post_01",
    watch_fire_01: "east_watch_fire_01",
    kennel_fence_01: "east_kennel_fence_01",
    kennel_yard_01: "east_kennel_yard_01",
  };

  const LOCATION_KIND = {
    "forest-edge": "forest",
    "forest-path": "forest",
    "stream-bank": "well",
    "hedge-gap": "path",
    "old-road": "road",
    "overgrown-trail": "forest",
    "road-crossing": "road",
    "muddy-road": "road",
    "cottage": "house",
    "cottage-row": "house",
    "sleeping-cottage": "house",
    "cottage-yard": "house",
    woodpile: "yard",
    "back-window": "house",
    bakery: "house",
    "baker-lane": "alley",
    "flour-shed": "market",
    "market-gate": "road",
    "market-square": "market",
    "market-stalls": "market",
    "market-back-lane": "alley",
    "stone-well": "well",
    "well-lane": "road",
    "well-yard": "well",
    "sewer-grate": "sewer",
    "drain-path": "sewer",
    "collapsed-drain": "sewer",
    "root-tunnel": "path",
    "chapel-path": "road",
    "chapel-steps": "shrine",
    "shrine-corner": "shrine",
    "wayside-shrine": "shrine",
    "graveyard-path": "shrine",
    "guard-road": "guard",
    "guard-post": "guard",
    "watch-fire": "guard",
    "kennel-fence": "kennel",
    "kennel-yard": "kennel",
    "wood-trail": "forest",
  };

  const ENCOUNTER_LOCATION_TYPE = {
    cottage: "cottage-row",
  };

  const LINKS = {
    west_forest_entry_01: ["west_forest_path_01", "west_stream_bank_01", "west_hedge_gap_01"],
    west_forest_path_01: ["west_forest_entry_01", "west_old_road_01", "west_hedge_gap_01", "nw_overgrown_trail_01"],
    west_stream_bank_01: ["west_forest_entry_01", "lower_root_tunnel_01"],
    west_hedge_gap_01: ["west_forest_entry_01", "west_forest_path_01", "west_smoke_house_01", "west_old_road_01"],
    west_smoke_house_01: ["west_hedge_gap_01", "nw_red_roof_cottage_01", "lower_well_lane_01"],
    west_old_road_01: ["west_forest_path_01", "west_hedge_gap_01", "nw_sleeping_cottage_01", "central_market_west_gate_01"],

    nw_overgrown_trail_01: ["west_forest_path_01", "nw_cottage_yard_01", "nw_woodpile_01"],
    nw_cottage_yard_01: ["nw_overgrown_trail_01", "nw_back_window_cottage_01", "nw_woodpile_01", "nw_red_roof_cottage_01"],
    nw_back_window_cottage_01: ["nw_cottage_yard_01", "nw_woodpile_01", "chapel_west_path_01"],
    nw_woodpile_01: ["nw_overgrown_trail_01", "nw_cottage_yard_01", "nw_back_window_cottage_01", "nw_sleeping_cottage_01"],
    nw_sleeping_cottage_01: ["nw_woodpile_01", "nw_red_roof_cottage_01", "west_old_road_01", "central_market_west_gate_01"],
    nw_red_roof_cottage_01: ["nw_cottage_yard_01", "nw_sleeping_cottage_01", "west_smoke_house_01"],

    chapel_front_door_01: ["chapel_steps_01", "chapel_statue_yard_01", "chapel_graveyard_01"],
    chapel_steps_01: ["chapel_front_door_01", "chapel_west_path_01", "chapel_graveyard_01"],
    chapel_west_path_01: ["nw_back_window_cottage_01", "chapel_steps_01", "central_baker_lane_01", "central_market_north_gate_01"],
    chapel_graveyard_01: ["chapel_front_door_01", "chapel_steps_01", "chapel_statue_yard_01", "lower_wayside_shrine_01", "east_guard_post_01"],
    chapel_statue_yard_01: ["chapel_front_door_01", "chapel_graveyard_01", "lower_wayside_shrine_01"],

    central_crossroads_01: ["central_market_square_01", "central_market_west_gate_01", "central_market_north_gate_01", "central_old_stone_well_01", "central_baker_lane_01", "lower_gatehouse_01"],
    central_market_square_01: ["central_crossroads_01", "central_market_stalls_01", "central_market_west_gate_01", "central_market_back_lane_01", "lower_shrine_corner_01"],
    central_market_stalls_01: ["central_market_square_01", "central_old_stone_well_01", "central_baker_back_door_01", "central_market_north_gate_01"],
    central_market_north_gate_01: ["central_crossroads_01", "central_market_stalls_01", "central_baker_lane_01", "central_flour_shed_01", "east_guard_cut_01", "chapel_west_path_01"],
    central_market_west_gate_01: ["west_old_road_01", "nw_sleeping_cottage_01", "central_crossroads_01", "central_market_square_01", "lower_well_lane_01"],
    central_market_back_lane_01: ["central_market_square_01", "central_flour_shed_01", "central_baker_back_door_01", "lower_shrine_corner_01", "east_guard_cut_01"],
    central_old_stone_well_01: ["central_crossroads_01", "central_market_stalls_01", "lower_well_lane_01", "lower_well_yard_01"],
    central_baker_back_door_01: ["central_baker_lane_01", "central_market_stalls_01", "central_market_back_lane_01", "central_flour_shed_01"],
    central_baker_lane_01: ["chapel_west_path_01", "central_crossroads_01", "central_market_north_gate_01", "central_baker_back_door_01"],
    central_flour_shed_01: ["central_market_north_gate_01", "central_market_back_lane_01", "central_baker_back_door_01"],

    lower_well_lane_01: ["central_market_west_gate_01", "central_old_stone_well_01", "lower_well_yard_01", "west_smoke_house_01", "lower_muddy_turn_01"],
    lower_well_yard_01: ["lower_well_lane_01", "central_old_stone_well_01", "lower_muddy_turn_01", "lower_gatehouse_01"],
    lower_muddy_turn_01: ["lower_well_lane_01", "lower_well_yard_01", "lower_root_tunnel_01", "lower_drain_path_01"],
    lower_root_tunnel_01: ["west_stream_bank_01", "lower_muddy_turn_01", "lower_collapsed_drain_01"],
    lower_collapsed_drain_01: ["lower_root_tunnel_01", "lower_drain_path_01"],
    lower_drain_path_01: ["lower_collapsed_drain_01", "lower_muddy_turn_01", "lower_gatehouse_01", "lower_sewer_grate_01"],
    lower_gatehouse_01: ["central_crossroads_01", "lower_well_yard_01", "lower_drain_path_01", "lower_sewer_grate_01"],

    lower_shrine_corner_01: ["central_market_square_01", "central_market_back_lane_01", "lower_wayside_shrine_01", "lower_sewer_grate_01"],
    lower_wayside_shrine_01: ["lower_shrine_corner_01", "lower_sewer_grate_01", "chapel_graveyard_01", "chapel_statue_yard_01", "east_wood_trail_01"],
    lower_sewer_grate_01: ["lower_gatehouse_01", "lower_drain_path_01", "lower_shrine_corner_01", "lower_wayside_shrine_01"],

    east_guard_cut_01: ["central_market_north_gate_01", "central_market_back_lane_01", "east_guard_post_01", "east_big_house_01", "east_kennel_fence_01"],
    east_guard_post_01: ["east_guard_cut_01", "east_watch_fire_01", "chapel_graveyard_01"],
    east_watch_fire_01: ["east_guard_post_01", "east_big_house_01"],
    east_big_house_01: ["east_guard_cut_01", "east_watch_fire_01", "east_kennel_fence_01"],
    east_kennel_fence_01: ["east_guard_cut_01", "east_big_house_01", "east_kennel_yard_01", "east_wood_trail_01"],
    east_kennel_yard_01: ["east_kennel_fence_01"],
    east_wood_trail_01: ["lower_wayside_shrine_01", "east_kennel_fence_01"],
  };

  function flattenInventory() {
    const nodes = {};
    Object.values(window.VILLAGE_LOCATION_INVENTORY.regions || {}).forEach(region => {
      Object.entries(region.nodes || {}).forEach(([id, source]) => {
        const locationType = ENCOUNTER_LOCATION_TYPE[source.locationType] || source.locationType;
        nodes[id] = {
          label: source.label,
          role: source.role || "location",
          locationType,
          sourceLocationType: source.locationType,
          kind: LOCATION_KIND[source.locationType] || LOCATION_KIND[locationType] || "path",
          x: source.x,
          y: source.y,
          tags: [locationType],
          traits: source.role === "junction" ? ["junction"] : [],
          connectsTo: [],
          eventPool: [],
          randomPool: [],
          encounterChance: source.role === "junction" ? 14 : 22,
        };
      });
    });
    return nodes;
  }

  function connect(nodes, a, b) {
    if (!nodes[a] || !nodes[b] || a === b) return;
    if (!nodes[a].connectsTo.includes(b)) nodes[a].connectsTo.push(b);
    if (!nodes[b].connectsTo.includes(a)) nodes[b].connectsTo.push(a);
  }

  const nodes = flattenInventory();
  Object.entries(LINKS).forEach(([id, targets]) => targets.forEach(target => connect(nodes, id, target)));

  window.VILLAGE_NODE_MAP.startNodeId = START_NODE;
  window.VILLAGE_NODE_MAP.nodes = nodes;
  window.VILLAGE_LOCATION_GRAPH_ACTIVE = true;
  window.VILLAGE_LOCATION_GRAPH_LINKS = LINKS;

  if (game?.mapState?.village?.nodes) {
    Object.keys(game.mapState.village.nodes).forEach(id => {
      if (!nodes[id]) delete game.mapState.village.nodes[id];
    });
  }

  if (game?.hero) {
    game.hero.currentNodeId = OLD_TO_NEW[game.hero.currentNodeId] || game.hero.currentNodeId || START_NODE;
    if (!nodes[game.hero.currentNodeId]) game.hero.currentNodeId = START_NODE;
  }

  ensureNodeState?.();
  render?.();
})();