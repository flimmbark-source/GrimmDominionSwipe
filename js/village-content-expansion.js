// Adds more Village event content using the existing reward/modifier systems.
(() => {
  if (typeof cards === "undefined" || typeof choice !== "function") return;

  const addVillageCard = (id, card, includeInStartingDeck = true) => {
    cards[id] = { id, art: ART.scout, ...card };
    if (includeInStartingDeck && Array.isArray(villageStartingDeck) && !villageStartingDeck.includes(id)) {
      villageStartingDeck.push(id);
    }
    if (game?.regions?.village?.deck && includeInStartingDeck && !game.regions.village.deck.includes(id)) {
      game.regions.village.deck.push(id);
    }
  };

  addVillageCard("baker_backdoor", {
    title: "Baker’s Back Door",
    text: "Warm air leaks from a crooked bakery door. Flour dust marks the floor, and a tray of rolls cools beside a sleeping apprentice.",
    choices: {
      left: choice("Pocket the rolls", "stealth", 3, 3, {
        failure: result("The tray clatters. The apprentice wakes with flour in his hair and panic in his lungs.", [food(1), noise(), regionCard("village", "angry_villager", "Angry Villager")]),
        success: result("You lift a bundle of rolls and leave soft pawprints in the flour.", [food(2), xp("Patience")]),
        great: result("You steal rolls, cheese, and the hidden pantry route behind the oven.", [food(3), heal(1), regionCard("village", "hidden_pantry", "Hidden Pantry")]),
      }, ["stealth", "food", "house"]),
      right: choice("Search the flour bins", "cunning", 3, 4, {
        failure: result("You sneeze into a bin and knock over the scoop.", [noise()]),
        success: result("You find a purse wrapped in wax paper.", [gold(2), food(1)]),
        great: result("You find a purse and learn where the bakers hide winter stores.", [gold(3), xp("Village Secrets"), food(1)]),
      }, ["search", "food", "village"]),
    },
  });

  addVillageCard("kennel_yard", {
    title: "Kennel Yard",
    text: "Three lean dogs sleep near a rack of old leashes. A cracked gate leads behind the guardhouse.",
    choices: {
      left: choice("Slip past the dogs", "stealth", 4, 4, {
        failure: result("A dog snaps awake and the whole yard erupts in barking.", [noise(), damage(1), regionCard("village", "watch_patrol", "Watch Patrol")]),
        success: result("You move between sleeping paws and reach the back lane.", [time(1), status("Hidden")]),
        great: result("You cross the yard and mark a guardhouse shortcut.", [time(2), xp("Marked Route"), regionCard("village", "guardhouse_shortcut", "Guardhouse Shortcut")]),
      }, ["stealth", "hide", "route"]),
      right: choice("Cut a snare cord", "cunning", 3, 3, {
        failure: result("The cord snaps back and a dog bites your sleeve.", [damage(1)]),
        success: result("You cut loose a useful cord without waking the dogs.", [item("Snare Cord")]),
        great: result("You take the cord and learn how the yard traps are set.", [item("Snare Cord"), xp("Trap Sense")]),
      }, ["trap", "tool", "lure"]),
    },
  });

  addVillageCard("guard_post", {
    title: "Sleepy Guard Post",
    text: "A helmeted guard snores beside a lantern. His spear blocks the road, but his coin pouch hangs low.",
    choices: {
      left: choice("Lift the pouch", "cunning", 4, 5, {
        failure: result("The pouch knot catches. The guard wakes and swings blind.", [damage(1), noise(), gold(1)]),
        success: result("You cut the pouch and leave him snoring.", [gold(3), xp("Theft")]),
        great: result("You take the pouch, a silver button, and the guard’s route chalk.", [gold(4), item("Silver Button"), xp("Clean Theft")]),
      }, ["theft", "quiet", "market"]),
      right: choice("Move the spear", "combat", 3, 4, {
        failure: result("The spear clatters over the cobbles.", [noise(), status("Revealed")]),
        success: result("You shift it aside and pass through the roadblock.", [time(1)]),
        great: result("You pass through and learn how to frighten lone guards.", [time(2), xp("Intimidate")]),
      }, ["combat", "intimidate", "route"]),
    },
  });

  addVillageCard("apothecary_drawer", {
    title: "Apothecary Drawer",
    text: "A half-open shop drawer smells of mint, bitter bark, and old copper. Labels curl off tiny bottles.",
    choices: {
      left: choice("Take useful herbs", "survival", 3, 4, {
        failure: result("You grab the wrong bundle. It stings your nose and burns your eyes.", [damage(1), item("Healing Herbs")]),
        success: result("You find a clean bundle of healing herbs.", [item("Healing Herbs"), heal(1)]),
        great: result("You sort the drawer perfectly and pack herbs, food, and a quiet exit.", [item("Healing Herbs"), food(2), time(1)]),
      }, ["food", "survival", "search"]),
      right: choice("Read the bottle marks", "spirit", 3, 4, {
        failure: result("The marks twist in your head. A bottle rolls off the shelf.", [noise(), damage(1)]),
        success: result("You understand enough to avoid the cursed draughts.", [xp("Resisted Curse")]),
        great: result("You find a warding charm beneath the false drawer.", [item("Warding Charm"), xp("Resisted Curse"), stat("spirit", 1)]),
      }, ["spirit", "magic", "search"]),
    },
  });

  addVillageCard("sewer_grate", {
    title: "Rusty Sewer Grate",
    text: "A rusted grate breathes damp air into the alley. Something below scratches against the stone.",
    choices: {
      left: choice("Pry it open", "combat", 4, 5, {
        failure: result("The grate drops on your claws with a thunderous clang.", [damage(1), noise()]),
        success: result("You wrench it open and find a crawlable way under the street.", [regionCard("village", "drain_crawl", "Drain Crawl"), time(1)]),
        great: result("You open it quietly and learn how the old drains connect.", [regionCard("village", "drain_crawl", "Drain Crawl"), xp("Secret Path"), time(2)]),
      }, ["dark", "tunnel", "route"]),
      right: choice("Listen below", "stealth", 2, 3, {
        failure: result("A rat swarm answers your whisper.", [damage(1)]),
        success: result("You hear patrol boots above and water below.", [xp("Patience")]),
        great: result("You map the patrol rhythm through the drain echoes.", [xp("Patience"), xp("Marked Route")]),
      }, ["stealth", "patrol", "tunnel"]),
    },
  });

  addVillageCard("shrine_vendor", {
    title: "Shrine Vendor’s Cart",
    text: "A tiny cart of charms sits beneath a painted saint. Coins, ribbons, and bone tokens sway in the night breeze.",
    choices: {
      left: choice("Steal a charm", "cunning", 4, 5, {
        failure: result("A charm string snaps and bells chatter from the cart.", [noise(), gold(1)]),
        success: result("You pocket a small ward and a few coins.", [item("Warding Charm"), gold(1)]),
        great: result("You find the real ward hidden beneath the fake charms.", [item("Warding Charm"), xp("Village Secrets"), stat("spirit", 1)]),
      }, ["theft", "spirit", "market"]),
      right: choice("Read the saint marks", "spirit", 3, 4, {
        failure: result("The painted eyes follow you. You stumble into the cart wheel.", [damage(1)]),
        success: result("The marks point toward a forgotten chapel path.", [regionCard("village", "secret_route", "Secret Route")]),
        great: result("The saint marks reveal a sealed route beneath the road.", [regionCard("village", "sealed_road_marks", "Sealed Road Marks"), xp("Broken Seal")]),
      }, ["spirit", "magic", "route"]),
    },
  });

  addVillageCard("hidden_pantry", {
    title: "Hidden Pantry",
    badge: "Discovered Cache",
    text: "A narrow pantry hides behind warm brick. Jars, hooks, and a cracked lockbox fill the shelves.",
    choices: {
      left: choice("Pack provisions", "survival", 2, 3, {
        failure: result("A shelf gives way. You save what you can.", [food(1), noise()]),
        success: result("You pack food without disturbing the jars.", [food(3)]),
        great: result("You pack food and find a careful route through the bakery wall.", [food(3), time(2), xp("Village Secrets")]),
      }, ["food", "house", "search"]),
      right: choice("Open the lockbox", "cunning", 3, 4, {
        failure: result("The lockbox squeals open just enough for a coin.", [gold(1), noise()]),
        success: result("You find coins and a spare lock inside.", [gold(2), item("Spare Lock")]),
        great: result("You open it cleanly and improve your lock work.", [gold(3), item("Spare Lock"), xp("Clean Theft")]),
      }, ["lock", "theft", "house"]),
    },
  }, false);

  addVillageCard("guardhouse_shortcut", routeCard("Guardhouse Shortcut", "A narrow space behind the kennel wall bypasses the guard post and its lanterns.", "Use the shortcut", "stealth", 2, 2, [status("Hidden"), time(2), xp("Marked Route")]), false);
  addVillageCard("drain_crawl", routeCard("Drain Crawl", "A low drain runs under the market stones. It smells awful, but patrols hate it more than you do.", "Crawl through", "survival", 3, 4, [status("Hidden"), time(2), food(1), xp("Secret Path")]), false);
  addVillageCard("sealed_road_marks", routeCard("Sealed Road Marks", "Old chalk marks show where a warded road can be crossed without waking the seal.", "Cross the seal", "spirit", 3, 4, [time(2), xp("Broken Seal")]), false);

  addVillageCard("watch_patrol", {
    title: "Watch Patrol",
    badge: "Consequence Card",
    text: "Two watchmen sweep the lane with lanterns. Their boots are slow, but their light is wide.",
    choices: {
      left: choice("Flatten in shadow", "stealth", 4, 4, {
        failure: result("The lantern finds one green ear.", [status("Revealed"), noise()]),
        success: result("You let the light pass over you.", [status("Hidden"), xp("Patience")]),
        great: result("You vanish and learn the watch’s sweep pattern.", [status("Hidden"), xp("Patience"), time(1)]),
      }, ["stealth", "hide", "patrol"]),
      right: choice("Trip the rear guard", "combat", 4, 5, {
        failure: result("The rear guard falls loudly and takes you with him.", [damage(1), noise()]),
        success: result("You drop him, but the other guard shouts.", [xp("Scout Down"), noise()]),
        great: result("You drop him silently and take his lantern.", [xp("Silent Kill"), item("Lantern")]),
      }, ["combat", "scout", "stealth"]),
    },
  }, false);

  if (typeof render === "function") render();
})();
