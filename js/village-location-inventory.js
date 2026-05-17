// Location-first inventory for rebuilding the village map from the PNG.
// This does not replace the active playable graph yet.
// The goal is to make every node correspond to a visible destination on the map.
(() => {
  const VILLAGE_LOCATION_INVENTORY = {
    meta: {
      name: "Whispermoor Village",
      coordinateSystem: "percent-of-source-map",
      sourceImage: "assets/maps/whispermoor-village-bg.png",
      designRule: "A location node should be something the player can point to on the PNG and say: I am going there.",
    },

    regions: {
      westApproach: {
        label: "West Approach",
        description: "Forest entry, western paths, and the first smoke-house cluster.",
        nodes: {
          west_forest_entry_01: {
            label: "Forest Edge",
            role: "junction",
            locationType: "forest-edge",
            x: 3.4,
            y: 38.8,
          },
          west_forest_path_01: {
            label: "Forest Path",
            role: "junction",
            locationType: "forest-path",
            x: 10.8,
            y: 28.2,
          },
          west_stream_bank_01: {
            label: "Stream Bank",
            role: "location",
            locationType: "stream-bank",
            x: 2.0,
            y: 63.8,
          },
          west_hedge_gap_01: {
            label: "Hedge Gap",
            role: "junction",
            locationType: "hedge-gap",
            x: 10.1,
            y: 49.8,
          },
          west_smoke_house_01: {
            label: "Smoke House",
            role: "location",
            locationType: "cottage",
            x: 9.4,
            y: 56.0,
          },
          west_old_road_01: {
            label: "Old Road Bend",
            role: "junction",
            locationType: "old-road",
            x: 18.6,
            y: 39.9,
          },
        },
      },

      northwestCottages: {
        label: "Northwest Cottages",
        description: "The small cottage group around the upper-left road fork.",
        nodes: {
          nw_overgrown_trail_01: {
            label: "Overgrown Trail",
            role: "junction",
            locationType: "overgrown-trail",
            x: 17.3,
            y: 26.5,
          },
          nw_cottage_yard_01: {
            label: "Cottage Yard",
            role: "location",
            locationType: "cottage-yard",
            x: 20.6,
            y: 18.6,
          },
          nw_back_window_cottage_01: {
            label: "Back Window Cottage",
            role: "location",
            locationType: "back-window",
            x: 30.1,
            y: 14.4,
          },
          nw_woodpile_01: {
            label: "Woodpile",
            role: "location",
            locationType: "woodpile",
            x: 28.0,
            y: 29.8,
          },
          nw_sleeping_cottage_01: {
            label: "Sleeping Cottage",
            role: "location",
            locationType: "sleeping-cottage",
            x: 24.8,
            y: 37.4,
          },
          nw_red_roof_cottage_01: {
            label: "Red Roof Cottage",
            role: "location",
            locationType: "cottage",
            x: 20.1,
            y: 35.5,
          },
        },
      },

      chapelHill: {
        label: "Chapel Hill",
        description: "Church, chapel steps, graveyard, and upper sacred path.",
        nodes: {
          chapel_front_door_01: {
            label: "Chapel Door",
            role: "location",
            locationType: "chapel-steps",
            x: 49.8,
            y: 20.6,
          },
          chapel_steps_01: {
            label: "Chapel Steps",
            role: "junction",
            locationType: "chapel-path",
            x: 51.0,
            y: 27.8,
          },
          chapel_west_path_01: {
            label: "Chapel West Path",
            role: "junction",
            locationType: "chapel-path",
            x: 40.8,
            y: 36.4,
          },
          chapel_graveyard_01: {
            label: "Graveyard",
            role: "location",
            locationType: "graveyard-path",
            x: 57.5,
            y: 32.0,
          },
          chapel_statue_yard_01: {
            label: "Statue Yard",
            role: "location",
            locationType: "shrine-corner",
            x: 57.6,
            y: 17.0,
          },
        },
      },

      centralMarket: {
        label: "Central Market",
        description: "The open square, stall ring, bakery edge, and central routes.",
        nodes: {
          central_crossroads_01: {
            label: "Central Crossroads",
            role: "junction",
            locationType: "road-crossing",
            x: 48.4,
            y: 42.0,
          },
          central_market_square_01: {
            label: "Market Square",
            role: "location",
            locationType: "market-square",
            x: 43.0,
            y: 57.8,
          },
          central_market_stalls_01: {
            label: "Market Stalls",
            role: "location",
            locationType: "market-stalls",
            x: 41.8,
            y: 48.0,
          },
          central_market_north_gate_01: {
            label: "Market North Gate",
            role: "junction",
            locationType: "market-gate",
            x: 53.9,
            y: 45.8,
          },
          central_market_west_gate_01: {
            label: "Market West Gate",
            role: "junction",
            locationType: "market-gate",
            x: 31.2,
            y: 47.5,
          },
          central_market_back_lane_01: {
            label: "Market Back Lane",
            role: "junction",
            locationType: "market-back-lane",
            x: 55.2,
            y: 55.0,
          },
          central_old_stone_well_01: {
            label: "Old Stone Well",
            role: "location",
            locationType: "stone-well",
            x: 48.4,
            y: 47.8,
          },
          central_baker_back_door_01: {
            label: "Baker Back Door",
            role: "location",
            locationType: "bakery",
            x: 42.3,
            y: 41.6,
          },
          central_baker_lane_01: {
            label: "Baker Lane",
            role: "junction",
            locationType: "baker-lane",
            x: 50.8,
            y: 39.0,
          },
          central_flour_shed_01: {
            label: "Flour Shed",
            role: "location",
            locationType: "flour-shed",
            x: 58.5,
            y: 50.8,
          },
        },
      },

      lowerVillage: {
        label: "Lower Village",
        description: "Lower fenced yards, well lane, gatehouse, sewer, and tunnel exits.",
        nodes: {
          lower_well_lane_01: {
            label: "Well Lane",
            role: "junction",
            locationType: "well-lane",
            x: 31.6,
            y: 55.0,
          },
          lower_well_yard_01: {
            label: "Well Yard",
            role: "location",
            locationType: "well-yard",
            x: 35.3,
            y: 65.0,
          },
          lower_muddy_turn_01: {
            label: "Muddy Turn",
            role: "junction",
            locationType: "muddy-road",
            x: 29.5,
            y: 78.5,
          },
          lower_root_tunnel_01: {
            label: "Root Tunnel",
            role: "location",
            locationType: "root-tunnel",
            x: 6.7,
            y: 83.2,
          },
          lower_collapsed_drain_01: {
            label: "Collapsed Drain",
            role: "location",
            locationType: "collapsed-drain",
            x: 3.4,
            y: 99.0,
          },
          lower_drain_path_01: {
            label: "Drain Path",
            role: "junction",
            locationType: "drain-path",
            x: 44.8,
            y: 93.5,
          },
          lower_gatehouse_01: {
            label: "Village Gate",
            role: "junction",
            locationType: "road-crossing",
            x: 48.8,
            y: 79.0,
          },
        },
      },

      shrineDrain: {
        label: "Shrine Drain",
        description: "The lower shrine, sewer grate, old wayside shrine, and marshy hollow.",
        nodes: {
          lower_shrine_corner_01: {
            label: "Shrine Corner",
            role: "location",
            locationType: "shrine-corner",
            x: 51.6,
            y: 67.4,
          },
          lower_wayside_shrine_01: {
            label: "Old Wayside Shrine",
            role: "location",
            locationType: "wayside-shrine",
            x: 59.2,
            y: 73.0,
          },
          lower_sewer_grate_01: {
            label: "Sewer Grate",
            role: "location",
            locationType: "sewer-grate",
            x: 55.4,
            y: 80.3,
          },
        },
      },

      eastVillage: {
        label: "East Village",
        description: "Guard route, kennel, fenced gardens, and eastern watch posts.",
        nodes: {
          east_guard_cut_01: {
            label: "Guard Cut",
            role: "junction",
            locationType: "guard-road",
            x: 65.6,
            y: 50.6,
          },
          east_guard_post_01: {
            label: "Guard Post",
            role: "location",
            locationType: "guard-post",
            x: 76.4,
            y: 20.8,
          },
          east_watch_fire_01: {
            label: "Watch Fire",
            role: "location",
            locationType: "watch-fire",
            x: 78.0,
            y: 26.5,
          },
          east_big_house_01: {
            label: "East House",
            role: "location",
            locationType: "cottage",
            x: 80.2,
            y: 43.4,
          },
          east_kennel_fence_01: {
            label: "Kennel Fence",
            role: "location",
            locationType: "kennel-fence",
            x: 77.4,
            y: 51.0,
          },
          east_kennel_yard_01: {
            label: "Kennel Yard",
            role: "location",
            locationType: "kennel-yard",
            x: 81.2,
            y: 60.8,
          },
          east_wood_trail_01: {
            label: "Wood Trail",
            role: "junction",
            locationType: "wood-trail",
            x: 83.0,
            y: 87.2,
          },
        },
      },
    },
  };

  window.VILLAGE_LOCATION_INVENTORY = VILLAGE_LOCATION_INVENTORY;
})();