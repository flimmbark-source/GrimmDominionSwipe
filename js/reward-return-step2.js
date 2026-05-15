// Step 2: generalize visible reward returns across the prototype.
// Loaded after grimm-prototype.js as a classic script so it can extend the
// existing prototype data without rewriting the full prototype module.
(() => {
  if (typeof cards === "undefined" || typeof ITEM_BONUSES === "undefined") return;

  Object.assign(ITEM_BONUSES, {
    "Rope Hook": { tags: ["climb", "roof", "escape", "well", "route"], statBonus: 2, label: "🪝 Rope Hook helps" },
    "Soot Cloak": { tags: ["stealth", "smoke", "crowd", "hide"], statBonus: 2, label: "◒ Soot Cloak helps" },
    "House Key": { tags: ["house", "cottage", "lock", "entry"], statBonus: 2, label: "🗝 House Key helps" },
    "Torch Kit": { tags: ["dark", "tunnel", "cellar", "well"], statBonus: 2, label: "🔥 Torch Kit helps" },
    "Scout Horn": { tags: ["scout", "intimidate", "lure"], statBonus: 2, label: "♬ Scout Horn helps" },
    "Warding Charm": { tags: ["spirit", "lore", "chapel", "magic"], statBonus: 2, label: "✦ Warding Charm helps" },
    "Lantern": { tags: ["dark", "tunnel", "well", "search"], statBonus: 1, label: "☼ Lantern helps" },
  });

  const addTags = (cardId, side, tags) => {
    const choice = cards[cardId]?.choices?.[side];
    if (!choice) return;
    choice.tags = [...new Set([...(choice.tags || []), ...tags])];
  };

  addTags("inside_sleeping_house", "left", ["lock", "quiet"]);
  addTags("inside_sleeping_house", "right", ["search"]);
  addTags("chapel_backroom", "right", ["magic"]);
  addTags("well_bucket", "right", ["search"]);
  addTags("old_rooftops", "left", ["route"]);
  addTags("old_rooftops", "right", ["hide"]);
  addTags("angry_villager", "right", ["lure"]);

  Object.assign(cards, {
    sealed_road: {
      id: "sealed_road",
      title: "Sealed Road",
      badge: "Dark Lord Trap",
      art: ART.scout,
      text: "Black chains crawl across the exit stones. The road wants you to turn back.",
      choices: {
        left: choice("Break the seal", "spirit", 4, 5, {
          failure: result("The seal bites back and rings through the Village.", [damage(1), noise()]),
          success: result("You crack the seal enough to pass.", [time(1), xp("Broken Seal")]),
          great: result("You break the seal cleanly and mark a safe gap.", [time(2), regionCard("village", "quiet_alley", "Quiet Alley")]),
        }, ["magic", "spirit", "route", "escape"]),
        right: choice("Find another way", "survival", 3, 4, {
          failure: result("You circle too long and leave tracks.", [noise()]),
          success: result("You find a muddy side path.", [time(1)]),
          great: result("You discover a safer side path for later.", [regionCard("village", "quiet_alley", "Quiet Alley"), time(1)]),
        }, ["route", "escape", "search"]),
      },
    },
    hidden_snare: {
      id: "hidden_snare",
      title: "Hidden Snare",
      badge: "Dark Lord Trap",
      art: ART.scout,
      text: "A thin black cord waits under wet leaves, almost invisible in the road dust.",
      choices: {
        left: choice("Step carefully", "stealth", 3, 3, {
          failure: result("The snare snaps tight and the line sings.", [damage(1), noise()]),
          success: result("You feel the line and step over it.", [xp("Trap Sense")]),
          great: result("You disarm the snare and keep the cord.", [item("Snare Cord"), stat("stealth", 1)]),
        }, ["stealth", "trap", "hide"]),
        right: choice("Cut it fast", "cunning", 4, 4, {
          failure: result("The cord lashes your wrist.", [damage(1)]),
          success: result("You cut the snare before it tightens.", [xp("Trap Cut")]),
          great: result("You turn the snare into a useful lure.", [item("Snare Cord"), regionCard("village", "quiet_alley", "Quiet Alley")]),
        }, ["trap", "tool", "lure"]),
      },
    },
    cursed_crossroads: {
      id: "cursed_crossroads",
      title: "Cursed Crossroads",
      badge: "Dark Lord Curse",
      art: ART.scout,
      text: "Every lane points toward the castle for one sickening breath.",
      choices: {
        left: choice("Resist the pull", "spirit", 4, 4, {
          failure: result("The curse drags at your bones.", [damage(1), noise()]),
          success: result("You shake off the pull and keep moving.", [xp("Resisted Curse")]),
          great: result("You bend the curse into a secret sign.", [stat("spirit", 1), regionCard("village", "secret_route", "Secret Route")]),
        }, ["spirit", "magic", "route"]),
        right: choice("Follow the wrong shadow", "cunning", 3, 3, {
          failure: result("The shadow leads you past a window full of eyes.", [status("Revealed"), noise()]),
          success: result("You trick the crossroads and slip away.", [time(1)]),
          great: result("You leave a false trail for the hunters.", [status("Hidden"), time(2)]),
        }, ["cunning", "stealth", "escape"]),
      },
    },
  });

  for (const id of ["sealed_road", "hidden_snare", "cursed_crossroads"]) {
    if (cards[id]) cards[id].source = "darkLord";
  }

  const sendScout = commandCards?.find(card => card.id === "send_scout");
  if (sendScout) {
    sendScout.effect = "Seed Scout into a region deck.";
    sendScout.seedCardId = "scout_sniffs_path";
  }

  const sealRoad = commandCards?.find(card => card.id === "seal_road");
  if (sealRoad) {
    sealRoad.effect = "Seed Sealed Road into a region deck.";
    sealRoad.seedCardId = "sealed_road";
  }

  const dispatchPriest = commandCards?.find(card => card.id === "dispatch_priest");
  if (dispatchPriest) {
    dispatchPriest.title = "Cast Crossroads Curse";
    dispatchPriest.effect = "Seed Cursed Crossroads into a region deck.";
    dispatchPriest.seedCardId = "cursed_crossroads";
  }

  const summonOgre = commandCards?.find(card => card.id === "summon_ogre");
  if (summonOgre) {
    summonOgre.title = "Set Hidden Snare";
    summonOgre.effect = "Seed Hidden Snare into a region deck.";
    summonOgre.seedCardId = "hidden_snare";
  }

  Object.values(cards).forEach(card => {
    if (!card?.badge && card.source === "darkLord") card.badge = "Dark Lord Card";
  });

  if (typeof render === "function") render();
})();
