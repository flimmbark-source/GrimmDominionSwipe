// Encounter cards created by Dark Lord commands/threats.
(() => {
  if (typeof cards === "undefined") return;

  const destroyThreat = (threatId, extraRewards = []) => ({ type: "destroyThreat", threatId, extraRewards });
  const clearCurrentCard = (label = "Cleared") => ({ type: "clearCurrentCard", label });
  const delayCurrentCard = (label = "Delayed") => ({ type: "delayCurrentCard", label });
  const loseFood = (amount = 1) => ({ type: "loseFood", amount });
  const loseRandomItemChance = (chance = 35, label = "Gear Lost") => ({ type: "loseRandomItemChance", chance, label });
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
        left: choice("Smash the idol", "combat", 5, 4, {
          failure: result("The idol splits your knuckles and screams your name.", [damage(1), noise(), loseRandomItemChance(25, "Idol Snatches Gear")]),
          success: result("You crush the idol beneath your heel.", [destroyThreat("whispering_idol"), clearCurrentCard("Idol Cleared")]),
          great: result("You crush it and learn how its seal was made.", [destroyThreat("whispering_idol"), clearCurrentCard("Idol Cleared"), xp("Broken Seal")]),
        }, ["combat", "spirit", "magic"]),
        right: choice("Muffle the whispers", "spirit", 3, 3, {
          failure: result("The whispers crawl under your skin.", [status("Revealed"), damage(1)]),
          success: result("You quiet the idol for now, but it keeps muttering under the mud.", [status("Hidden"), delayCurrentCard("Idol Delayed")]),
          great: result("You bind the whispers long enough to move safely.", [status("Hidden"), xp("Resisted Curse"), delayCurrentCard("Idol Delayed")]),
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
        left: choice("Cleanse the well", "spirit", 5, 4, {
          failure: result("The blessing backfires through your claws.", [damage(1), noise(), loseRandomItemChance(20, "Charm Corroded")]),
          success: result("The well stones brighten, and the plague retreats.", [destroyThreat("plague_well"), clearCurrentCard("Well Cleared"), heal(1)]),
          great: result("You cleanse the well and carry away blessed water.", [destroyThreat("plague_well"), clearCurrentCard("Well Cleared"), heal(2), xp("Resisted Curse")]),
        }, ["spirit", "magic", "food"]),
        right: choice("Salvage what you can", "survival", 3, 3, {
          failure: result("The rot spreads through your provisions.", [loseFood(1), damage(1), loseRandomItemChance(30, "Supplies Spoiled")]),
          success: result("You avoid the worst of the rot, but the well stays black.", [food(1), delayCurrentCard("Well Delayed")]),
          great: result("You find clean scraps nearby, but the source remains tainted.", [food(2), xp("Village Secrets"), delayCurrentCard("Well Delayed")]),
        }, ["food", "survival", "magic"]),
      },
    },

    bloodroot: {
      id: "bloodroot",
      title: "Bloodroot",
      badge: "Corruption Engine",
      art: ART.scout,
      text: "Red roots crawl beneath the road and clutch at ankles. While it remains, escape routes sour.",
      choices: {
        left: choice("Cut the root-heart", "combat", 5, 4, {
          failure: result("The roots whip around your legs and drag you down.", [damage(1), extraTimeCost(1), loseRandomItemChance(35, "Gear Tangled")]),
          success: result("You hack the root-heart apart.", [destroyThreat("bloodroot"), clearCurrentCard("Bloodroot Cleared")]),
          great: result("You cut a clean path through the roots.", [destroyThreat("bloodroot"), clearCurrentCard("Bloodroot Cleared"), xp("Escape Route"), time(1)]),
        }, ["combat", "route", "escape"]),
        right: choice("Find the clean path", "survival", 3, 3, {
          failure: result("You circle too long and the roots tighten behind you.", [extraTimeCost(2), noise(), loseRandomItemChance(20, "Pack Snagged")]),
          success: result("You find a safe path for now, but the roots keep growing.", [time(1), delayCurrentCard("Bloodroot Delayed")]),
          great: result("You map the clean path before the roots shift again.", [xp("Marked Route"), time(1), delayCurrentCard("Bloodroot Delayed")]),
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
        left: choice("Steal the clapper", "stealth", 5, 4, {
          failure: result("The bell catches your shadow and rings hard.", [status("Revealed"), noise(), loseRandomItemChance(30, "Tool Dropped")]),
          success: result("You steal the clapper and mute the bell.", [destroyThreat("grave_bell"), clearCurrentCard("Bell Cleared")]),
          great: result("You mute the bell so cleanly no one notices it died.", [destroyThreat("grave_bell"), clearCurrentCard("Bell Cleared"), xp("Silent Kill")]),
        }, ["stealth", "patrol", "theft"]),
        right: choice("Jam the bell", "cunning", 3, 3, {
          failure: result("Your wedge slips and the bell shrieks.", [noise(), damage(1), loseRandomItemChance(20, "Tool Lost")]),
          success: result("You jam the bell for now, but the searchers will fix it.", [status("Hidden"), delayCurrentCard("Bell Delayed")]),
          great: result("You turn the bell into a false alarm for a while.", [xp("Trap Cut"), delayCurrentCard("Bell Delayed")]),
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
        left: choice("Fight them off", "combat", 5, 4, {
          failure: result("The pack tears into you and howls for more.", [damage(2), noise(), loseRandomItemChance(40, "Gear Torn Away")]),
          success: result("You drive them off and break the pack.", [damage(1), xp("Scout Down"), clearCurrentCard("Hounds Cleared")]),
          great: result("You silence the pack before it can bay.", [xp("Silent Kill"), clearCurrentCard("Hounds Cleared")]),
        }, ["combat", "scout"]),
        right: choice("Hide in filthy water", "stealth", 3, 3, {
          failure: result("The hounds find you anyway.", [status("Revealed"), damage(1), noise(), loseRandomItemChance(25, "Scented Gear Lost")]),
          success: result("You sink into the water until they pass. They still have the trail.", [status("Hidden"), loseFood(1), delayCurrentCard("Hounds Delayed")]),
          great: result("You lose the scent trail for now.", [status("Hidden"), xp("Patience"), delayCurrentCard("Hounds Delayed")]),
        }, ["stealth", "hide", "scout"]),
      },
    },

    sealed_exit: {
      id: "sealed_exit",
      title: "Sealed Exit",
      badge: "Dark Lord Trap",
      art: ART.scout,
      text: "A black mark burns on the old road. The easy path is gone.",
      choices: {
        left: choice("Break the seal", "spirit", 5, 4, {
          failure: result("The seal bites back with black sparks.", [damage(1), noise(), loseRandomItemChance(25, "Seal Burns Gear")]),
          success: result("The mark cracks and the way opens again.", [time(1), xp("Broken Seal"), clearCurrentCard("Seal Cleared")]),
          great: result("You break the seal and learn its pattern.", [time(2), xp("Broken Seal"), stat("spirit", 1), clearCurrentCard("Seal Cleared")]),
        }, ["spirit", "magic", "route"]),
        right: choice("Find another path", "survival", 3, 3, {
          failure: result("You waste precious time doubling back.", [extraTimeCost(2), loseRandomItemChance(15, "Gear Misplaced")]),
          success: result("You find a worse path, but the sealed exit remains.", [time(1), delayCurrentCard("Seal Delayed")]),
          great: result("You find a hidden bypass, but the seal still blocks the obvious road.", [regionCard("village", "quiet_alley", "Quiet Alley"), xp("Marked Route"), delayCurrentCard("Seal Delayed")]),
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
        left: choice("Burn the rot", "spirit", 5, 4, {
          failure: result("The smoke chokes you and marks the lane.", [damage(1), noise(), loseRandomItemChance(20, "Charm Scorched")]),
          success: result("The rot burns away and the curse loses its grip.", [xp("Resisted Curse"), clearCurrentCard("Rot Cleared")]),
          great: result("The curse burns clean and leaves useful ash.", [xp("Resisted Curse"), item("Warding Charm"), clearCurrentCard("Rot Cleared")]),
        }, ["spirit", "magic", "food"]),
        right: choice("Salvage the food", "survival", 3, 3, {
          failure: result("The rot spreads through your stores.", [loseFood(1), damage(1), loseRandomItemChance(35, "Supplies Ruined")]),
          success: result("You cut away the blackened parts, but the curse remains in the region.", [xp("Resisted Curse"), delayCurrentCard("Rot Delayed")]),
          great: result("You save some food, but the curse is not gone.", [food(1), xp("Resisted Curse"), delayCurrentCard("Rot Delayed")]),
        }, ["food", "survival", "magic"]),
      },
    },

    rot_luck: {
      id: "rot_luck",
      title: "Rot Luck",
      badge: "Dark Lord Curse",
      art: ART.scout,
      text: "A cold little curse chews on your confidence and memories.",
      choices: {
        left: choice("Shake it off", "spirit", 5, 4, {
          failure: result("The curse bites deep and keeps circling.", [reduceModifier(2), damage(1), loseRandomItemChance(25, "Luck Spoils Gear")]),
          success: result("You force the curse out of the region’s pattern.", [clearCurrentCard("Curse Cleared")]),
          great: result("You turn the curse aside and learn its rhythm.", [clearCurrentCard("Curse Cleared"), xp("Resisted Curse")]),
        }, ["spirit", "magic"]),
        right: choice("Distract yourself", "cunning", 3, 3, {
          failure: result("You fumble through your tools and lose focus.", [reduceModifier(1), noise(), loseRandomItemChance(30, "Fumbled Item")]),
          success: result("You keep moving before it can settle, but it stays in the region deck.", [time(1), delayCurrentCard("Curse Delayed")]),
          great: result("You bait the curse into eating a false memory for now.", [xp("Trap Cut"), time(1), delayCurrentCard("Curse Delayed")]),
        }, ["cunning", "trap", "tool"]),
      },
    },
  });

  const removeCurrentCardFromDeck = () => {
    const region = game.regions?.[game.hero.regionId];
    if (!region?.deck) return;
    region.deck = region.deck.filter(cardId => cardId !== game.currentCardId);
    if (region.deckIndex >= region.deck.length) region.deckIndex = Math.max(0, region.deck.length - 1);
  };

  const moveCurrentCardToBottom = () => {
    const region = game.regions?.[game.hero.regionId];
    if (!region?.deck) return;
    const index = region.deck.indexOf(game.currentCardId);
    if (index < 0) return;
    region.deck.splice(index, 1);
    region.deck.push(game.currentCardId);
    region.deckIndex = Math.max(0, Math.min(region.deckIndex || 0, region.deck.length - 1));
  };

  const loseRandomInventoryItem = () => {
    const inventory = game.hero.inventory || [];
    if (!inventory.length) return null;
    const index = Math.floor(Math.random() * inventory.length);
    const [lost] = inventory.splice(index, 1);
    return lost || null;
  };

  const baseApplyRewards = applyRewards;
  window.applyRewards = function applyRewards(rewards = []) {
    const expanded = [];
    rewards.forEach(reward => {
      if (reward.type === "destroyThreat") {
        removeThreatFromRegion?.(game.hero.regionId, reward.threatId);
        expanded.push(...(reward.extraRewards || []));
      } else if (reward.type === "clearCurrentCard") {
        removeCurrentCardFromDeck();
        expanded.push({ type: "xp", label: reward.label || "Card Cleared" });
      } else if (reward.type === "delayCurrentCard") {
        moveCurrentCardToBottom();
        expanded.push({ type: "xp", label: reward.label || "Card Delayed" });
      } else if (reward.type === "loseRandomItemChance") {
        const roll = Math.random() * 100;
        if (roll < reward.chance) {
          const lost = loseRandomInventoryItem();
          expanded.push({ type: "xp", label: lost ? `Lost ${lost}` : "No item to lose" });
        }
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
