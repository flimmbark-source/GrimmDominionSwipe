// Village encounter arc: Steal Supplies.
// This replaces map-first traversal with a small heist loop driven by objective state.
(() => {
  const params = new URLSearchParams(window.location.search);
  const visibleMapMode = params.get("mapExplore") === "1" || params.get("mapCalibrate") === "1";
  if (visibleMapMode) {
    document.documentElement.classList.add("village-flow-ready");
    return;
  }

  const READY_FLAG = "HIDDEN_MAP_CARD_FLOW";
  if (window[READY_FLAG]) {
    document.documentElement.classList.add("village-flow-ready");
    return;
  }

  const START_CARD_ID = "village_outskirts";
  const SUPPLY_GOAL = 3;
  const ALARM_MAX = 4;

  const FLOW_META = {
    village_outskirts: { role: "entry", district: "outskirts", place: "Forest Edge", beat: "Village Edge", nodeId: "forest_edge_01" },
    old_road_entry: { role: "approach", district: "road", place: "Old Road", beat: "Choose Approach", nodeId: "old_road_01" },
    cottage_row_entry: { role: "approach", district: "cottage", place: "Cottage Row", beat: "Choose Target", nodeId: "cottage_row_01" },
    village_house_window: { role: "target", district: "cottage", place: "Sleeping Cottage", beat: "Window", nodeId: "sleeping_cottage_01" },
    inside_sleeping_house: { role: "target", district: "cottage", place: "Inside Cottage", beat: "Room", nodeId: "sleeping_cottage_01" },
    hidden_pantry: { role: "payoff", district: "cottage", place: "Hidden Pantry", beat: "Supplies", nodeId: "sleeping_cottage_01" },
    angry_villager: { role: "trouble", district: "cottage", place: "Cottage Row", beat: "Alarm", nodeId: "cottage_row_01" },
    floorboard_creak: { role: "trouble", district: "cottage", place: "Inside Cottage", beat: "Noise", nodeId: "sleeping_cottage_01" },
    scout_sniffs_path: { role: "trouble", district: "road", place: "Old Road", beat: "Scout", nodeId: "old_road_01" },
    watch_patrol: { role: "trouble", district: "road", place: "Watch Patrol", beat: "Pressure", nodeId: "guard_post_01" },
    laundry_line_escape: { role: "recovery", district: "cottage", place: "Laundry Yard", beat: "Recovery", nodeId: "cottage_yard_01" },
    hedge_gap_escape: { role: "recovery", district: "road", place: "Hedge Gap", beat: "Recovery", nodeId: "hedge_gap_01" },
    quiet_alley: { role: "exit-choice", district: "backlane", place: "Quiet Alley", beat: "Push or Leave", nodeId: "back_lane_01" },
    market_back_exit: { role: "final-exit", district: "market", place: "Market Back", beat: "Escape", nodeId: "market_back_01", endsEncounter: true },
    safe_escape: { role: "final-exit", district: "outskirts", place: "Safe Escape", beat: "Clean Win", nodeId: "forest_edge_01", endsEncounter: true },
    forced_escape: { role: "final-exit", district: "outskirts", place: "Forced Escape", beat: "Alarm Break", nodeId: "forest_edge_01", endsEncounter: true },
  };

  const ROLE_LABELS = {
    entry: "Entry",
    approach: "Approach",
    target: "Target",
    payoff: "Payoff",
    trouble: "Trouble",
    recovery: "Recovery",
    "exit-choice": "Exit Choice",
    "final-exit": "Escape",
  };

  function map() { return window.VILLAGE_NODE_MAP; }
  function nodes() { return map()?.nodes || {}; }
  function nodeDef(id) { return nodes()[id] || null; }
  function meta(cardId) { return FLOW_META[cardId] || {}; }
  function nodeForCard(cardId) {
    const id = meta(cardId).nodeId;
    return id && nodeDef(id) ? id : (game?.hero?.currentNodeId || map()?.startNodeId || "forest_edge_01");
  }

  function arcResult(text, rewards = [], nextCardId = null, arc = {}) {
    const out = result(text, rewards, nextCardId);
    out.arc = { ...arc, next: arc.next || nextCardId || out.nextCardId };
    return out;
  }

  function ensureArcState(startFresh = false) {
    const oldRun = game.villageRun?.run || 0;
    if (!game.villageRun || startFresh) {
      game.villageRun = {
        objective: "steal_supplies",
        run: startFresh ? oldRun + 1 : oldRun,
        supplies: 0,
        supplyGoal: SUPPLY_GOAL,
        alarm: 0,
        alarmMax: ALARM_MAX,
        phase: "entry",
        district: "outskirts",
        hidden: true,
        routeKnowledge: 0,
        flags: {
          cottagesAlerted: false,
          marketAlerted: false,
          dogsReleased: false,
          sewerKnown: false,
          hedgeGapFound: false,
          exitAvailable: false,
        },
        trail: ["Forest Edge"],
        completed: false,
      };
    }
    game.villageCardFlow ||= { routeId: "steal_supplies", trail: ["Forest Edge"], role: "Entry", beat: "Village Edge" };
    return game.villageRun;
  }

  function clampRun(run) {
    run.supplies = Math.max(0, Math.min(9, run.supplies || 0));
    run.alarm = Math.max(0, Math.min(ALARM_MAX, run.alarm || 0));
    run.supplyGoal = SUPPLY_GOAL;
    run.alarmMax = ALARM_MAX;
    run.flags ||= {};
    return run;
  }

  function applyArcDelta(delta = {}, cardId = game.currentCardId) {
    const run = clampRun(ensureArcState(false));
    const m = meta(cardId);

    if (typeof delta.supplies === "number") run.supplies += delta.supplies;
    if (typeof delta.alarm === "number") run.alarm += delta.alarm;
    if (typeof delta.hidden === "boolean") {
      run.hidden = delta.hidden;
      game.hero.status = delta.hidden ? "Hidden" : "Revealed";
    }
    if (typeof delta.routeKnowledge === "number") run.routeKnowledge += delta.routeKnowledge;
    if (delta.phase) run.phase = delta.phase;
    else if (m.role) run.phase = m.role;
    if (delta.district) run.district = delta.district;
    else if (m.district) run.district = m.district;
    if (delta.flags) Object.assign(run.flags, delta.flags);

    clampRun(run);
    run.flags.exitAvailable = run.supplies >= run.supplyGoal;

    syncPartyHeroSummary?.();
    return run;
  }

  function addArcCards() {
    cards.village_outskirts = {
      id: "village_outskirts",
      title: "Village Outskirts",
      badge: "Steal Supplies · Entry",
      art: ART.scout,
      text: "Whispermoor sleeps beyond the hedge. Your warband needs supplies before dawn. The village offers food, coin, and trouble.",
      choices: {
        left: choice("Take the ditch line", "stealth", 2, 2, {
          failure: arcResult("A loose stone clicks down the ditch. Something ahead stops breathing.", [noise(), status("Revealed")], "scout_sniffs_path", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("You crawl low through nettles and reach the old road unseen.", [status("Hidden"), xp("Clean Entry")], "old_road_entry", { hidden: true, phase: "approach" }),
          great: arcResult("You find a hedge gap that skips the open road entirely.", [status("Hidden"), time(1), xp("Hedge Gap")], "cottage_row_entry", { hidden: true, routeKnowledge: 1, flags: { hedgeGapFound: true }, phase: "approach", district: "cottage" }),
        }, ["stealth", "entry", "route"]),
        right: choice("Watch patrol lamps", "spirit", 2, 2, {
          failure: arcResult("You misread the lamps. A watchman turns, and lanterns begin to move.", [noise(), status("Revealed")], "watch_patrol", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("The lamp pattern reveals a safe moment to cross.", [xp("Patrol Rhythm")], "old_road_entry", { routeKnowledge: 1, phase: "approach" }),
          great: arcResult("You catch the village rhythm perfectly and slip toward the cottages.", [time(2), status("Hidden")], "cottage_row_entry", { hidden: true, routeKnowledge: 1, phase: "approach", district: "cottage" }),
        }, ["patrol", "entry", "route"]),
      },
    };

    cards.old_road_entry = {
      id: "old_road_entry",
      title: "Old Road into the Village",
      badge: "Approach",
      art: ART.scout,
      text: "Cart ruts lead toward warm cottages. Smoke marks food stores. Every open stretch risks a witness.",
      choices: {
        left: choice("Slip toward the cottages", "stealth", 3, 3, {
          failure: arcResult("A sleeping bird bursts from the hedge. A Scout lifts its nose from the mud.", [noise()], "scout_sniffs_path", { alarm: 1, phase: "trouble" }),
          success: arcResult("You move from hedge to hedge until the cottages crowd around you.", [status("Hidden"), xp("Hedge Walker")], "cottage_row_entry", { hidden: true, phase: "approach", district: "cottage" }),
          great: arcResult("A hidden side lane carries you straight to a warm, low window.", [status("Hidden"), time(2), xp("Side Lane")], "village_house_window", { hidden: true, routeKnowledge: 1, phase: "target", district: "cottage" }),
        }, ["stealth", "road", "route"]),
        right: choice("Follow the smoke", "survival", 3, 3, {
          failure: arcResult("The freshest tracks lead straight into a lantern sweep.", [noise()], "watch_patrol", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("The tracks show which cottage still has food inside.", [xp("Village Tracks")], "village_house_window", { phase: "target", district: "cottage" }),
          great: arcResult("You find a pantry window with no dog prints beneath it.", [time(1), xp("Soft Target")], "hidden_pantry", { routeKnowledge: 1, phase: "payoff", district: "cottage" }),
        }, ["survival", "road", "food"]),
      },
    };

    cards.cottage_row_entry = {
      id: "cottage_row_entry",
      title: "Cottage Row",
      badge: "Approach · Cottage District",
      art: ART.scout,
      text: "Low cottages lean over the lane. One warm window glows. One crooked door hangs loose. Somewhere a kettle ticks itself cold.",
      choices: {
        left: choice("Try the warm window", "stealth", 3, 3, {
          failure: arcResult("A curtain twitches before you even touch the sill.", [noise()], "angry_villager", { alarm: 1, hidden: false, flags: { cottagesAlerted: true }, phase: "trouble" }),
          success: arcResult("The window sits low enough for a small thief.", [xp("Chosen Window")], "village_house_window", { phase: "target", district: "cottage" }),
          great: arcResult("You spot the sleeping pattern inside before touching the latch.", [status("Hidden"), time(1)], "village_house_window", { hidden: true, routeKnowledge: 1, phase: "target", district: "cottage" }),
        }, ["stealth", "house", "entry"]),
        right: choice("Test the crooked door", "cunning", 3, 3, {
          failure: arcResult("The hinge squeals into the lane like a dying crow.", [noise()], "scout_sniffs_path", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("The door gives just enough to squeeze through.", [xp("Weak Door")], "inside_sleeping_house", { phase: "target", district: "cottage" }),
          great: arcResult("You find the cottage key tucked beneath a loose stone.", [item("House Key"), time(1)], "inside_sleeping_house", { routeKnowledge: 1, phase: "target", district: "cottage" }),
        }, ["cunning", "house", "lock"]),
      },
    };

    cards.village_house_window = {
      id: "village_house_window",
      title: "Warm House Window",
      badge: "Target · Cottage",
      art: ART.scout,
      text: "A family sleeps above a low window. Lamplight shows a pantry, a purse, and floorboards that might betray you.",
      choices: {
        left: choice("Sneak inside", "stealth", 3, 4, {
          failure: arcResult("A latch snaps. Someone bolts upright and screams.", [noise(), status("Revealed"), damage(1)], "angry_villager", { alarm: 1, hidden: false, flags: { cottagesAlerted: true }, phase: "trouble" }),
          success: arcResult("You slide through the window and land beside the cold hearth.", [xp("Inside")], "inside_sleeping_house", { phase: "target", district: "cottage" }),
          great: arcResult("You enter without a whisper and spot the best hiding places.", [stat("stealth", 1), status("Hidden")], "hidden_pantry", { hidden: true, routeKnowledge: 1, phase: "payoff", district: "cottage" }),
        }, ["stealth", "house", "entry"]),
        right: choice("Move along", "survival", 2, 2, {
          failure: arcResult("You step through broken pottery in the alley.", [noise()], "scout_sniffs_path", { alarm: 1, phase: "trouble" }),
          success: arcResult("You leave the house alone and keep your route clean.", [time(1)], "quiet_alley", { phase: "exit-choice", district: "backlane" }),
          great: arcResult("You find a faster alley behind the house.", [time(2), xp("Shortcut")], "quiet_alley", { routeKnowledge: 1, phase: "exit-choice", district: "backlane" }),
        }, ["route", "escape"]),
      },
    };

    cards.inside_sleeping_house = {
      id: "inside_sleeping_house",
      title: "Inside the Sleeping House",
      badge: "Target · Interior",
      art: ART.scout,
      text: "The house smells of bread, wet wool, and coin. A cupboard creaks. A child coughs upstairs.",
      choices: {
        left: choice("Rob the purse", "cunning", 3, 5, {
          failure: arcResult("Coins scatter across the floorboards like hail.", [noise(), gold(1)], "floorboard_creak", { supplies: 1, alarm: 1, phase: "trouble" }),
          success: arcResult("You lift the purse and leave the clasp hanging.", [gold(3), xp("Theft")], "quiet_alley", { supplies: 1, phase: "exit-choice" }),
          great: arcResult("You take the purse, a spare key, and your own shadow with you.", [gold(5), item("House Key"), stat("cunning", 1)], "hidden_pantry", { supplies: 2, routeKnowledge: 1, phase: "payoff" }),
        }, ["theft", "house"]),
        right: choice("Raid the cupboard", "survival", 2, 3, {
          failure: arcResult("A jar breaks. You grab what you can as footsteps stir.", [food(1), noise()], "floorboard_creak", { supplies: 1, alarm: 1, phase: "trouble" }),
          success: arcResult("You pack bread and dried apples without waking anyone.", [food(2), heal(1)], "quiet_alley", { supplies: 2, phase: "exit-choice" }),
          great: arcResult("You find smoked meat, herbs, and a quiet back door.", [food(3), item("Healing Herbs"), time(1)], "hidden_pantry", { supplies: 2, routeKnowledge: 1, phase: "payoff" }),
        }, ["food", "house", "survival"]),
      },
    };

    cards.hidden_pantry = {
      id: "hidden_pantry",
      title: "Hidden Pantry",
      badge: "Payoff · Supplies",
      art: ART.scout,
      text: "Behind a hanging blanket, shelves of smoked meat, dried apples, and a small strongbox wait in the dark.",
      choices: {
        left: choice("Pack food fast", "survival", 2, 2, {
          failure: arcResult("You knock down a tin cup but leave with a sack of food.", [food(1), noise()], "quiet_alley", { supplies: 1, alarm: 1, phase: "exit-choice" }),
          success: arcResult("You fill a sack with enough food to matter.", [food(2), xp("Supplies")], "quiet_alley", { supplies: 2, phase: "exit-choice" }),
          great: arcResult("You find the winter shelf and pack the best cuts.", [food(3), heal(1), time(1)], "quiet_alley", { supplies: 3, hidden: true, phase: "exit-choice" }),
        }, ["food", "supply", "house"]),
        right: choice("Crack the strongbox", "cunning", 4, 3, {
          failure: arcResult("The lock snaps loud, but a few coins spill free.", [gold(1), noise()], "floorboard_creak", { supplies: 1, alarm: 1, phase: "trouble" }),
          success: arcResult("You pocket coins and a bundle of ration tokens.", [gold(3), xp("Strongbox")], "quiet_alley", { supplies: 2, phase: "exit-choice" }),
          great: arcResult("The strongbox opens silently: coins, tokens, and a hidden route mark.", [gold(5), item("Ration Tokens"), time(1)], "quiet_alley", { supplies: 3, routeKnowledge: 1, phase: "exit-choice" }),
        }, ["theft", "lock", "supply"]),
      },
    };

    cards.floorboard_creak = {
      id: "floorboard_creak",
      title: "Floorboard Creak",
      badge: "Trouble · Cottage",
      art: ART.scout,
      text: "A board groans under your heel. Upstairs, breath catches. The whole house seems to listen.",
      choices: {
        left: choice("Freeze in the dark", "stealth", 4, 2, {
          failure: arcResult("A sleepy voice calls out. Then another. Then a scream.", [noise(), status("Revealed")], "angry_villager", { alarm: 1, hidden: false, flags: { cottagesAlerted: true }, phase: "trouble" }),
          success: arcResult("The house settles again. You edge toward the back door.", [status("Hidden")], "laundry_line_escape", { hidden: true, phase: "recovery" }),
          great: arcResult("You become part of the dark until the danger passes.", [status("Hidden"), time(1)], "quiet_alley", { hidden: true, phase: "exit-choice" }),
        }, ["stealth", "house", "hide"]),
        right: choice("Bolt for the washline", "survival", 3, 2, {
          failure: arcResult("You crash through the wrong door into a villager's arms.", [noise(), damage(1)], "angry_villager", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("You burst out under damp sheets and hanging linens.", [time(1)], "laundry_line_escape", { phase: "recovery" }),
          great: arcResult("You slip outside with a bundle still under one arm.", [food(1), time(1)], "laundry_line_escape", { supplies: 1, phase: "recovery" }),
        }, ["escape", "house"]),
      },
    };

    cards.angry_villager = {
      id: "angry_villager",
      title: "Angry Villager",
      badge: "Trouble · Witness",
      art: ART.scout,
      text: "A villager stumbles into the lane with a poker and a nightcap. The shout building in their throat could wake half the row.",
      choices: {
        left: choice("Dive beneath the wash", "stealth", 3, 2, {
          failure: arcResult("The sheets tangle around your horns. The villager sees everything.", [noise(), status("Revealed")], "watch_patrol", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("You vanish under the laundry before the shout becomes a name.", [status("Hidden")], "laundry_line_escape", { hidden: true, phase: "recovery" }),
          great: arcResult("You vanish, and the villager blames the neighbor's cat.", [status("Hidden"), time(1)], "quiet_alley", { hidden: true, phase: "exit-choice" }),
        }, ["stealth", "escape", "house"]),
        right: choice("Snarl and scatter them", "combat", 3, 3, {
          failure: arcResult("They swing the poker and shout for the watch.", [damage(1), noise()], "watch_patrol", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("They stumble back long enough for you to run.", [xp("Scared Witness")], "laundry_line_escape", { alarm: 1, phase: "recovery" }),
          great: arcResult("They flee, dropping a small bundle from the doorway.", [food(1), xp("Scared Witness")], "quiet_alley", { supplies: 1, phase: "exit-choice" }),
        }, ["combat", "witness"]),
      },
    };

    cards.scout_sniffs_path = {
      id: "scout_sniffs_path",
      title: "Scout Sniffs Path",
      badge: "Trouble · Road",
      art: ART.scout,
      text: "A village scout pauses in the road, nose low, lantern high. It has your trail, but not your shape.",
      choices: {
        left: choice("Crawl through the hedge", "stealth", 3, 2, {
          failure: arcResult("Branches snap and the lantern swings toward you.", [noise()], "watch_patrol", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("You squeeze through thorns and lose the scent.", [status("Hidden")], "hedge_gap_escape", { hidden: true, phase: "recovery" }),
          great: arcResult("You find a perfect gap into the cottage side of the village.", [status("Hidden"), time(1)], "cottage_row_entry", { hidden: true, routeKnowledge: 1, flags: { hedgeGapFound: true }, phase: "approach", district: "cottage" }),
        }, ["stealth", "road", "escape"]),
        right: choice("Throw a stone downroad", "cunning", 3, 2, {
          failure: arcResult("The stone hits a bucket. Now everyone hears something.", [noise()], "watch_patrol", { alarm: 1, phase: "trouble" }),
          success: arcResult("The scout follows the false sound away from you.", [xp("False Trail")], "hedge_gap_escape", { phase: "recovery" }),
          great: arcResult("The scout leaves the road entirely. You gain a clean approach.", [time(2), status("Hidden")], "old_road_entry", { hidden: true, phase: "approach", district: "road" }),
        }, ["cunning", "road", "decoy"]),
      },
    };

    cards.watch_patrol = {
      id: "watch_patrol",
      title: "Watch Patrol",
      badge: "Trouble · Alarm",
      art: ART.scout,
      text: "Lanterns move in pairs now. The road glows in strips of danger, and the village is beginning to understand it is being hunted.",
      choices: {
        left: choice("Break for the hedge", "survival", 4, 3, {
          failure: arcResult("A guard cuts you off and the whole lane erupts.", [damage(1), noise()], "forced_escape", { alarm: 2, hidden: false, phase: "final-exit" }),
          success: arcResult("You hit the hedge hard and punch through to the far side.", [status("Hidden")], "hedge_gap_escape", { hidden: true, phase: "recovery" }),
          great: arcResult("You slip through a gap before the lanterns cross.", [status("Hidden"), time(1)], "old_road_entry", { hidden: true, routeKnowledge: 1, phase: "approach" }),
        }, ["survival", "escape", "patrol"]),
        right: choice("Hide under the cart", "stealth", 4, 3, {
          failure: arcResult("A boot stops beside your face. There is no more time.", [damage(1), noise()], "forced_escape", { alarm: 2, hidden: false, phase: "final-exit" }),
          success: arcResult("The patrol passes close enough to smell wet wool.", [status("Hidden")], "hedge_gap_escape", { hidden: true, phase: "recovery" }),
          great: arcResult("You hear their route and learn where not to step.", [status("Hidden"), xp("Patrol Route"), time(1)], "quiet_alley", { hidden: true, routeKnowledge: 1, phase: "exit-choice" }),
        }, ["stealth", "hide", "patrol"]),
      },
    };

    cards.laundry_line_escape = {
      id: "laundry_line_escape",
      title: "Laundry Line Escape",
      badge: "Recovery · House Branch",
      art: ART.scout,
      text: "Wet sheets slap in the night wind. The washline can hide you, trip you, or carry one last stolen bundle with you.",
      choices: {
        left: choice("Dive beneath the sheets", "stealth", 3, 2, {
          failure: arcResult("You stumble out into lantern light.", [noise()], "watch_patrol", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("You crawl under linen and emerge in the quiet alley.", [status("Hidden")], "quiet_alley", { hidden: true, phase: "exit-choice" }),
          great: arcResult("You escape with a wrapped loaf someone left cooling on the line.", [status("Hidden"), food(1), time(1)], "quiet_alley", { hidden: true, supplies: 1, phase: "exit-choice" }),
        }, ["stealth", "recovery", "house"]),
        right: choice("Snatch while fleeing", "cunning", 3, 2, {
          failure: arcResult("You grab a sheet, not a sack. The watch sees the ghostly shape running.", [noise()], "watch_patrol", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("You steal a wrapped heel of bread and vanish sideways.", [food(1)], "quiet_alley", { supplies: 1, phase: "exit-choice" }),
          great: arcResult("You find a hidden supper basket and a clean route out.", [food(2), status("Hidden")], "quiet_alley", { supplies: 2, hidden: true, phase: "exit-choice" }),
        }, ["theft", "recovery", "food"]),
      },
    };

    cards.hedge_gap_escape = {
      id: "hedge_gap_escape",
      title: "Hedge Gap Escape",
      badge: "Recovery · Road Branch",
      art: ART.scout,
      text: "The hedge tears at your cloak, but the gap is real. Beyond it, the village reshapes itself into safer angles.",
      choices: {
        left: choice("Return to the old road", "survival", 2, 2, {
          failure: arcResult("You crawl out too soon, under a lantern beam.", [noise()], "watch_patrol", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("You return to the old road with your trail broken.", [status("Hidden")], "old_road_entry", { hidden: true, phase: "approach", district: "road" }),
          great: arcResult("You learn a hidden bend that shortens future approaches.", [status("Hidden"), time(1)], "cottage_row_entry", { hidden: true, routeKnowledge: 1, flags: { hedgeGapFound: true }, phase: "approach", district: "cottage" }),
        }, ["survival", "recovery", "route"]),
        right: choice("Push toward cottages", "stealth", 3, 2, {
          failure: arcResult("A dog catches the scent along the hedge.", [noise()], "watch_patrol", { alarm: 1, flags: { dogsReleased: true }, phase: "trouble" }),
          success: arcResult("You emerge behind the cottage row.", [status("Hidden")], "cottage_row_entry", { hidden: true, phase: "approach", district: "cottage" }),
          great: arcResult("You emerge beside a warm window with no witnesses in sight.", [status("Hidden"), time(1)], "village_house_window", { hidden: true, phase: "target", district: "cottage" }),
        }, ["stealth", "recovery", "cottage"]),
      },
    };

    cards.quiet_alley = {
      id: "quiet_alley",
      title: "Quiet Alley",
      badge: "Exit Choice",
      art: ART.scout,
      text: "The alley gives you a breath of darkness. You can leave with what you have, or risk one more prize before the village wakes.",
      choices: {
        left: choice("Slip away now", "stealth", 2, 2, {
          failure: arcResult("A last bottle rolls underfoot. Lanterns swing toward the alley mouth.", [noise()], "watch_patrol", { alarm: 1, phase: "trouble" }),
          success: arcResult("You slip toward the market back with your stolen load intact.", [status("Hidden"), xp("Exit Found")], "market_back_exit", { hidden: true, phase: "final-exit" }),
          great: arcResult("You leave no trail at all. The village keeps sleeping behind you.", [status("Hidden"), time(2), xp("Clean Escape")], "safe_escape", { hidden: true, routeKnowledge: 1, phase: "final-exit" }),
        }, ["exit", "stealth", "route"]),
        right: choice("Risk one more score", "cunning", 4, 3, {
          failure: arcResult("Greed makes noise. The alley is no longer quiet.", [noise()], "scout_sniffs_path", { alarm: 1, hidden: false, phase: "trouble" }),
          success: arcResult("You spot a pantry door left open just a crack.", [xp("One More")], "hidden_pantry", { phase: "payoff", district: "cottage" }),
          great: arcResult("You find a hidden pantry route without spending another second.", [time(1), status("Hidden")], "hidden_pantry", { hidden: true, routeKnowledge: 1, phase: "payoff", district: "cottage" }),
        }, ["push", "greed", "supply"]),
      },
    };

    cards.market_back_exit = {
      id: "market_back_exit",
      title: "Market Back Exit",
      badge: "Final Exit",
      art: ART.scout,
      text: "Behind the market, barrels and hanging tarps make a crooked path out of sight. This is enough to leave with supplies, if you can keep your nerve.",
      choices: {
        left: choice("Fade into the alleys", "stealth", 2, 2, {
          failure: arcResult("A bottle rolls under your foot as you leave. You escape, but the village wakes behind you.", [noise()], "village_outskirts", { alarm: 1, phase: "entry", completed: true }),
          success: arcResult("You melt into the alleys with the supplies intact.", [status("Hidden"), xp("Supplies Secured")], "village_outskirts", { hidden: true, phase: "entry", completed: true }),
          great: arcResult("You leave no trail and mark a perfect return line.", [status("Hidden"), time(2), xp("Perfect Exit")], "village_outskirts", { hidden: true, routeKnowledge: 1, phase: "entry", completed: true }),
        }, ["stealth", "exit", "route"]),
        right: choice("Mark the return path", "cunning", 2, 2, {
          failure: arcResult("Your mark is obvious. You escape, but someone will find it.", [noise()], "village_outskirts", { alarm: 1, phase: "entry", completed: true }),
          success: arcResult("You scratch a subtle sign into the barrel hoop and leave with the haul.", [xp("Marked Route")], "village_outskirts", { routeKnowledge: 1, phase: "entry", completed: true }),
          great: arcResult("You leave a hidden mark only the party will read.", [xp("Marked Route"), time(1), status("Hidden")], "village_outskirts", { hidden: true, routeKnowledge: 2, phase: "entry", completed: true }),
        }, ["cunning", "exit", "mark"]),
      },
    };

    cards.safe_escape = {
      id: "safe_escape",
      title: "Safe Escape",
      badge: "Clean Win",
      art: ART.scout,
      text: "You pass the last hedge before the village understands what was taken. Behind you, Whispermoor sleeps on.",
      choices: {
        left: choice("Return to camp", "survival", 1, 1, {
          failure: arcResult("You limp back with the supplies. Good enough for goblin work.", [xp("Supplies Secured")], "village_outskirts", { completed: true, phase: "entry" }),
          success: arcResult("You return with supplies and a clean route for next time.", [xp("Clean Run"), time(1)], "village_outskirts", { completed: true, routeKnowledge: 1, phase: "entry" }),
          great: arcResult("You return as a shadow with a sack full of proof.", [xp("Perfect Run"), time(2), status("Hidden")], "village_outskirts", { completed: true, routeKnowledge: 2, hidden: true, phase: "entry" }),
        }, ["exit", "win"]),
        right: choice("Count the haul", "cunning", 1, 1, {
          failure: arcResult("Three supplies. No more, no less. Enough.", [xp("Supplies Secured")], "village_outskirts", { completed: true, phase: "entry" }),
          success: arcResult("The haul is better than it looked in the dark.", [gold(1), xp("Good Haul")], "village_outskirts", { completed: true, supplies: 1, phase: "entry" }),
          great: arcResult("You find a ration token hidden in the bundle.", [gold(2), item("Ration Token")], "village_outskirts", { completed: true, supplies: 1, phase: "entry" }),
        }, ["loot", "win"]),
      },
    };

    cards.forced_escape = {
      id: "forced_escape",
      title: "Forced Escape",
      badge: "Alarm Break",
      art: ART.scout,
      text: "The village is awake now. Dogs bark, shutters open, and the raid collapses into a scramble for the treeline.",
      choices: {
        left: choice("Run for the hedge", "survival", 4, 2, {
          failure: arcResult("You escape with scratches, bruises, and whatever you did not drop.", [damage(1)], "village_outskirts", { completed: true, phase: "entry" }),
          success: arcResult("You burst through the hedge with the haul clutched tight.", [xp("Messy Escape")], "village_outskirts", { completed: true, phase: "entry" }),
          great: arcResult("You leave the dogs biting at empty moonlight.", [status("Hidden"), time(1)], "village_outskirts", { completed: true, hidden: true, phase: "entry" }),
        }, ["escape", "alarm"]),
        right: choice("Drop decoys behind you", "cunning", 4, 2, {
          failure: arcResult("The decoys scatter badly. The Dark Lord will hear about this noise.", [noise(), damage(1)], "village_outskirts", { completed: true, phase: "entry" }),
          success: arcResult("The patrol chases rags and bones while you vanish.", [xp("Decoy Escape")], "village_outskirts", { completed: true, phase: "entry" }),
          great: arcResult("The decoys send the patrol the wrong way entirely.", [status("Hidden"), time(1), xp("False Trail")], "village_outskirts", { completed: true, hidden: true, routeKnowledge: 1, phase: "entry" }),
        }, ["cunning", "escape", "decoy"]),
      },
    };

    const arcDeck = [
      "village_outskirts", "old_road_entry", "cottage_row_entry", "village_house_window",
      "inside_sleeping_house", "hidden_pantry", "floorboard_creak", "angry_villager",
      "scout_sniffs_path", "watch_patrol", "laundry_line_escape", "hedge_gap_escape",
      "quiet_alley", "market_back_exit", "safe_escape", "forced_escape",
    ];
    game.regions.village.deck = [...arcDeck];
    game.regions.village.deckIndex = 0;
  }

  function nextFromState(cardId, intendedNext) {
    const run = clampRun(ensureArcState(false));
    const nextMeta = meta(intendedNext);
    const currentMeta = meta(cardId);

    if (run.alarm >= run.alarmMax && cardId !== "forced_escape") return "forced_escape";
    if (currentMeta.endsEncounter) return START_CARD_ID;

    const nextIsTroubleOrRecovery = ["trouble", "recovery", "final-exit"].includes(nextMeta.role);
    if (run.supplies >= run.supplyGoal && !nextIsTroubleOrRecovery) {
      if (run.hidden && run.alarm <= 2) return "safe_escape";
      return "market_back_exit";
    }

    return intendedNext || START_CARD_ID;
  }

  function rememberFlowCard(cardId) {
    const run = ensureArcState(false);
    const m = meta(cardId);
    const place = m.place || "Village";
    if (m.role === "entry" && cardId === START_CARD_ID) run.trail = ["Forest Edge"];
    if (run.trail[run.trail.length - 1] !== place) run.trail.push(place);
    run.trail = run.trail.slice(-4);
    run.phase = m.role || run.phase;
    run.district = m.district || run.district;
    run.completed = Boolean(m.endsEncounter && cardId !== START_CARD_ID);

    game.villageCardFlow = {
      routeId: "steal_supplies",
      trail: [...run.trail],
      role: ROLE_LABELS[m.role] || "Village",
      beat: m.beat || cards[cardId]?.title || "Event",
    };
  }

  function renderFlowBreadcrumb() {
    const run = clampRun(ensureArcState(false));
    const flow = game.villageCardFlow || {};
    const trail = (flow.trail || run.trail || ["Village"]).slice(-3);
    const crumbs = trail.map(label => `<span>${label}</span>`).join(`<i>›</i>`);
    const hiddenText = run.hidden ? "Hidden" : "Exposed";
    return `<section class="gd-route-breadcrumb"><div class="gd-route-crumbs">${crumbs}</div><div class="gd-route-role"><b>${run.supplies}/${run.supplyGoal} Supplies · Alarm ${run.alarm}/${run.alarmMax}</b><small>${hiddenText} · ${flow.role || "Entry"}</small></div></section>`;
  }

  function startArc(force = false) {
    addArcCards();
    ensureArcState(force);
    if (force || !game.villageRun.started) {
      game.currentCardId = START_CARD_ID;
      game.pendingNextCardId = null;
      game.awaitingResultAck = false;
      game.resultReady = false;
      game.lastAction = null;
      game.hero.currentNodeId = nodeForCard(START_CARD_ID);
      game.hero.status = "Hidden";
      game.villageRun.hidden = true;
      game.villageRun.started = true;
      rememberFlowCard(START_CARD_ID);
    }
  }

  function enhanceResultText() {
    const run = clampRun(ensureArcState(false));
    if (!game.lastAction) return;
    const stateLine = `Supplies ${run.supplies}/${run.supplyGoal} · Alarm ${run.alarm}/${run.alarmMax} · ${run.hidden ? "Hidden" : "Exposed"}`;
    game.lastAction.text = `${game.lastAction.text}<br><small>${stateLine}</small>`;
    game.result = `${game.result}<br><small>${stateLine}</small>`;
  }

  function installRenderExploreWrapper() {
    const baseRenderExplore = window.renderExplore || renderExplore;
    if (!baseRenderExplore || baseRenderExplore.__stealSuppliesWrapped) return false;
    const wrapped = function renderExploreWithStealSupplies(...args) {
      rememberFlowCard(game.currentCardId);
      const html = baseRenderExplore.apply(this, args);
      if (html.includes("gd-route-breadcrumb")) return html;
      return html.replace(`<section class="gd-region-header">`, `${renderFlowBreadcrumb()}<section class="gd-region-header">`);
    };
    wrapped.__stealSuppliesWrapped = true;
    window.renderExplore = wrapped;
    try { renderExplore = wrapped; } catch (_) {}
    return true;
  }

  function installChooseWrapper() {
    const baseChoose = window.choose || choose;
    if (!baseChoose || baseChoose.__stealSuppliesWrapped) return false;

    const wrapped = function chooseWithStealSupplies(side) {
      if (game.heroTimer <= 0 || game.awaitingResultAck) return;
      const cardId = game.currentCardId;
      const choiceData = cards[cardId]?.choices?.[side];
      if (!choiceData) return baseChoose(side);

      baseChoose(side);

      const outcomeType = game.lastAction?.outcomeType;
      const outcome = choiceData.outcomes?.[outcomeType];
      if (!outcome) return;

      const run = applyArcDelta(outcome.arc || {}, cardId);
      const intendedNext = outcome.arc?.next || outcome.nextCardId || START_CARD_ID;
      const nextCardId = nextFromState(cardId, intendedNext);

      game.pendingNextCardId = nextCardId;
      game.hiddenMapPendingMove = {
        fromNodeId: game.hero.currentNodeId,
        toNodeId: nodeForCard(nextCardId),
        cardId,
        nextCardId,
        flow: true,
      };
      enhanceResultText();
      game.log.unshift(`Steal Supplies: ${run.supplies}/${run.supplyGoal} supplies, alarm ${run.alarm}/${run.alarmMax}.`);
    };

    wrapped.__stealSuppliesWrapped = true;
    window.choose = wrapped;
    try { choose = wrapped; } catch (_) {}
    return true;
  }

  function installAckWrapper() {
    const baseAck = window.acknowledgeResult || acknowledgeResult;
    if (!baseAck || baseAck.__stealSuppliesWrapped) return false;

    const wrapped = function acknowledgeStealSuppliesResult(...args) {
      const move = game.hiddenMapPendingMove;
      if (move) {
        game.hero.currentNodeId = move.toNodeId;
        rememberFlowCard(move.nextCardId);
      }

      const previousCardId = move?.cardId || game.currentCardId;
      const result = baseAck.apply(this, args);

      if (move && !game.awaitingResultAck) {
        game.hiddenMapPendingMove = null;
        if (meta(previousCardId).endsEncounter && game.currentCardId === START_CARD_ID) {
          startArc(true);
        } else {
          rememberFlowCard(game.currentCardId);
        }
        syncPartyHeroSummary?.();
      }

      return result;
    };

    wrapped.__stealSuppliesWrapped = true;
    window.acknowledgeResult = wrapped;
    try { acknowledgeResult = wrapped; } catch (_) {}
    return true;
  }

  function installResetWrapper() {
    const baseReset = window.resetGame || resetGame;
    if (!baseReset || baseReset.__stealSuppliesWrapped) return true;
    const wrapped = function resetWithStealSupplies(...args) {
      const result = baseReset.apply(this, args);
      startArc(true);
      render?.();
      return result;
    };
    wrapped.__stealSuppliesWrapped = true;
    window.resetGame = wrapped;
    try { resetGame = wrapped; } catch (_) {}
    return true;
  }

  function install(attempt = 0) {
    if (typeof cards === "undefined" || typeof renderExplore !== "function" || typeof choice !== "function") {
      if (attempt < 30) setTimeout(() => install(attempt + 1), 40);
      else document.documentElement.classList.add("village-flow-ready");
      return;
    }

    ensureNodeState?.();
    startArc(!game.villageRun?.started);
    const renderReady = installRenderExploreWrapper();
    const chooseReady = installChooseWrapper();
    const ackReady = installAckWrapper();
    const resetReady = installResetWrapper();
    window[READY_FLAG] = renderReady && chooseReady && ackReady && resetReady;
    game.hiddenMapMode = true;
    game.activeEncounter = null;
    game.pendingNodeMove = null;
    game.eventTransition = null;
    render?.();
    document.documentElement.classList.add("village-flow-ready");
  }

  install();
})();
