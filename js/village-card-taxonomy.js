// Adds placement metadata to event cards and narrows choice tags to action/mechanical traits.
// Node locationType decides where cards appear; choice tags describe what the player does.
(() => {
  if (typeof cards === "undefined") return;

  const CARD_META = {
    village_house_window: {
      locationTypes: ["sleeping-cottage", "back-window", "cottage-yard", "cottage-row"],
      encounterType: "entry",
      choices: { left: ["stealth", "entry"], right: ["avoid", "route"] },
    },
    inside_sleeping_house: {
      locationTypes: ["sleeping-cottage"],
      encounterType: "interior",
      choices: { left: ["theft"], right: ["food", "search"] },
    },
    locked_cottage: {
      locationTypes: ["sleeping-cottage", "dark-cottage", "back-window", "cottage-row"],
      encounterType: "locked-cache",
      choices: { left: ["lock", "theft"], right: ["stealth", "listen"] },
    },
    cellar_route: {
      locationTypes: ["sleeping-cottage", "cottage-back-path", "dark-cottage"],
      encounterType: "route",
      choices: { left: ["route", "escape"], right: ["route", "mark"] },
    },
    old_rooftops: {
      locationTypes: ["cottage-row", "market-gate", "market-back-lane"],
      encounterType: "rooftop-route",
      choices: { left: ["climb", "escape"], right: ["stealth", "blend"] },
    },

    baker_backdoor: {
      locationTypes: ["bakery", "baker-lane"],
      encounterType: "food-entry",
      choices: { left: ["stealth", "food"], right: ["search", "food"] },
    },
    hidden_pantry: {
      locationTypes: ["bakery", "flour-shed"],
      encounterType: "food-cache",
      choices: { left: ["food", "search"], right: ["lock", "theft"] },
    },

    market_stall: {
      locationTypes: ["market-square", "market-stalls", "market-gate"],
      encounterType: "market-loot",
      choices: { left: ["lock", "theft"], right: ["search", "supplies", "tool"] },
    },
    false_cache: {
      locationTypes: ["market-square", "market-stalls", "market-back-lane", "woodpile", "well-yard"],
      encounterType: "false-cache",
    },
    shrine_vendor: {
      locationTypes: ["shrine-cart", "shrine-corner", "market-square"],
      encounterType: "shrine-loot",
      choices: { left: ["theft", "spirit"], right: ["spirit", "magic", "route"] },
    },

    well_bucket: {
      locationTypes: ["stone-well", "well-yard", "well-lane"],
      encounterType: "well-search",
      choices: { left: ["climb", "dark"], right: ["tool", "retrieve"] },
    },
    plague_well: {
      locationTypes: ["stone-well", "well-yard"],
      encounterType: "corruption",
      choices: { left: ["spirit", "magic"], right: ["survival", "salvage"] },
    },
    well_tunnel: {
      locationTypes: ["stone-well", "well-yard", "stream-bank", "root-tunnel"],
      encounterType: "route",
      choices: { left: ["route", "escape"], right: ["route", "mark"] },
    },

    sewer_grate: {
      locationTypes: ["sewer-grate", "drain-path"],
      encounterType: "drain-entry",
      choices: { left: ["combat", "open", "route"], right: ["stealth", "listen"] },
    },
    drain_crawl: {
      locationTypes: ["drain-path", "collapsed-drain", "sewer-grate", "root-tunnel"],
      encounterType: "route",
      choices: { left: ["route", "escape"], right: ["route", "mark"] },
    },
    secret_tunnel: {
      locationTypes: ["collapsed-drain", "root-tunnel", "cottage-back-path"],
      encounterType: "route",
    },

    chapel_backroom: {
      locationTypes: ["chapel-steps", "chapel-path"],
      encounterType: "chapel-loot",
      choices: { left: ["lock", "theft"], right: ["lore", "route"] },
    },
    grave_bell: {
      locationTypes: ["chapel-steps", "graveyard-path", "shrine-cart", "wayside-shrine"],
      encounterType: "corruption",
      choices: { left: ["stealth", "theft"], right: ["cunning", "trap", "tool"] },
    },
    whispering_idol: {
      locationTypes: ["wayside-shrine", "shrine-corner", "chapel-steps", "graveyard-path"],
      encounterType: "corruption",
      choices: { left: ["combat", "magic"], right: ["spirit", "magic", "lore"] },
    },
    secret_route: {
      locationTypes: ["forest-edge", "forest-path", "overgrown-trail", "old-road", "chapel-path", "wayside-shrine", "wood-trail"],
      encounterType: "route",
      choices: { left: ["route", "escape"], right: ["route", "mark"] },
    },
    quiet_alley: {
      locationTypes: ["hedge-gap", "cottage-back-path", "market-back-lane", "baker-lane"],
      encounterType: "route",
      choices: { left: ["stealth", "route"], right: ["route", "mark"] },
    },
    sealed_road_marks: {
      locationTypes: ["old-road", "road-crossing", "market-gate", "guard-road"],
      encounterType: "route",
      choices: { left: ["spirit", "magic", "route"], right: ["survival", "route"] },
    },

    scout_sniffs_path: {
      locationTypes: ["forest-edge", "forest-path", "hedge-gap", "old-road", "road-crossing", "market-gate", "guard-road", "wood-trail"],
      encounterType: "patrol",
      choices: { left: ["stealth", "hide", "patrol"], right: ["combat", "scout"] },
    },
    watch_patrol: {
      locationTypes: ["road-crossing", "market-gate", "market-square", "guard-road", "guard-post", "watch-fire"],
      encounterType: "patrol",
      choices: { left: ["stealth", "hide", "patrol"], right: ["combat", "scout"] },
    },
    angry_villager: {
      locationTypes: ["sleeping-cottage", "cottage-row", "market-square", "bakery"],
      encounterType: "consequence",
      choices: { left: ["stealth", "hide"], right: ["combat", "intimidate"] },
    },

    guard_post: {
      locationTypes: ["guard-post", "guard-road", "watch-fire"],
      encounterType: "guard",
      choices: { left: ["theft", "quiet"], right: ["combat", "intimidate", "route"] },
    },
    guardhouse_shortcut: {
      locationTypes: ["guard-post", "kennel-fence", "kennel-yard"],
      encounterType: "route",
      choices: { left: ["route", "escape"], right: ["route", "mark"] },
    },
    kennel_yard: {
      locationTypes: ["kennel-yard", "kennel-fence"],
      encounterType: "kennel",
      choices: { left: ["stealth", "route"], right: ["trap", "tool"] },
    },
    hound_pack: {
      locationTypes: ["kennel-yard", "kennel-fence", "forest-edge", "wood-trail", "stream-bank"],
      encounterType: "hound-threat",
      choices: { left: ["combat", "scout"], right: ["stealth", "hide"] },
    },

    bloodroot: {
      locationTypes: ["forest-path", "overgrown-trail", "wood-trail", "root-tunnel", "collapsed-drain", "drain-path"],
      encounterType: "corruption",
      choices: { left: ["combat", "route"], right: ["survival", "route"] },
    },
    sealed_exit: {
      locationTypes: ["old-road", "road-crossing", "market-gate", "guard-road"],
      encounterType: "trap",
      choices: { left: ["spirit", "magic", "route"], right: ["survival", "route"] },
    },
    withered_supplies: {
      locationTypes: ["bakery", "flour-shed", "dark-cottage"],
      encounterType: "curse",
      choices: { left: ["spirit", "magic"], right: ["survival", "salvage"] },
    },
    rot_luck: {
      locationTypes: ["dark-cottage", "shrine-corner", "chapel-steps", "wayside-shrine"],
      encounterType: "curse",
      choices: { left: ["spirit", "magic"], right: ["cunning", "trap"] },
    },
  };

  Object.entries(CARD_META).forEach(([id, meta]) => {
    const card = cards[id];
    if (!card) return;
    card.locationTypes = [...meta.locationTypes];
    card.encounterType = meta.encounterType;
    if (meta.choices) {
      Object.entries(meta.choices).forEach(([side, tags]) => {
        if (card.choices?.[side]) card.choices[side].tags = [...tags];
      });
    }
  });

  window.VILLAGE_CARD_TAXONOMY = CARD_META;

  render?.();
})();