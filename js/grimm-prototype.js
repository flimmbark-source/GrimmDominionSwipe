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
const GHOST_META = {
  gold: { icon: "●", className: "gold" },
  damage: { icon: "♥", className: "damage" },
  status: { icon: "◉", className: "status" },
  noise: { icon: "〰", className: "noise" },
  item: { icon: "▣", className: "item" },
  xp: { icon: "✦", className: "xp" },
};

const initialGame = () => ({
  activeTab: "explore",
  heroTimer: 40,
  darkLordTimer: 60,
  selectedCommand: null,
  currentCardId: "scout_sniffs_path",
  pendingNextCardId: null,
  awaitingResultAck: false,
  lastAction: null,
  result: "Choose a path. The Scout is close enough to smell you.",
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
    village: { id: "village", name: "Village", subtitle: "The rooftops feel watched.", state: "Suspected", signals: ["noise"], pending: [] },
    swamp: { id: "swamp", name: "Swamp", subtitle: "Black water clings to the roots.", state: "Corrupted", signals: ["corruption"], pending: [] },
    shrine: { id: "shrine", name: "Forest Shrine", subtitle: "Old magic stirs beneath the stones.", state: "Hunted", signals: ["magic"], pending: [] },
    road: { id: "road", name: "Old Road", subtitle: "The road remembers every footprint.", state: "Hero Revealed", signals: ["sighting"], pending: [] },
    castle: { id: "castle", name: "Castle", subtitle: "The throne waits behind iron prayers.", state: "Quiet", signals: [], pending: [] },
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
  scout_sniffs_path: {
    id: "scout_sniffs_path",
    title: "Scout Sniffs the Path",
    art: ART.scout,
    text: "A crooked Scout freezes near the bushes, nose twitching. Its beady eyes flick your way — one sharp whiff and it’ll raise the alarm.",
    choices: {
      left: {
        label: "Hide in the ditch",
        stat: "stealth",
        difficulty: 3,
        timeCost: 4,
        outcomes: {
          failure: "The Scout howls. You become Revealed in the Village.",
          success: "You hide, but the Scout keeps sniffing nearby. Village remains Suspected.",
          great: "You slip past cleanly. The Scout loses your trail.",
        },
      },
      right: {
        label: "Kill it before it howls",
        stat: "combat",
        difficulty: 4,
        timeCost: 6,
        outcomes: {
          failure: "The Scout howls and claws you. Party Health drops by 1. You are Revealed.",
          success: "You kill the Scout, but the scuffle makes Noise in the Village.",
          great: "You kill the Scout silently. No signal reaches the Dark Lord.",
        },
      },
    },
  },
  locked_cottage: {
    id: "locked_cottage",
    title: "Locked Cottage",
    art: ART.scout,
    text: "A cottage door hangs crooked on iron hinges. Something valuable glints beneath the floorboards.",
    choices: {
      left: {
        label: "Pick the lock",
        stat: "cunning",
        difficulty: 3,
        timeCost: 5,
        outcomes: {
          failure: "The lock snaps loudly. Noise ripples across the Village.",
          success: "You pry it open and gain 1 Gold.",
          great: "You empty the hiding place quietly. Gain 2 Gold.",
        },
      },
      right: {
        label: "Listen first",
        stat: "stealth",
        difficulty: 2,
        timeCost: 3,
        outcomes: {
          failure: "Floorboards creak. The Village stays Suspected.",
          success: "You hear patrols outside and avoid the worst path.",
          great: "You hear a hidden route. Your next exit will be safer.",
        },
      },
    },
  },
};

const commandCards = [
  { id: "send_scout", title: "Send Scout", cost: 2, icon: "👁", effect: "Seed Scout into a region." },
  { id: "seal_road", title: "Seal the Road", cost: 3, icon: "⛓", effect: "Bury an exit. Add Sealed Road." },
  { id: "dispatch_priest", title: "Dispatch Priest", cost: 4, icon: "☠", effect: "Seed Priest into a magic or suspected region." },
  { id: "summon_ogre", title: "Summon Ogre", cost: 5, icon: "♜", effect: "Seed Ogre into a revealed region." },
];

let game = initialGame();
let intervalId = null;

function calculateThresholds(statValue, difficulty) {
  const advantage = statValue - difficulty;
  const red = clamp(35 - advantage * 10, 5, 85);
  const green = clamp(Math.max(red + 10, 65 - advantage * 10), red + 10, 95);
  return { red, green };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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
  const choice = card.choices[side];
  const outcome = rollOutcome(choice);
  const nextCardId = game.currentCardId === "scout_sniffs_path" ? "locked_cottage" : "scout_sniffs_path";

  game.heroTimer = Math.max(0, game.heroTimer - choice.timeCost);
  const ghosts = applyOutcome(card.id, side, choice, outcome);
  game.awaitingResultAck = true;
  game.pendingNextCardId = nextCardId;
  game.lastAction = {
    side,
    choiceLabel: choice.label,
    outcomeType: outcome.type,
    roll: outcome.roll,
    red: outcome.red,
    green: outcome.green,
    text: choice.outcomes[outcome.type],
    ghosts,
  };
  game.result = `<strong>${formatOutcome(outcome.type)} · d100 ${outcome.roll}</strong><br>${choice.outcomes[outcome.type]}`;
  game.log.unshift(`${card.title}: ${formatOutcome(outcome.type)} on ${choice.label} (${outcome.roll}).`);
  render();
}

function acknowledgeResult() {
  if (!game.awaitingResultAck || !game.pendingNextCardId) return;
  game.currentCardId = game.pendingNextCardId;
  game.pendingNextCardId = null;
  game.awaitingResultAck = false;
  game.lastAction = null;
  game.result = "Choose your next path.";
  render();
}

function applyOutcome(cardId, side, choice, outcome) {
  const ghosts = [];
  const type = outcome.type;

  if (type === "failure") {
    if (choice.stat === "combat") {
      game.partyHealth = Math.max(0, game.partyHealth - 1);
      ghosts.push(ghost("damage", "-1 Health"));
    }
    game.hero.status = "Revealed";
    game.regions.village.state = "Hero Revealed";
    if (!game.regions.village.signals.includes("sighting")) game.regions.village.signals.push("sighting");
    ghosts.push(ghost("status", "Revealed"));
  }

  if (type === "success") {
    if (cardId === "locked_cottage" && side === "left") {
      game.hero.resourceValue += 1;
      ghosts.push(ghost("gold", "+1 Gold"));
    }
    if (!game.regions.village.signals.includes("noise")) game.regions.village.signals.push("noise");
    ghosts.push(ghost("noise", "Noise"));
  }

  if (type === "great") {
    if (cardId === "locked_cottage" && side === "left") {
      game.hero.resourceValue += 2;
      ghosts.push(ghost("gold", "+2 Gold"));
    }
    if (cardId === "locked_cottage" && side === "right") ghosts.push(ghost("item", "Safe Route"));
    if (choice.stat === "stealth") {
      game.hero.status = "Hidden";
      ghosts.push(ghost("status", "Hidden"));
    }
    if (cardId === "scout_sniffs_path" && side === "right") ghosts.push(ghost("xp", "Silent Kill"));
  }

  return ghosts.length ? ghosts : [ghost(type === "failure" ? "damage" : "xp", formatOutcome(type))];
}

function formatOutcome(type) {
  return type === "great" ? "Great Success" : type[0].toUpperCase() + type.slice(1);
}

function tick() {
  game.darkLordTimer = Math.max(0, game.darkLordTimer - 1);
  if (!game.awaitingResultAck) game.heroTimer = Math.max(0, game.heroTimer - 1);

  if (game.darkLordTimer === 0) {
    resolveDarkLordPlan();
    game.darkLordTimer = 60;
    game.heroTimer = 40;
    game.awaitingResultAck = false;
    game.pendingNextCardId = null;
    game.lastAction = null;
  }
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

function selectCommand(id) {
  game.selectedCommand = game.selectedCommand === id ? null : id;
  render();
}

function targetRegion(regionId) {
  if (!game.selectedCommand) return;
  const card = commandCards.find(c => c.id === game.selectedCommand);
  if (!card || card.cost > game.darkLord.evilEnergy) return;
  game.darkLord.evilEnergy -= card.cost;
  game.darkLord.pending.push({ card, regionId });
  game.regions[regionId].pending = [...(game.regions[regionId].pending || []), card.title];
  game.log.unshift(`Dark Lord plans ${card.title} on ${game.regions[regionId].name}.`);
  game.selectedCommand = null;
  render();
}

function setTab(tab) {
  game.activeTab = tab;
  render();
}

function resetGame() {
  game = initialGame();
  render();
}

function startTimers() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(tick, 1000);
}

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
    <section class="gd-region-header">
      <div class="gd-region-line"><div class="gd-emblem">⌂</div><div><div class="gd-region-title">${region.name}</div><div class="gd-subtitle">${region.subtitle}</div></div></div>
      <div class="gd-pill">◉ ${region.state}</div>
    </section>
    <section class="gd-card">
      <div class="gd-timer gd-card-timer">${game.heroTimer}s</div>
      ${renderGhostLayer()}
      <div class="gd-card-art" style="background-image:url('${card.art}')"></div>
      <div class="gd-card-body">
        <div class="gd-card-title">${card.title}</div>
        <div class="gd-card-text">${card.text}</div>
        ${game.lastAction ? renderActionResult() : `<div class="gd-swipe-label">Swipe to Choose</div>`}
        <div class="gd-choice-row">${renderChoice("left", card.choices.left)}<div class="gd-or">OR</div>${renderChoice("right", card.choices.right)}</div>
      </div>
    </section>
    <div class="gd-result-toast">${game.result}</div>
    ${renderHeroFooter()}
  </div>`;
}

function renderGhostLayer() {
  const ghosts = game.lastAction?.ghosts ?? [];
  if (!ghosts.length) return "";
  return `<div class="gd-ghost-layer">${ghosts.map((item, index) => {
    const x = 32 + index * 23;
    const y = 112 + (index % 2) * 26;
    return `<div class="gd-reward-ghost ${item.className}" style="--ghost-x:${x}%;--ghost-y:${y}px;--ghost-delay:${index * 130}ms"><span class="ghost-icon">${item.icon}</span><span class="ghost-text">${item.text}</span></div>`;
  }).join("")}</div>`;
}

function renderActionResult() {
  const action = game.lastAction;
  const label = formatOutcome(action.outcomeType);
  return `<button class="gd-action-result ${action.outcomeType}" data-ack-result>
    <div class="gd-roll-chip">d100<b>${action.roll}</b></div>
    <div class="gd-result-icon">${RESULT_ICONS[action.outcomeType]}</div>
    <div class="gd-result-copy">
      <div class="gd-result-heading">${label} · ${action.choiceLabel}</div>
      <p>${action.text}</p>
      <div class="gd-cooldown-pill">Tap to continue</div>
    </div>
  </button>`;
}

function renderChoice(side, choice) {
  const thresholds = calculateThresholds(game.hero.stats[choice.stat], choice.difficulty);
  const locked = game.heroTimer <= 0 || game.awaitingResultAck;
  const chosen = game.lastAction?.side === side;
  return `<button class="gd-choice ${side} ${locked ? "locked" : ""} ${chosen ? "chosen wink-out" : ""}" data-choice="${side}" ${locked ? "disabled" : ""}>
    <div class="gd-choice-title">${choice.label}</div>
    <div class="gd-choice-mid"><div class="gd-choice-icon"><span>${STAT_ICONS[choice.stat]}</span></div><span>⌛ ${choice.timeCost}s</span></div>
    <div class="gd-thresholds"><span class="gd-fail">☠ ${thresholds.red}</span><span class="gd-great">♛ ${thresholds.green}</span></div>
  </button>`;
}

function renderHeroFooter() {
  return `<section class="gd-footer-chip slim"><img class="gd-portrait" src="${ART.goblinSmall}"><div><div class="gd-name">${game.hero.name}</div><div class="gd-status">◉ ${game.hero.status}</div></div><div class="gd-resource">${game.hero.resourceName}<br><b>${game.hero.resourceValue}</b></div></section>`;
}

function renderHero() {
  const stats = Object.entries(game.hero.stats).map(([name, value]) => `<div class="gd-stat">${STAT_ICONS[name]}<br>${name}<b>${value}</b></div>`).join("");
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">⛑</div><div class="gd-title">Hero</div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section><section class="gd-panel gd-hero-card"><img class="gd-hero-art" src="${ART.goblinLarge}"><div><div class="gd-card-title">${game.hero.name}</div><div class="gd-status">◉ ${game.hero.status}</div><div class="gd-resource" style="text-align:left;margin-top:14px">${game.hero.resourceName}: <b>${game.hero.resourceValue}</b></div><div class="gd-subtitle">Stealth / Theft / Escape</div></div></section><section class="gd-panel"><div class="gd-section-title">Stats</div><div class="gd-stat-grid">${stats}</div></section><section class="gd-panel"><div class="gd-section-title">Passive Ability</div><div class="gd-card-title" style="font-size:26px">${game.hero.passive.name}</div><div class="gd-card-text">${game.hero.passive.text}</div></section></div>`;
}

function renderParty() {
  const cardsHtml = game.party.map(p => `<div class="gd-party-card"><div class="role">${p.name}</div><div class="meta">⌖ ${p.region}<br>◉ ${p.status}<br>${p.resource}: <b>${p.value}</b></div></div>`).join("");
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">♟</div><div class="gd-title">Party</div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section><section class="gd-panel"><div class="gd-meter-grid"><div class="gd-meter"><div class="icon">💚</div><div class="value">${game.partyHealth}/10</div><div class="label">Party Health</div></div><div class="gd-meter"><div class="icon">☠</div><div class="value">${game.corruption}/20</div><div class="label">Corruption</div></div><div class="gd-meter"><div class="icon">♜</div><div class="value">${game.castleReadiness}/6</div><div class="label">Readiness</div></div></div></section><section class="gd-panel"><div class="gd-section-title">Overview</div><div class="gd-party-grid">${cardsHtml}</div></section><section class="gd-panel"><div class="gd-section-title">Current Objectives</div><div class="gd-objective-list"><div class="gd-objective">Cleanse Shrine <span style="float:right;color:var(--gd-green)">+2 Readiness</span></div><div class="gd-objective">Discover Secret Route <span style="float:right;color:var(--gd-green)">+2 Readiness</span></div><div class="gd-objective">Defeat Ogre <span style="float:right;color:var(--gd-green)">+1 Readiness</span></div></div></section></div>`;
}

function renderInventory() {
  const items = [["Softstep Boots", "Move silently.", "🥾"], ["Lockpick Set", "Open locked containers.", "🗝"], ["Throwing Knives", "Ranged damage.", "🔪"], ["Shadow Hood", "Harder to spot.", "🕶"], ["Rope Hook", "Reach high places.", "⚓"], ["Torch Kit", "Light the way.", "🔥"]];
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">▣</div><div class="gd-title">Inventory</div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section><section class="gd-footer-chip"><img class="gd-portrait" src="${ART.goblinSmall}"><div><div class="gd-name">${game.hero.name}</div><div class="gd-status">◉ ${game.hero.status}</div></div><div class="gd-resource">Gold<br><b>${game.hero.resourceValue}</b></div></section><section class="gd-panel"><div class="gd-section-title">Equipped</div><div class="gd-item-row">${game.hero.equipment.map(item => `<div class="gd-item-card"><div>${item.slot}</div><img class="gd-item-icon" src="${item.icon}"><b>${item.name}</b><small>${item.text}</small></div>`).join("")}</div></section><section class="gd-panel"><div class="gd-section-title">Bag</div><div class="gd-party-grid">${items.map(item => `<div class="gd-item-card"><div style="font-size:34px">${item[2]}</div><b>${item[0]}</b><small>${item[1]}</small></div>`).join("")}</div></section><section class="gd-panel"><div class="gd-section-title">Item Details</div><div class="gd-hero-card"><img class="gd-hero-art" src="${ART.smoke}"><div><div class="gd-card-title" style="font-size:28px">Smoke Bomb</div><div class="gd-card-text">Once per match, when you would become Revealed, become Suspected instead.</div></div></div></section></div>`;
}

function renderLog() {
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">☰</div><div class="gd-title">Log</div></div>${timerRing(game.heroTimer)}<div style="justify-self:end">${timerRing(game.darkLordTimer, "dark", "Dark Lord")}</div></section><section class="gd-panel"><div class="gd-section-title">Recent Events</div><div class="gd-log-list">${game.log.slice(0, 12).map(l => `<div class="gd-log-entry">${l}</div>`).join("")}</div><button class="gd-choice right" data-reset style="margin-top:14px;min-height:60px;width:100%"><div class="gd-choice-title">Reset Prototype</div></button></section></div>`;
}

function renderDarkLord() {
  const regionNodes = Object.values(game.regions).map(region => `<div class="gd-region-node ${region.id === "castle" ? "castle" : region.id === "village" ? "village" : region.id === "swamp" ? "swamp" : region.id === "shrine" ? "shrine" : "road"}" data-region="${region.id}"><button><div class="name">${region.name}</div><div class="state">${region.state}</div><div class="signals">${signalIcons(region.signals)} ${region.pending?.length ? "◇ " + region.pending.join(" · ") : ""}</div></button></div>`).join("");
  return `<div class="gd-main-scroll"><section class="gd-top"><div class="gd-region-line"><div class="gd-emblem">☠</div><div><div class="gd-title">Dark Lord</div><div class="gd-subtitle">Evil Energy ${game.darkLord.evilEnergy}/${game.darkLord.maxEvilEnergy}</div></div></div>${timerRing(game.darkLordTimer, "dark", "Planning")}<div></div></section><section class="gd-dark-map"><div class="gd-map-path"></div>${regionNodes}</section><div class="gd-pending">${game.selectedCommand ? "Choose a region for " + commandCards.find(c => c.id === game.selectedCommand).title : "Tap a command, then tap a region. Cards cost Evil Energy, not time."}</div><section class="gd-command-tray">${commandCards.map(c => `<button class="gd-command-card ${game.selectedCommand === c.id ? "selected" : ""}" data-command="${c.id}"><div class="gd-energy-cost">${c.cost}</div><div style="font-size:28px">${c.icon}</div><div class="title">${c.title}</div><div class="effect">${c.effect}</div></button>`).join("")}</section></div>`;
}

function signalIcons(signals = []) {
  return signals.map(s => ({ noise: "〰", magic: "✦", sighting: "◉", corruption: "☠" }[s] || "◇")).join(" ");
}

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
