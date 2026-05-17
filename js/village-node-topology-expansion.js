// Replaces the first-pass village node graph with a denser 43-node stealth point-crawl topology.
(() => {
  if (!window.VILLAGE_NODE_MAP) return;

  const N = {
    forest_edge_01: { label: "Forest Edge", kind: "forest", x: 8, y: 42, tags: ["forest", "route", "escape", "quiet"], connectsTo: ["forest_path_01", "stream_bank_01", "old_road_west_01", "hedge_gap_01"], eventPool: ["secret_route"], randomPool: ["scout_sniffs_path", "hound_pack"], encounterChance: 8 },
    forest_path_01: { label: "Forest Path", kind: "path", x: 17, y: 37, tags: ["forest", "path", "route", "stealth"], connectsTo: ["forest_edge_01", "overgrown_trail_01", "old_road_west_01", "cottage_back_path_01"], eventPool: [], randomPool: ["scout_sniffs_path", "bloodroot"], encounterChance: 10 },
    stream_bank_01: { label: "Stream Bank", kind: "water", x: 6, y: 66, tags: ["water", "mud", "escape", "quiet"], connectsTo: ["forest_edge_01", "sewer_grate_01", "root_tunnel_01"], eventPool: [], randomPool: ["hound_pack", "bloodroot"], encounterChance: 10 },
    hedge_gap_01: { label: "Hedge Gap", kind: "path", x: 16, y: 50, tags: ["forest", "route", "stealth", "house"], connectsTo: ["forest_edge_01", "cottage_yard_01", "woodpile_01"], eventPool: [], randomPool: ["scout_sniffs_path"], encounterChance: 9 },

    old_road_west_01: { label: "Old Road West", kind: "road", x: 25, y: 43, tags: ["road", "village", "exposed"], connectsTo: ["forest_edge_01", "forest_path_01", "old_road_crossing_01", "well_lane_01"], eventPool: ["secret_route"], randomPool: ["scout_sniffs_path", "sealed_exit"], encounterChance: 16 },
    overgrown_trail_01: { label: "Overgrown Trail", kind: "path", x: 27, y: 32, tags: ["forest", "path", "route", "dark"], connectsTo: ["forest_path_01", "old_road_crossing_01", "cottage_back_path_01"], eventPool: [], randomPool: ["bloodroot", "whispering_idol"], encounterChance: 14 },
    old_road_crossing_01: { label: "Old Road Crossing", kind: "road", x: 36, y: 42, tags: ["road", "exposed", "patrol"], connectsTo: ["old_road_west_01", "overgrown_trail_01", "market_gate_west_01", "cottage_row_west_01", "well_lane_01"], eventPool: [], randomPool: ["scout_sniffs_path", "watch_patrol", "sealed_exit"], encounterChance: 20 },
    muddy_turn_01: { label: "Muddy Turn", kind: "road", x: 35, y: 80, tags: ["road", "mud", "exposed"], connectsTo: ["well_lane_01", "chapel_path_west_01", "drain_path_01"], eventPool: [], randomPool: ["scout_sniffs_path", "sealed_exit"], encounterChance: 18 },

    cottage_row_west_01: { label: "Cottage Row West", kind: "road", x: 38, y: 36, tags: ["road", "house", "village"], connectsTo: ["old_road_crossing_01", "sleeping_cottage_01", "cottage_yard_01", "cottage_row_east_01"], eventPool: [], randomPool: ["watch_patrol", "false_cache"], encounterChance: 15 },
    sleeping_cottage_01: { label: "Sleeping Cottage", kind: "house", x: 30, y: 34, tags: ["house", "food", "theft", "stealth"], connectsTo: ["cottage_row_west_01", "cottage_yard_01", "back_window_01"], eventPool: ["village_house_window", "inside_sleeping_house"], randomPool: ["false_cache", "watch_patrol"], encounterChance: 25 },
    cottage_yard_01: { label: "Cottage Yard", kind: "yard", x: 28, y: 27, tags: ["yard", "house", "stealth", "route"], connectsTo: ["hedge_gap_01", "cottage_row_west_01", "sleeping_cottage_01", "woodpile_01", "back_window_01"], eventPool: [], randomPool: ["scout_sniffs_path"], encounterChance: 12 },
    woodpile_01: { label: "Woodpile", kind: "yard", x: 33, y: 35, tags: ["yard", "hide", "wood", "stealth"], connectsTo: ["hedge_gap_01", "cottage_yard_01", "cottage_back_path_01"], eventPool: [], randomPool: ["false_cache"], encounterChance: 8 },
    back_window_01: { label: "Back Window", kind: "house", x: 38, y: 23, tags: ["house", "entry", "stealth", "theft"], connectsTo: ["sleeping_cottage_01", "cottage_yard_01", "cottage_back_path_01"], eventPool: ["village_house_window", "locked_cottage"], randomPool: ["watch_patrol"], encounterChance: 24 },
    cottage_back_path_01: { label: "Cottage Back Path", kind: "alley", x: 45, y: 36, tags: ["alley", "house", "stealth", "route"], connectsTo: ["forest_path_01", "overgrown_trail_01", "woodpile_01", "back_window_01", "baker_lane_01", "dark_cottage_01"], eventPool: ["quiet_alley"], randomPool: ["scout_sniffs_path", "hound_pack"], encounterChance: 15 },
    dark_cottage_01: { label: "Dark Cottage", kind: "house", x: 48, y: 27, tags: ["house", "dark", "search", "food"], connectsTo: ["cottage_back_path_01", "cottage_row_east_01", "baker_lane_01"], eventPool: ["apothecary_drawer", "locked_cottage"], randomPool: ["rot_luck", "withered_supplies"], encounterChance: 22 },
    cottage_row_east_01: { label: "Cottage Row East", kind: "road", x: 52, y: 35, tags: ["road", "house", "village", "exposed"], connectsTo: ["cottage_row_west_01", "dark_cottage_01", "baker_lane_01", "market_gate_north_01"], eventPool: [], randomPool: ["watch_patrol", "scout_sniffs_path"], encounterChance: 18 },

    baker_lane_01: { label: "Baker Lane", kind: "alley", x: 60, y: 36, tags: ["alley", "food", "house", "route"], connectsTo: ["cottage_back_path_01", "dark_cottage_01", "cottage_row_east_01", "baker_back_door_01", "market_back_lane_01"], eventPool: [], randomPool: ["watch_patrol"], encounterChance: 14 },
    baker_back_door_01: { label: "Baker Back Door", kind: "house", x: 66, y: 27, tags: ["house", "food", "theft", "entry"], connectsTo: ["baker_lane_01", "flour_shed_01", "market_back_lane_01"], eventPool: ["baker_backdoor", "hidden_pantry"], randomPool: ["false_cache", "withered_supplies"], encounterChance: 25 },
    flour_shed_01: { label: "Flour Shed", kind: "shed", x: 70, y: 33, tags: ["shed", "food", "search", "stealth"], connectsTo: ["baker_back_door_01", "market_back_lane_01"], eventPool: ["hidden_pantry"], randomPool: ["false_cache"], encounterChance: 18 },

    market_gate_west_01: { label: "Market Gate West", kind: "road", x: 41, y: 51, tags: ["road", "market", "exposed"], connectsTo: ["old_road_crossing_01", "market_square_01", "well_lane_01"], eventPool: [], randomPool: ["watch_patrol", "scout_sniffs_path"], encounterChance: 22 },
    market_square_01: { label: "Market Square", kind: "market", x: 52, y: 52, tags: ["market", "theft", "crowd", "search", "exposed"], connectsTo: ["market_gate_west_01", "market_stall_row_01", "market_back_lane_01", "shrine_corner_01", "guard_cut_01"], eventPool: ["market_stall", "shrine_vendor", "false_cache"], randomPool: ["watch_patrol", "scout_sniffs_path", "rot_luck"], encounterChance: 28 },
    market_stall_row_01: { label: "Market Stall Row", kind: "market", x: 53, y: 45, tags: ["market", "supplies", "theft", "tool"], connectsTo: ["market_square_01", "market_back_lane_01", "market_gate_north_01"], eventPool: ["market_stall", "false_cache"], randomPool: ["watch_patrol"], encounterChance: 25 },
    market_gate_north_01: { label: "Market Gate North", kind: "road", x: 62, y: 43, tags: ["road", "market", "house", "exposed"], connectsTo: ["cottage_row_east_01", "market_stall_row_01", "guard_cut_01"], eventPool: [], randomPool: ["watch_patrol", "sealed_exit"], encounterChance: 23 },
    market_back_lane_01: { label: "Market Back Lane", kind: "alley", x: 63, y: 50, tags: ["alley", "market", "stealth", "route"], connectsTo: ["baker_lane_01", "baker_back_door_01", "flour_shed_01", "market_square_01", "market_stall_row_01", "shrine_corner_01"], eventPool: [], randomPool: ["scout_sniffs_path", "false_cache"], encounterChance: 18 },
    shrine_corner_01: { label: "Shrine Corner", kind: "shrine", x: 60, y: 61, tags: ["shrine", "market", "spirit", "lore"], connectsTo: ["market_square_01", "market_back_lane_01", "shrine_cart_01"], eventPool: [], randomPool: ["grave_bell", "whispering_idol"], encounterChance: 20 },

    well_lane_01: { label: "Well Lane", kind: "road", x: 31, y: 58, tags: ["road", "well", "exposed"], connectsTo: ["old_road_west_01", "old_road_crossing_01", "market_gate_west_01", "old_stone_well_01", "muddy_turn_01"], eventPool: [], randomPool: ["scout_sniffs_path", "grave_bell"], encounterChance: 18 },
    old_stone_well_01: { label: "Old Stone Well", kind: "well", x: 25, y: 70, tags: ["well", "water", "dark", "tunnel"], connectsTo: ["well_lane_01", "well_yard_01", "sewer_grate_01", "chapel_path_west_01"], eventPool: ["well_bucket", "plague_well"], randomPool: ["plague_well", "whispering_idol"], encounterChance: 24 },
    well_yard_01: { label: "Well Yard", kind: "yard", x: 36, y: 67, tags: ["yard", "well", "search", "exposed"], connectsTo: ["old_stone_well_01", "market_gate_west_01", "chapel_path_west_01"], eventPool: [], randomPool: ["false_cache", "scout_sniffs_path"], encounterChance: 20 },
    sewer_grate_01: { label: "Sewer Grate", kind: "sewer", x: 13, y: 66, tags: ["sewer", "route", "escape", "dark"], connectsTo: ["stream_bank_01", "old_stone_well_01", "drain_path_01", "root_tunnel_01"], eventPool: ["sewer_grate", "drain_crawl"], randomPool: ["hound_pack", "bloodroot"], encounterChance: 20 },
    drain_path_01: { label: "Drain Path", kind: "sewer", x: 23, y: 83, tags: ["sewer", "mud", "escape", "route"], connectsTo: ["sewer_grate_01", "muddy_turn_01", "collapsed_drain_01"], eventPool: [], randomPool: ["bloodroot", "scout_sniffs_path"], encounterChance: 18 },
    collapsed_drain_01: { label: "Collapsed Drain", kind: "sewer", x: 13, y: 88, tags: ["sewer", "dark", "danger", "route"], connectsTo: ["drain_path_01", "root_tunnel_01"], eventPool: ["drain_crawl", "secret_tunnel"], randomPool: ["bloodroot", "hound_pack"], encounterChance: 28 },
    root_tunnel_01: { label: "Root Tunnel", kind: "path", x: 14, y: 76, tags: ["tunnel", "forest", "escape", "dark"], connectsTo: ["stream_bank_01", "sewer_grate_01", "collapsed_drain_01"], eventPool: ["secret_tunnel"], randomPool: ["bloodroot", "whispering_idol"], encounterChance: 22 },

    chapel_path_west_01: { label: "Chapel Path West", kind: "road", x: 48, y: 74, tags: ["road", "shrine", "spirit", "exposed"], connectsTo: ["muddy_turn_01", "old_stone_well_01", "well_yard_01", "chapel_steps_01"], eventPool: [], randomPool: ["grave_bell", "scout_sniffs_path"], encounterChance: 22 },
    chapel_steps_01: { label: "Chapel Steps", kind: "shrine", x: 58, y: 80, tags: ["shrine", "spirit", "lore", "magic"], connectsTo: ["chapel_path_west_01", "shrine_cart_01", "graveyard_path_01"], eventPool: ["chapel_backroom", "grave_bell", "whispering_idol"], randomPool: ["rot_luck"], encounterChance: 26 },
    shrine_cart_01: { label: "Shrine Cart", kind: "shrine", x: 65, y: 67, tags: ["shrine", "market", "spirit", "lore"], connectsTo: ["shrine_corner_01", "chapel_steps_01", "old_wayside_shrine_01"], eventPool: ["shrine_vendor"], randomPool: ["grave_bell", "whispering_idol", "rot_luck"], encounterChance: 26 },
    old_wayside_shrine_01: { label: "Old Wayside Shrine", kind: "shrine", x: 72, y: 67, tags: ["shrine", "forest", "magic", "dark"], connectsTo: ["shrine_cart_01", "graveyard_path_01", "wood_trail_01", "guard_cut_01"], eventPool: ["whispering_idol", "grave_bell"], randomPool: ["rot_luck"], encounterChance: 28 },
    graveyard_path_01: { label: "Graveyard Path", kind: "path", x: 72, y: 82, tags: ["graveyard", "path", "spirit", "dark"], connectsTo: ["chapel_steps_01", "old_wayside_shrine_01", "wood_trail_01"], eventPool: [], randomPool: ["whispering_idol", "hound_pack"], encounterChance: 24 },
    wood_trail_01: { label: "Wood Trail", kind: "forest", x: 86, y: 83, tags: ["forest", "escape", "dark", "route"], connectsTo: ["graveyard_path_01", "old_wayside_shrine_01", "kennel_fence_01"], eventPool: [], randomPool: ["bloodroot", "hound_pack"], encounterChance: 20 },

    guard_cut_01: { label: "Guard Cut", kind: "road", x: 75, y: 52, tags: ["road", "guard", "exposed", "patrol"], connectsTo: ["market_square_01", "market_gate_north_01", "old_wayside_shrine_01", "guard_post_01", "kennel_fence_01"], eventPool: [], randomPool: ["watch_patrol", "hound_pack", "sealed_exit"], encounterChance: 32 },
    guard_post_01: { label: "Guard Post", kind: "guard", x: 82, y: 25, tags: ["guard", "combat", "patrol", "exposed"], connectsTo: ["guard_cut_01", "watch_fire_01", "kennel_yard_01"], eventPool: ["guard_post", "scout_sniffs_path"], randomPool: ["watch_patrol", "sealed_exit"], encounterChance: 35 },
    watch_fire_01: { label: "Watch Fire", kind: "guard", x: 82, y: 27, tags: ["guard", "fire", "patrol", "danger"], connectsTo: ["guard_post_01", "kennel_yard_01"], eventPool: ["scout_sniffs_path", "watch_patrol"], randomPool: ["hound_pack"], encounterChance: 36 },
    kennel_fence_01: { label: "Kennel Fence", kind: "kennel", x: 84, y: 58, tags: ["kennel", "hounds", "fence", "danger"], connectsTo: ["guard_cut_01", "wood_trail_01", "kennel_yard_01"], eventPool: [], randomPool: ["hound_pack", "snare_path"], encounterChance: 34 },
    kennel_yard_01: { label: "Kennel Yard", kind: "kennel", x: 84, y: 63, tags: ["kennel", "hounds", "danger", "patrol"], connectsTo: ["kennel_fence_01", "guard_post_01", "watch_fire_01"], eventPool: ["kennel_yard", "hound_pack"], randomPool: ["hound_pack", "snare_path"], encounterChance: 38 },
  };

  window.VILLAGE_NODE_MAP.nodes = N;

  if (game?.mapState?.village?.nodes) {
    Object.keys(game.mapState.village.nodes).forEach(id => {
      if (!N[id]) delete game.mapState.village.nodes[id];
    });
  }

  if (game?.hero && (!game.hero.currentNodeId || !N[game.hero.currentNodeId])) {
    game.hero.currentNodeId = window.VILLAGE_NODE_MAP.startNodeId;
  }

  ensureNodeState?.();
  render?.();
})();