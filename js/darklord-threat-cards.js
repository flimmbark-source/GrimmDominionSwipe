// Encounter cards created by Dark Lord commands/threats.
(() => {
  if (typeof cards === "undefined") return;

  const destroyThreat = (threatId, extraRewards = []) => ({ type: "destroyThreat", threatId, extraRewards });
  const loseFood = (amount = 1) => ({ type: "loseFood", amount });
  const reduceModifier = (amount = 1) => ({ type: "reduceModifier", amount });
  const extraTimeCost = (amount = 1) => ({ type: "extraTimeCost", amount });

  Object.assign(cards, {
    whispering_idol: {
      id: "whispering_idol",
      title: "Whispering Idol",
      badge: "Corruption Engine",
      art: ART.scout,
      text: "A little stone idol mutters names into the mud. While it remains, this region slowly corrupts.",
      choices: {
        left: choice("Smash the idol", "combat", 3, 4, {
          failure: result("The idol splits your knuckles and screams your name.", [damage(1), noise()]),
          success: result("You crush the idol beneath your heel.", [destroyThreat("whispering_idol")]),
          great: result("You crush it and learn how its seal was made.", [destroyThreat("whispering_idol"), xp("Broken Seal")]),
        }, ["combat", "spirit", "magic"]),
        right: choice("Silence the whispers", "spirit", 3, 4, {
          failure: result("The whispers crawl under your skin.", [status("Revealed"), damage(1)]),
          success: result("You smother the whispers with an old counter-word.", [destroyThreat("whispering_idol")]),
          great: result("You silence it cleanly and resist the curse.", [destroyThreat("whispering_idol"), xp("Resisted Curse")]),
        }, ["spirit", "magic", "lore"]),
      },
    },

    plague_well: {
      id: "plague_well",
      title: "Plague Well",
      badge: "Corruption Engine",
      art: ART.scout,
      text: "The well water turns black around your reflection. While it remains, the region rots from below.",
      choices: {
        left: choice("Burn herbs in the well", "survival", 3, 4, {
          failure: result("The smoke turns sour and spoils your provisions.", [loseFood(1), damage(1)]),
          success: result("The rot boils away in a green flash.", [destroyThreat("plague_well")]),
          great: result("You cleanse the well and learn where clean stores are hidden.", [destroyThreat("plague_well"), xp("Village Secrets"), food(1)]),
        }, ["food", "survival", "magic"]),
        right: choice("Bless the stones", "spirit", 4, 4, {
          failure: result("The blessing backfires through your claws.", [damage(1), noise()]),
          success: result("The well stones brighten, and the plague retreats.", [destroyThreat("plague_well"), heal(1)]),
          great: result("You cleanse the well and carry away blessed water.", [destroyThreat("plague_well"), heal(2), xp("Resisted Curse")]),
        }, ["spirit", "magic", "food"]),
      },
    },

    bloodroot: {
      id: "bloodroot",
      title: "Bloodroot",
      badge: "Corruption Engine",
      art: ART.scout,
      text: "Red roots crawl beneath the road and clutch at ankles. While it remains, escape routes sour.",
      choices: {
        left: choice("Cut the roots", "combat", 3, 4, {
          failure: result("The roots whip around your legs and drag you down.", [damage(1), extraTimeCost(1)]),
          success: result("You hack the roots apart.", [destroyThreat("bloodroot")]),
          great: result("You cut a clean path through the roots.", [destroyThreat("bloodroot"), xp("Escape Route"), time(1)]),
        }, ["combat", "route", "escape"]),
        right: choice("Find the clean path", "survival", 3, 4, {
          failure: result("You circle too long and the roots tighten behind you.", [extraTimeCost(2), noise()]),
          success: result("You find the root-heart and pull it free.", [destroyThreat("bloodroot")]),
          great: result("You map the clean path before the roots die.", [destroyThreat("bloodroot"), xp("Marked Route")]),
        }, ["survival", "route", "escape"]),
      },
    },

    grave_bell: {
      id: "grave_bell",
      title: "Grave Bell",
      badge: "Corruption Engine",
      art: ART.scout,
      text: "A hanging bell rings whenever someone lies. While it remains, this region keeps calling the searchers back.",
      choices: {
        left: choice("Steal the clapper", "stealth", 4, 4, {
          failure: result("The bell catches your shadow and rings hard.", [status("Revealed"), noise()]),
          success: result("You steal the clapper and mute the bell.", [destroyThreat("grave_bell")]),
          great: result("You mute the bell so cleanly no one notices it died.", [destroyThreat("grave_bell"), xp("Silent Kill")]),
        }, ["stealth", "patrol", "theft"]),
        right: choice("Jam the bell", "cunning", 3, 4, {
          failure: result("Your wedge slips and the bell shrieks.", [noise(), damage(1)]),
          success: result("You jam the bell with a shard of wood.", [destroyThreat("grave_bell")]),
          great: result("You turn the bell into a false alarm trap.", [destroyThreat("grave_bell"), xp("Trap Cut")]),
        }, ["cunning", "trap", "tool"]),
      },
    },

    hound_pack: {
      id: "hound_pack",
      title: "Hound Pack",
      badge: "Dark Lord Minions",
      art: ART.scout,
      text: "The dogs have your scent. They do not need to see you to find you.",
      choices: {
        left: choice("Hide in filthy water", "stealth", 4, 4, {
          failure: result("The hounds find you anyway.", [status("Revealed"), damage(1), noise()]),
          success: result("You sink into the water until they pass.", [status("Hidden"), loseFood(1)]),
          great: result("You lose the scent trail completely.", [status("Hidden"), xp("Patience")]),
        }, ["stealth", "hide", "scout"]),
        right: choice("Fight them off", "combat", 4, 5, {
          failure: result("The pack tears into you and howls for more.", [damage(2), noise()]),
          success: result("You drive them off, but not quietly.", [damage(1), xp("Scout Down")]),
          great: result("You silence the pack before it can bay.", [xp("Silent Kill")]),
        }, ["combat", "scout"]),
      },
    },

    sealed_exit: {
      id: "sealed_exit",
      title: "Sealed Exit",
      badge: "Dark Lord Trap",
      art: ART.scout,
      text: "A black mark burns on the old road. The easy path is gone.",
      choices: {
        left: choice("Break the seal", "spirit", 4, 5, {
          failure: result("The seal bites back with black sparks.", [damage(1), noise()]),
          success: result("The mark cracks enough for you to pass.", [time(1), xp("Broken Seal")]),
          great: result("You break the seal and learn its pattern.", [time(2), xp("Broken Seal"), stat("spirit", 1)]),
        }, ["spirit", "magic", "route"]),
        right: choice("Find another path", "survival", 4, 5, {
          failure: result("You waste precious time doubling back.", [extraTimeCost(2)]),
          success: result("You find a worse path, but it works.", [time(1)]),
          great: result("You find a hidden bypass around the seal.", [regionCard("village", "quiet_alley", "Quiet Alley"), xp("Marked Route")]),
        }, ["survival", "route", "escape"]),
      },
    },

    withered_supplies: {
      id: "withered_supplies",
      title: "Withered Supplies",
      badge: "Dark Lord Curse",
      art: ART.scout,
      text: "The bread in your bag blackens. Something whispered over it.",
      choices: {
        left: choice("Salvage the food", "survival", 3, 3, {
          failure: result("The rot spreads through your stores.", [loseFood(1), damage(1)]),
          success: result("You cut away the blackened parts.", [xp("Resisted Curse")]),
          great: result("You save the food and learn the curse’s taste.", [food(1), xp("Resisted Curse")]),
        }, ["food", "survival", "magic"]),
        right: choice("Burn the rot", "spirit", 3, 4, {
          failure: result("The smoke chokes you and marks the lane.", [damage(1), noise()]),
          success: result("The rot burns away.", [xp("Resisted Curse")]),
          great: result("The curse burns clean and leaves useful ash.", [xp("Resisted Curse"), item("Warding Charm")]),
        }, ["spirit", "magic", "food"]),
      },
    },

    rot_luck: {
      id: "rot_luck",
      title: "Rot Luck",
      badge: "Dark Lord Curse",
      art: ART.scout,
      text: "A cold little curse chews on your confidence and memories.",
      choices: {
        left: choice("Shake it off", "spirit", 4, 4, {
          failure: result("The curse eats at your best trick.", [reduceModifier(2), damage(1)]),
          success: result("You hold the curse at bay.", [reduceModifier(1)]),
          great: result("You turn the curse aside and learn its rhythm.", [xp("Resisted Curse")]),
        }, ["spirit", "magic"]),
        right: choice("Distract yourself", "cunning", 3, 3, {
          failure: result("You fumble through your tools and lose focus.", [reduceModifier(1), noise()]),
          success: result("You keep moving before it can settle.", [time(1)]),
          great: result("You bait the curse into eating a false memory.", [xp("Trap Cut"), time(1)]),
        }, ["cunning", "trap", "tool"]),
      },
    },
  });

  const baseApplyRewards = applyRewards;
  window.applyRewards = function applyRewards(rewards = []) {
    const expanded = [];
    rewards.forEach(reward => {
      if (reward.type === "destroyThreat") {
        removeThreatFromRegion?.(game.hero.regionId, reward.threatId);
        expanded.push(...(reward.extraRewards || []));
      } else if (reward.type === "loseFood") {
        game.hero.food = Math.max(0, (game.hero.food || 0) - reward.amount);
        expanded.push({ type: "food", amount: -reward.amount });
      } else if (reward.type === "reduceModifier") {
        const entries = Object.entries(game.hero.knowledgeTurns || {}).sort((a, b) => b[1] - a[1]);
        const target = entries[0]?.[0];
        if (target) game.hero.knowledgeTurns[target] = Math.max(0, game.hero.knowledgeTurns[target] - reward.amount);
        expanded.push({ type: "xp", label: target ? `${target} weakened` : "No modifier to rot" });
      } else if (reward.type === "extraTimeCost") {
        game.heroTimer = Math.max(0, game.heroTimer - reward.amount);
        expanded.push({ type: "time", amount: -reward.amount });
      } else {
        expanded.push(reward);
      }
    });
    return baseApplyRewards(expanded);
  };
  applyRewards = window.applyRewards;

  render?.();
})();
