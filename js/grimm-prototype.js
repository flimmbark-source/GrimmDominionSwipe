const ART = {
  scout: "art_crops/event_art_scout_village.png",
  goblinSmall: "art_crops/portrait_goblin_small.png",
  goblinLarge: "art_crops/portrait_goblin_large.png",
  shiv: "art_crops/item_rusty_shiv.png",
  smoke: "art_crops/item_smoke_bomb.png",
  coin: "art_crops/item_crow_coin.png",
};

const STAT_ICONS = { stealth: "🕶", combat: "⚔", cunning: "👁", spirit: "✦", survival: "🐾" };
const RESULT_ICONS = { failure: "☠", success: "◇", great: "♛" };
const RESULT_READY_MS = 3380;
const GHOST_META = {
  gold: { icon: "●", className: "gold" },
  food: { icon: "◆", className: "food" },
  damage: { icon: "♥", className: "damage" },
  heal: { icon: "♥", className: "heal" },
  status: { icon: "◉", className: "status" },
  noise: { icon: "〰", className: "noise" },
  item: { icon: "▣", className: "item" },
  stat: { icon: "▲", className: "stat" },
  xp: { icon: "✦", className: "xp" },
  time: { icon: "⌛", className: "time" },
  card: { icon: "▣", className: "item" },
};

const villageStartingDeck = [
  "village_house_window",
  "market_stall",
  "scout_sniffs_path",
  "chapel_backroom",
  "well_bucket",
  "old_rooftops",
  "locked_cottage",
];

const initialGame = () => ({
  activeTab: "explore",
  heroTimer: 40,
  darkLordTimer: 60,
  selectedCommand: null,
  currentCardId: villageStartingDeck[0],
  pendingNextCardId: null,
  awaitingResultAck: false,
  resultReady: false,
  lastAction: null,
  result: "Choose a path. The Village is full of small opportunities and bad noises.",
  partyHealth: 7,
  corruption: 8,
  castleReadiness: 3,
  darkLord: { evilEnergy: 7, maxEvilEnergy: 10, pending: [] },
  hero: {
    id: "goblin",
    name: "Goblin Outlaw",
    status: "Hidden",
    regionId: "village",
    resourceName: "Gold",
    resourceValue: 4,
    food: 0,
    xp: 0,
    inventory: ["Rusty Shiv", "Smoke Bomb", "Crow Coin"],
    stats: { stealth: 5, combat: 2, cunning: 5, spirit: 1, survival: 3 },
    passive: {
      name: "Small Enough to Miss",
      text: "Once per round, if the Goblin would fail a Stealth check, change that failure into a normal success.",
    },
    equipment: [
      { slot: "Main", name: "Rusty Shiv", icon: ART.shiv, text: "Silent melee strike." },
      { slot: "Tool", name: "Smoke Bomb", icon: ART.smoke, text: "Become Suspected instead of Revealed once." },
      { slot: "Charm", name: "Crow Coin", icon: ART.coin, text: "Favored by crows." },
    ],
  },
  regions: {
    village: {
      id: "village",
      name: "Village",
      subtitle: "Every shutter hides a prize or a witness.",
      state: "Suspected",
      signals: ["noise"],
      pending: [],
      deck: [...villageStartingDeck],
      deckIndex: 0,
    },
    swamp: { id: "swamp", name: "Swamp", subtitle: "Black water clings to the roots.", state: "Corrupted", signals: ["corruption"], pending: [], deck: [], deckIndex: 0 },
    shrine: { id: "shrine", name: "Forest Shrine", subtitle: "Old magic stirs beneath the stones.", state: "Hunted", signals: ["magic"], pending: [], deck: [], deckIndex: 0 },
    road: { id: "road", name: "Old Road", subtitle: "The road remembers every footprint.", state: "Hero Revealed", signals: ["sighting"], pending: [], deck: [], deckIndex: 0 },
    castle: { id: "castle", name: "Castle", subtitle: "The throne waits behind iron prayers.", state: "Quiet", signals: [], pending: [], deck: [], deckIndex: 0 },
  },
  party: [
    { name: "Goblin Outlaw", region: "Village", status: "Hidden", resource: "Gold", value: 4 },
    { name: "Exiled Knight", region: "Old Road", status: "Wounded", resource: "Valor", value: 2 },
    { name: "Forest Witch", region: "Forest Shrine", status: "Hidden", resource: "Arcane", value: 3 },
    { name: "Alchemist", region: "Swamp", status: "Out of Time", resource: "Ingredients", value: 5 },
  ],
  log: ["Noise heard in Village.", "Magic disturbed at Forest Shrine.", "Knight revealed on Old Road."],
});

const cards = {
  village_house_window: {
    id: "village_house_window",
    title: "Warm House Window",
    art: ART.scout,
    text: "A family sleeps above a low window. Lamplight shows a pantry, a purse, and floorboards that might betray you.",
    choices: {
      left: choice("Sneak inside", "stealth", 3, 4, {
        failure: result("A latch snaps. Someone bolts upright and screams.", [noise(), status("Revealed"), damage(1), regionCard("village", "angry_villager", "Angry Villager")]),
        success: result("You slide through the window and land beside the cold hearth.", [xp("Inside")], "inside_sleeping_house"),
        great: result("You enter without a whisper and spot the best hiding places.", [stat("stealth", 1), status("Hidden")], "inside_sleeping_house"),
      }),
      right: choice("Move along", "survival", 2, 2, {
        failure: result("You step through broken pottery in the alley.", [noise()]),
        success: result("You leave the house alone and keep your route clean.", [time(1)]),
        great: result("You find a faster alley behind the house.", [time(2), xp("Shortcut"), regionCard("village", "quiet_alley", "Quiet Alley")]),
      }),
    },
  },
  inside_sleeping_house: {
    id: "inside_sleeping_house",
    title: "Inside the Sleeping House",
    art: ART.scout,
    text: "The house smells of bread, wet wool, and coin. A cupboard creaks. A child coughs upstairs.",
    choices: {
      left: choice("Rob the purse", "cunning", 3, 5, {
        failure: result("Coins scatter across the floorboards like hail.", [noise(), gold(1), status("Revealed"), regionCard("village", "angry_villager", "Angry Villager")]),
        success: result("You lift the purse and leave the clasp hanging.", [gold(3), xp("Theft")]),
        great: result("You take the purse, a spare key, and your own shadow with you.", [gold(5), item("House Key"), stat("cunning", 1)]),
      }),
      right: choice("Take food", "survival", 2, 3, {
        failure: result("A jar breaks. You grab what you can as footsteps stir.", [food(1), noise()]),
        success: result("You pack bread and dried apples without waking anyone.", [food(2), heal(1)]),
        great: result("You find smoked meat, herbs, and a quiet back door.", [food(3), item("Healing Herbs"), time(1), regionCard("village", "cellar_route", "Cellar Route")]),
      }),
    },
  },
  market_stall: {
    id: "market_stall",
    title: "Abandoned Market Stall",
    art: ART.scout,
    text: "A rain tarp hides a clutter of bottles, knives, charms, and turnips. The stall bell hangs dangerously low.",
    choices: {
      left: choice("Cut the cashbox", "cunning", 4, 5, {
        failure: result("The bell clatters and the cashbox barely opens.", [gold(1), noise(), regionCard("village", "angry_villager", "Angry Villager")]),
        success: result("The lock gives. Coins spill into your pouch.", [gold(4)]),
        great: result("You find the hidden till beneath the false bottom.", [gold(6), item("Silver Button"), xp("Clean Theft")]),
      }),
      right: choice("Search supplies", "survival", 3, 4, {
        failure: result("A rotten crate collapses under your claws.", [damage(1), food(1)]),
        success: result("You gather useful scraps and a meal.", [food(2), item("Torch Kit")]),
        great: result("You find a perfect little climbing hook under the tarp.", [item("Rope Hook"), stat("survival", 1), regionCard("village", "old_rooftops", "Old Rooftops")]),
      }),
    },
  },
  scout_sniffs_path: {
    id: "scout_sniffs_path",
    title: "Scout Sniffs the Path",
    art: ART.scout,
    text: "A crooked Scout freezes near the bushes, nose twitching. One sharp whiff and it’ll raise the alarm.",
    choices: {
      left: choice("Hide in the ditch", "stealth", 3, 4, {
        failure: result("The Scout howls. You are marked in the Village.", [status("Revealed"), noise()]),
        success: result("You hide, but the Scout keeps sniffing nearby.", [status("Hidden")]),
        great: result("You slip past cleanly and learn its patrol rhythm.", [status("Hidden"), stat("stealth", 1)]),
      }),
      right: choice("Kill it before it howls", "combat", 4, 6, {
        failure: result("The Scout claws you and gets a howl out.", [damage(1), status("Revealed"), noise()]),
        success: result("You kill it, but the scuffle makes Noise.", [xp("Scout Down"), noise()]),
        great: result("You kill the Scout silently and pocket its horn.", [item("Scout Horn"), xp("Silent Kill")]),
      }),
    },
  },
  chapel_backroom: {
    id: "chapel_backroom",
    title: "Chapel Backroom",
    art: ART.scout,
    text: "A cracked chapel door opens onto candles, old ledgers, and a donation box under a saint’s wooden eye.",
    choices: {
      left: choice("Crack donation box", "cunning", 4, 5, {
        failure: result("The box groans like a dying crow.", [noise(), damage(1)]),
        success: result("You pry out a handful of offerings.", [gold(3)]),
        great: result("You find coins and a warding charm hidden inside.", [gold(4), item("Warding Charm"), stat("spirit", 1)]),
      }),
      right: choice("Read old ledger", "spirit", 3, 4, {
        failure: result("The words crawl in your head. You slam it shut too loudly.", [noise(), damage(1)]),
        success: result("You learn which families hide food for winter.", [xp("Village Secrets"), food(1)]),
        great: result("You learn a forgotten route beneath the chapel stones.", [regionCard("village", "secret_route", "Secret Route"), time(2), stat("spirit", 1)]),
      }),
    },
  },
  well_bucket: {
    id: "well_bucket",
    title: "Village Well",
    art: ART.scout,
    text: "A bucket hangs over black water. Something useful gleams far below, tangled in the rope.",
    choices: {
      left: choice("Climb down", "survival", 4, 6, {
        failure: result("The rope burns your palms and drops you hard.", [damage(2)]),
        success: result("You climb down and recover a lost bundle.", [item("Lost Bundle"), food(1)]),
        great: result("You descend and find a dry tunnel under the stones.", [regionCard("village", "well_tunnel", "Well Tunnel"), time(2), stat("survival", 1)]),
      }),
      right: choice("Fish with hook", "cunning", 3, 4, {
        failure: result("The hook rings against stone.", [noise()]),
        success: result("You pull up a wrapped coin roll.", [gold(2)]),
        great: result("You pull up coins and a lockpick kit.", [gold(2), item("Lockpick Set"), stat("cunning", 1)]),
      }),
    },
  },
  old_rooftops: {
    id: "old_rooftops",
    title: "Old Rooftops",
    art: ART.scout,
    text: "Low rooftops lean together above the lane. A good climber could cross the Village unseen.",
    choices: {
      left: choice("Leap the gaps", "survival", 3, 4, {
        failure: result("Tiles slide. You crash through a chicken coop.", [damage(1), noise()]),
        success: result("You cross the roofs and save time.", [time(2), xp("High Path")]),
        great: result("You master the roofline and mark a perfect escape path.", [time(3), stat("survival", 1), status("Hidden")]),
      }),
      right: choice("Shadow a chimney sweep", "stealth", 3, 4, {
        failure: result("The sweep spots you and shrieks.", [status("Revealed"), noise()]),
        success: result("You follow his route and avoid patrols.", [status("Hidden"), xp("Blend In")]),
        great: result("You steal his soot cloak and vanish into the smoke.", [item("Soot Cloak"), stat("stealth", 1)]),
      }),
    },
  },
  locked_cottage: {
    id: "locked_cottage",
    title: "Locked Cottage",
    art: ART.scout,
    text: "A cottage door hangs crooked on iron hinges. Something valuable glints beneath the floorboards.",
    choices: {
      left: choice("Pick the lock", "cunning", 3, 5, {
        failure: result("The lock snaps loudly. You still grab a loose coin.", [gold(1), noise()]),
        success: result("You pry it open and find a hidden purse.", [gold(2)]),
        great: result("You empty the hiding place quietly and keep the lock intact.", [gold(3), item("Spare Lock"), stat("cunning", 1)]),
      }),
      right: choice("Listen first", "stealth", 2, 3, {
        failure: result("Floorboards creak under your ear.", [noise()]),
        success: result("You hear patrols outside and choose a safer angle.", [status("Hidden"), xp("Patience")]),
        great: result("You hear a hidden route through the cellar.", [regionCard("village", "cellar_route", "Cellar Route"), time(2)]),
      }),
    },
  },
  cellar_route: routeCard("Cellar Route", "A cold passage runs beneath the cottage and away from the main patrol lanes.", "Use the route", "stealth", 2, 2, [status("Hidden"), time(2), xp("Escape Route")]),
  secret_route: routeCard("Secret Route", "A forgotten chapel path slips between stone walls and old roots.", "Follow the marks", "spirit", 2, 3, [status("Hidden"), time(2), xp("Secret Path")]),
  well_tunnel: routeCard("Well Tunnel", "A damp tunnel under the Village carries old water and older secrets.", "Crawl through", "survival", 3, 4, [status("Hidden"), time(3), food(1)]),
  quiet_alley: routeCard("Quiet Alley", "A narrow alley hides your small footsteps from the street patrols.", "Slip through", "stealth", 2, 2, [status("Hidden"), time(1)]),
  angry_villager: {
    id: "angry_villager",
    title: "Angry Villager",
    art: ART.scout,
    text: "A villager bursts into the lane with a lantern, a rake, and a very loud voice.",
    choices: {
      left: choice("Duck under the cart", "stealth", 3, 3, {
        failure: result("The lantern catches your shadow.", [status("Revealed"), noise()]),
        success: result("You vanish beneath the cart until they pass.", [status("Hidden")]),
        great: result("You vanish and steal a dropped purse as they pass.", [status("Hidden"), gold(2)]),
      }),
      right: choice("Scare them off", "combat", 3, 4, {
        failure: result("They hit you with the rake and keep shouting.", [damage(1), noise()]),
        success: result("They run, but not quietly.", [noise(), xp("Intimidate")]),
        great: result("They drop the lantern and flee in silence.", [item("Lantern"), xp("Intimidate")]),
      }),
    },
  },
};

function routeCard(title, text, label, statName, difficulty, timeCost, rewards) {
  return {
    id: title.toLowerCase().replaceAll(" ", "_"),
    title,
    art: ART.scout,
    text,
    choices: {
      left: choice(label, statName, difficulty, timeCost, {
        failure: result("The route betrays you and makes noise.", [noise()]),
        success: result("The route works. You slip through cleanly.", rewards),
        great: result("You master the route and make it faster for next time.", [...rewards, stat(statName, 1)]),
      }),
      right: choice("Mark it for later", "cunning", 2, 2, {
        failure: result("Your mark is obvious to everyone.", [noise()]),
        success: result("You mark the route and keep moving.", [xp("Marked Route")]),
        great: result("You hide a perfect route mark for the party.", [xp("Marked Route"), time(1)]),
      }),
    },
  };
}

function choice(label, stat, difficulty, timeCost, outcomes) { return { label, stat, difficulty, timeCost, outcomes }; }
function result(text, rewards = [], nextCardId = null) { return { text, rewards, nextCardId }; }
function gold(amount) { return { type: "gold", amount }; }
function food(amount) { return { type: "food", amount }; }
function damage(amount) { return { type: "damage", amount }; }
function heal(amount) { return { type: "heal", amount }; }
function status(value) { return { type: "status", value }; }
function noise() { return { type: "noise" }; }
function item(name) { return { type: "item", name }; }
function stat(statName, amount) { return { type: "stat", statName, amount }; }
function xp(label) { return { type: "xp", label }; }
function time(amount) { return { type: "time", amount }; }
function regionCard(regionId, cardId, label = cards[cardId]?.title || cardId) { return { type: "regionCard", regionId, cardId, label }; }

let game = initialGame();
let intervalId = null;
let resultReadyTimeoutId = null;

function calculateThresholds(statValue, difficulty) {
  const advantage = statValue - difficulty;
  const red = clamp(35 - advantage * 10, 5, 85);
  const green = clamp(Math.max(red + 10, 65 - advantage * 10), red + 10, 95);
  return { red, green };
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function rollOutcome(choice) {
  const { red, green } = calculateThresholds(game.hero.stats[choice.stat], choice.difficulty);
  const roll = Math.floor(Math.random() * 100) + 1;
  if (roll <= red) return { type: "failure", roll, red, green };
  if (roll > green) return { type: "great", roll, red, green };
  return { type: "success", roll, red, green };
}

function ghost(kind, text) {
  const meta = GHOST_META[kind] ?? GHOST_META.status;
  return { kind, text, icon: meta.icon, className: meta.className };
}

function choose(side) {
  if (game.heroTimer <= 0 || game.awaitingResultAck) return;
  const card = cards[game.currentCardId];
  const choiceData = card.choices[side];
  const roll = rollOutcome(choiceData);
  const outcome = choiceData.outcomes[roll.type];

  game.heroTimer = Math.max(0, game.heroTimer - choiceData.timeCost);
  const ghosts = applyRewards(outcome.rewards);
  game.awaitingResultAck = true;
  game.resultReady = false;
  game.pendingNextCardId = outcome.nextCardId || drawNextCardId();
  game.lastAction = {
    side,
    choiceLabel: choiceData.label,
    outcomeType: roll.type,
    roll: roll.roll,
    red: roll.red,
    green: roll.green,
    text: outcome.text,
    ghosts,
  };
  game.result = `<strong>${formatOutcome(roll.type)} · d100 ${roll.roll}</strong><br>${outcome.text}`;
  game.log.unshift(`${card.title}: ${formatOutcome(roll.type)} on ${choiceData.label} (${roll.roll}).`);
  render();
  queueResultReady(ghosts.length);
}

function drawNextCardId() {
  const region = game.regions[game.hero.regionId];
  const deck = region?.deck?.length ? region.deck : villageStartingDeck;
  region.deckIndex = ((region.deckIndex ?? 0) + 1) % deck.length;
  return deck[region.deckIndex];
}

function queueResultReady(ghostCount) {
  if (resultReadyTimeoutId) clearTimeout(resultReadyTimeoutId);
  const lastGhostDelay = Math.max(0, ghostCount - 1) * 130;
  resultReadyTimeoutId = setTimeout(() => {
    if (!game.awaitingResultAck) return;
    game.resultReady = true;
    render();
  }, RESULT_READY_MS + lastGhostDelay);
}

function acknowledgeResult() {
  if (!game.awaitingResultAck || !game.pendingNextCardId || !game.resultReady) return;
  if (resultReadyTimeoutId) clearTimeout(resultReadyTimeoutId);
  resultReadyTimeoutId = null;
  game.currentCardId = game.pendingNextCardId;
  game.pendingNextCardId = null;
  game.awaitingResultAck = false;
  game.resultReady = false;
  game.lastAction = null;
  game.result = "Choose your next path.";
  syncPartyHeroSummary();
  render();
}

function applyRewards(rewards = []) {
  const ghosts = [];
  for (const reward of rewards) {
    if (reward.type === "gold") {
      game.hero.resourceValue = Math.max(0, game.hero.resourceValue + reward.amount);
      ghosts.push(ghost("gold", `${signed(reward.amount)} Gold`));
    }
    if (reward.type === "food") {
      game.hero.food = Math.max(0, game.hero.food + reward.amount);
      ghosts.push(ghost("food", `${signed(reward.amount)} Food`));
    }
    if (reward.type === "damage") {
      game.partyHealth = Math.max(0, game.partyHealth - reward.amount);
      ghosts.push(ghost("damage", `-${reward.amount} Health`));
    }
    if (reward.type === "heal") {
      game.partyHealth = Math.min(10, game.partyHealth + reward.amount);
      ghosts.push(ghost("heal", `+${reward.amount} Health`));
    }
    if (reward.type === "status") {
      game.hero.status = reward.value;
      if (reward.value === "Revealed") {
        game.regions.village.state = "Hero Revealed";
        addSignal("village", "sighting");
      }
      ghosts.push(ghost("status", reward.value));
    }
    if (reward.type === "noise") {
      addSignal("village", "noise");
      ghosts.push(ghost("noise", "Noise"));
    }
    if (reward.type === "item") {
      if (!game.hero.inventory.includes(reward.name)) game.hero.inventory.push(reward.name);
      ghosts.push(ghost("item", reward.name));
    }
    if (reward.type === "regionCard") {
      addCardToRegionDeck(reward.regionId || game.hero.regionId, reward.cardId);
      ghosts.push(ghost("card", reward.label || cards[reward.cardId]?.title || reward.cardId));
    }
    if (reward.type === "stat") {
      game.hero.stats[reward.statName] = (game.hero.stats[reward.statName] || 0) + reward.amount;
      ghosts.push(ghost("stat", `+${reward.amount} ${titleCase(reward.statName)}`));
    }
    if (reward.type === "xp") {
      game.hero.xp += 1;
      ghosts.push(ghost("xp", reward.label || "+1 XP"));
    }
    if (reward.type === "time") {
      game.heroTimer += reward.amount;
      ghosts.push(ghost("time", `${signed(reward.amount)}s`));
    }
  }
  syncPartyHeroSummary();
  return ghosts.length ? ghosts : [ghost("xp", "No Change")];
}

function addCardToRegionDeck(regionId, cardId) {
  const region = game.regions[regionId];
  if (!region || !cards[cardId]) return;
  region.deck ||= [];
  if (!region.deck.includes(cardId)) {
    region.deck.push(cardId);
    game.log.unshift(`${cards[cardId].title} added to ${region.name} deck.`);
  }
}

function signed(value) { return value > 0 ? `+${value}` : `${value}`; }
function titleCase(value) { return value[0].toUpperCase() + value.slice(1); }
function addSignal(regionId, signal) {
  const region = game.regions[regionId];
  if (region && !region.signals.includes(signal)) region.signals.push(signal);
}
function syncPartyHeroSummary() {
  const goblin = game.party.find(member => member.name === "Goblin Outlaw");
  if (!goblin) return;
  goblin.status = game.hero.status;
  goblin.value = game.hero.resourceValue;
}
function formatOutcome(type) { return type === "great" ? "Great Success" : type[0].toUpperCase() + type.slice(1); }

function tick() {
  game.darkLordTimer = Math.max(0, game.darkLordTimer - 1);

  if (game.darkLordTimer === 0) {
    if (resultReadyTimeoutId) clearTimeout(resultReadyTimeoutId);
    resultReadyTimeoutId = null;
    resolveDarkLordPlan();
    game.darkLordTimer = 60;
    game.heroTimer = 40;
    game.awaitingResultAck = false;
    game.resultReady = false;
    game.pendingNextCardId = null;
    game.lastAction = null;
    render();
    return;
  }

  if (game.awaitingResultAck) return;
  render();
}

function resolveDarkLordPlan() {
  if (game.darkLord.pending.length) {
    const resolved = game.darkLord.pending.map(p => `${p.card.title} → ${game.regions[p.regionId].name}`).join(", ");
    game.log.unshift(`Dark Lord resolves: ${resolved}.`);
    game.result = `<strong>Dark Lord plan resolves.</strong><br>${resolved}`;
  }
  game.darkLord.pending = [];
  Object.values(game.regions).forEach(region => region.pending = []);
  game.corruption = Math.min(20, game.corruption + 1);
}

function selectCommand(id) { game.selectedCommand = game.selectedCommand === id ? null : id; render(); }

function targetRegion(regionId) {
  if (!game.selectedCommand) return;
  const card = commandCards.find(c => c.id === game.selectedCommand);
  if (!card || card.cost > game.darkLord.evilEnergy) return;
  game.darkLord.evilEnergy -= card.cost;
  game.darkLord.pending.push({ card, regionId });
  game.regions[regionId].pending = [...(game.regions[regionId].pending || []), card.title];
  if (card.seedCardId) addCardToRegionDeck(regionId, card.seedCardId);
  game.log.unshift(`Dark Lord plans ${card.title} on ${game.regions[regionId].name}.`);
  game.selectedCommand = null;
  render();
}

function setTab(tab) { game.activeTab = tab; render(); }
function resetGame() {
  if (resultReadyTimeoutId) clearTimeout(resultReadyTimeoutId);
  resultReadyTimeoutId = null;
  game = initialGame();
  render();
}
function startTimers() { if (intervalId) clearInterval(intervalId); intervalId = setInterval(tick, 1000); }

function render() {
  const app = document.getElementById("app");
  app.innerHTML = `<main class="gd-phone"><section class="gd-screen">${renderScreen()}</section>${renderTabs()}</main>`;
  bindEvents();
}

function renderScreen() {
  if (game.activeTab === "darklord") return renderDarkLord();
  if (game.activeTab === "hero") return renderHero();
  if (game.activeTab === "party") return renderParty();
  if (game.activeTab === "inventory") return renderInventory();
  if (game.activeTab === "log") return renderLog();
  return renderExplore();
}

function timerRing(value, variant = "hero", label = "") {
  return `<div><div class="gd-timer ${variant === "dark" ? "red" : ""}">${value}s</div>${label ? `<div class="gd-timer-label">${label}</div>` : ""}</div>`;
}

function renderExplore() {
  const card = cards[game.currentCardId];
  const region = game.regions[game.hero.regionId];
  return `<div class="gd-main-scroll">
    <section class="gd-top single-right"><div></div><div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section>
    <section class="gd-region-header"><div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-region-title">${region.name}</div><div class="gd-subtitle">${region.subtitle}</div></div></div><div class="gd-pill">◉ ${region.state}</div></section>
    <section class="gd-card"><div class="gd-timer gd-card-timer">${game.heroTimer}s</div>${renderGhostLayer()}<div class="gd-card-art" style="background-image:url('${card.art}')"></div><div class="gd-card-body"><div class="gd-card-title">${card.title}</div><div class="gd-card-text">${card.text}</div>${game.lastAction ? renderActionResult() : `<div class="gd-swipe-label">Swipe to Choose</div>`}<div class="gd-choice-row">${renderChoice("left", card.choices.left)}<div class="gd-or">OR</div>${renderChoice("right", card.choices.right)}</div></div></section>
    <div class="gd-result-toast">${game.result}</div>${renderHeroFooter()}
  </div>`;
}

function renderGhostLayer() {
  const ghosts = game.lastAction?.ghosts ?? [];
  if (!ghosts.length) return "";
  return `<div class="gd-ghost-layer">${ghosts.map((item, index) => {
    const x = 26 + index * 22;
    const y = 104 + (index % 2) * 26;
    return `<div class="gd-reward-ghost ${item.className}" style="--ghost-x:${x}%;--ghost-y:${y}px;--ghost-delay:${index * 130}ms"><span class="ghost-icon">${item.icon}</span><span class="ghost-text">${item.text}</span></div>`;
  }).join("")}</div>`;
}

function renderActionResult() {
  const action = game.lastAction;
  const label = formatOutcome(action.outcomeType);
  const readyClass = game.resultReady ? "ready" : "waiting";
  const prompt = game.resultReady ? "Tap to continue" : "Resolving...";
  return `<button class="gd-action-result ${action.outcomeType} ${readyClass}" data-ack-result ${game.resultReady ? "" : "disabled"}><div class="gd-roll-chip">d100<b>${action.roll}</b></div><div class="gd-result-icon">${RESULT_ICONS[action.outcomeType]}</div><div class="gd-result-copy"><div class="gd-result-heading">${label} · ${action.choiceLabel}</div><p>${action.text}</p><div class="gd-cooldown-pill">${prompt}</div></div></button>`;
}

function renderChoice(side, choiceData) {
  const thresholds = calculateThresholds(game.hero.stats[choiceData.stat], choiceData.difficulty);
  const locked = game.heroTimer <= 0 || game.awaitingResultAck;
  const chosen = game.lastAction?.side === side;
  return `<button class="gd-choice ${side} ${locked ? "locked" : ""} ${chosen ? "chosen wink-out" : ""}" data-choice="${side}" ${locked ? "disabled" : ""}><div class="gd-choice-title">${choiceData.label}</div><div class="gd-choice-mid"><div class="gd-choice-icon"><span>${STAT_ICONS[choiceData.stat]}</span></div><span>⌛ ${choiceData.timeCost}s</span></div><div class="gd-thresholds"><span class="gd-fail">☠ ${thresholds.red}</span><span class="gd-great">♛ ${thresholds.green}</span></div></button>`;
}

function renderHeroFooter() {
  return `<section class="gd-footer-chip slim"><img class="gd-portrait" src="${ART.goblinSmall}"><div><div class="gd-name">${game.hero.name}</div><div class="gd-status">◉ ${game.hero.status}</div></div><div class="gd-resource">Gold ${game.hero.resourceValue}<br><b>Food ${game.hero.food}</b></div></section>`;
}

function renderHero() {
  const stats = Object.entries(game.hero.stats).map(([name, value]) => `<div class="gd-stat">${STAT_ICONS[name]}<br>${name}<b>${value}</b></div>`).join("");
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">⛑</div><div class="gd-title">Hero</div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section><section class="gd-panel gd-hero-card"><img class="gd-hero-art" src="${ART.goblinLarge}"><div><div class="gd-card-title">${game.hero.name}</div><div class="gd-status">◉ ${game.hero.status}</div><div class="gd-resource" style="text-align:left;margin-top:14px">Gold: <b>${game.hero.resourceValue}</b> · Food: <b>${game.hero.food}</b> · XP: <b>${game.hero.xp}</b></div><div class="gd-subtitle">Stealth / Theft / Escape</div></div></section><section class="gd-panel"><div class="gd-section-title">Stats</div><div class="gd-stat-grid">${stats}</div></section><section class="gd-panel"><div class="gd-section-title">Passive Ability</div><div class="gd-card-title" style="font-size:26px">${game.hero.passive.name}</div><div class="gd-card-text">${game.hero.passive.text}</div></section></div>`;
}

function renderParty() {
  const cardsHtml = game.party.map(p => `<div class="gd-party-card"><div class="role">${p.name}</div><div class="meta">⌖ ${p.region}<br>◉ ${p.status}<br>${p.resource}: <b>${p.value}</b></div></div>`).join("");
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">♟</div><div class="gd-title">Party</div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section><section class="gd-panel"><div class="gd-meter-grid"><div class="gd-meter"><div class="icon">💚</div><div class="value">${game.partyHealth}/10</div><div class="label">Party Health</div></div><div class="gd-meter"><div class="icon">☠</div><div class="value">${game.corruption}/20</div><div class="label">Corruption</div></div><div class="gd-meter"><div class="icon">♜</div><div class="value">${game.castleReadiness}/6</div><div class="label">Readiness</div></div></div></section><section class="gd-panel"><div class="gd-section-title">Overview</div><div class="gd-party-grid">${cardsHtml}</div></section><section class="gd-panel"><div class="gd-section-title">Current Objectives</div><div class="gd-objective-list"><div class="gd-objective">Cleanse Shrine <span style="float:right;color:var(--gd-green)">+2 Readiness</span></div><div class="gd-objective">Discover Secret Route <span style="float:right;color:var(--gd-green)">+2 Readiness</span></div><div class="gd-objective">Defeat Ogre <span style="float:right;color:var(--gd-green)">+1 Readiness</span></div></div></section></div>`;
}

function renderInventory() {
  const bagItems = game.hero.inventory.map(name => [name, inventoryText(name), inventoryIcon(name)]);
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">▣</div><div class="gd-title">Inventory</div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section><section class="gd-footer-chip"><img class="gd-portrait" src="${ART.goblinSmall}"><div><div class="gd-name">${game.hero.name}</div><div class="gd-status">◉ ${game.hero.status}</div></div><div class="gd-resource">Gold ${game.hero.resourceValue}<br><b>Food ${game.hero.food}</b></div></section><section class="gd-panel"><div class="gd-section-title">Equipped</div><div class="gd-item-row">${game.hero.equipment.map(item => `<div class="gd-item-card"><div>${item.slot}</div><img class="gd-item-icon" src="${item.icon}"><b>${item.name}</b><small>${item.text}</small></div>`).join("")}</div></section><section class="gd-panel"><div class="gd-section-title">Bag</div><div class="gd-party-grid">${bagItems.map(item => `<div class="gd-item-card"><div style="font-size:34px">${item[2]}</div><b>${item[0]}</b><small>${item[1]}</small></div>`).join("")}</div></section><section class="gd-panel"><div class="gd-section-title">Item Details</div><div class="gd-hero-card"><img class="gd-hero-art" src="${ART.smoke}"><div><div class="gd-card-title" style="font-size:28px">Smoke Bomb</div><div class="gd-card-text">Once per match, when you would become Revealed, become Suspected instead.</div></div></div></section></div>`;
}

function inventoryText(name) {
  if (name.includes("Route") || name.includes("Tunnel")) return "Improves escape options.";
  if (name.includes("Herbs")) return "Can restore health later.";
  if (name.includes("Lockpick")) return "Helps with locked events.";
  if (name.includes("Cloak")) return "Improves stealth opportunities.";
  return "Useful stolen gear.";
}
function inventoryIcon(name) {
  if (name.includes("Key") || name.includes("Lock")) return "🗝";
  if (name.includes("Herbs")) return "✚";
  if (name.includes("Route") || name.includes("Tunnel")) return "↝";
  if (name.includes("Horn")) return "♬";
  if (name.includes("Cloak")) return "◒";
  return "▣";
}

function renderLog() {
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">☰</div><div class="gd-title">Log</div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section><section class="gd-panel"><div class="gd-section-title">Recent Events</div><div class="gd-log-list">${game.log.slice(0, 12).map(l => `<div class="gd-log-entry">${l}</div>`).join("")}</div><button class="gd-choice right" data-reset style="margin-top:14px;min-height:60px;width:100%"><div class="gd-choice-title">Reset Prototype</div></button></section></div>`;
}

const commandCards = [
  { id: "send_scout", title: "Send Scout", cost: 2, icon: "👁", effect: "Seed Scout into a region.", seedCardId: "scout_sniffs_path" },
  { id: "seal_road", title: "Seal the Road", cost: 3, icon: "⛓", effect: "Bury an exit. Add Sealed Road." },
  { id: "dispatch_priest", title: "Dispatch Priest", cost: 4, icon: "☠", effect: "Seed Priest into a magic or suspected region." },
  { id: "summon_ogre", title: "Summon Ogre", cost: 5, icon: "♜", effect: "Seed Ogre into a revealed region." },
];

function renderDarkLord() {
  const regionNodes = Object.values(game.regions).map(region => `<div class="gd-region-node ${region.id === "castle" ? "castle" : region.id === "village" ? "village" : region.id === "swamp" ? "swamp" : region.id === "shrine" ? "shrine" : "road"}" data-region="${region.id}"><button><div class="name">${region.name}</div><div class="state">${region.state}</div><div class="signals">${signalIcons(region.signals)} ${region.deck?.length ? `▣ ${region.deck.length}` : ""} ${region.pending?.length ? "◇ " + region.pending.join(" · ") : ""}</div></button></div>`).join("");
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">☠</div><div><div class="gd-title">Dark Lord</div><div class="gd-subtitle">Evil Energy ${game.darkLord.evilEnergy}/${game.darkLord.maxEvilEnergy}</div></div></div>${timerRing(game.darkLordTimer, "dark", "Planning")}<div></div></section><section class="gd-dark-map"><div class="gd-map-path"></div>${regionNodes}</section><div class="gd-pending">${game.selectedCommand ? "Choose a region for " + commandCards.find(c => c.id === game.selectedCommand).title : "Tap a command, then tap a region. Cards cost Evil Energy, not time."}</div><section class="gd-command-tray">${commandCards.map(c => `<button class="gd-command-card ${game.selectedCommand === c.id ? "selected" : ""}" data-command="${c.id}"><div class="gd-energy-cost">${c.cost}</div><div style="font-size:28px">${c.icon}</div><div class="title">${c.title}</div><div class="effect">${c.effect}</div></button>`).join("")}</section></div>`;
}

function signalIcons(signals = []) { return signals.map(s => ({ noise: "〰", magic: "✦", sighting: "◉", corruption: "☠" }[s] || "◇")).join(" "); }

function renderTabs() {
  const tabs = game.activeTab === "darklord" ? [["darklord", "✥", "Map"], ["explore", "▣", "Hero View"], ["log", "☰", "Log"]] : [["explore", "✥", "Explore"], ["hero", "⛑", "Hero"], ["party", "♟", "Party"], ["inventory", "▣", "Inventory"], ["log", "☰", "Log"]];
  return `<nav class="gd-tabs" style="grid-template-columns:repeat(${tabs.length},1fr)">${tabs.map(([id, icon, label]) => `<button class="gd-tab ${game.activeTab === id ? "active" : ""}" data-tab="${id}"><div class="gd-tab-icon">${icon}</div>${label}</button>`).join("")}</nav>`;
}

function bindEvents() {
  document.querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => choose(button.dataset.choice)));
  document.querySelectorAll("[data-ack-result]").forEach(button => button.addEventListener("click", acknowledgeResult));
  document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => setTab(button.dataset.tab)));
  document.querySelectorAll("[data-command]").forEach(button => button.addEventListener("click", () => selectCommand(button.dataset.command)));
  document.querySelectorAll("[data-region]").forEach(button => button.addEventListener("click", () => targetRegion(button.dataset.region)));
  document.querySelectorAll("[data-reset]").forEach(button => button.addEventListener("click", resetGame));
}

window.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") choose("left");
  if (event.key === "ArrowRight") choose("right");
  if (event.key === "Enter" || event.key === " ") acknowledgeResult();
  if (event.key.toLowerCase() === "d") setTab("darklord");
});

render();
startTimers();
