// Dark Lord model: hero visibility, region noise/corruption/threats, and a simple AI planner.
(() => {
  const THREATS = {
    whispering_idol: { title: "Whispering Idol", cardId: "whispering_idol", corruptionPerRound: 1 },
    plague_well: { title: "Plague Well", cardId: "plague_well", corruptionPerRound: 1 },
    bloodroot: { title: "Bloodroot", cardId: "bloodroot", corruptionPerRound: 1 },
    grave_bell: { title: "Grave Bell", cardId: "grave_bell", corruptionPerRound: 1, noisePerRound: 1 },
  };

  const COMMANDS = {
    send_scout: { id: "send_scout", title: "Send Scout", cost: 2, seedCardId: "scout_sniffs_path" },
    release_hounds: { id: "release_hounds", title: "Release Hounds", cost: 4, seedCardId: "hound_pack" },
    seal_exits: { id: "seal_exits", title: "Seal Exits", cost: 3, seedCardId: "sealed_exit" },
    plant_whispering_idol: { id: "plant_whispering_idol", title: "Plant Whispering Idol", cost: 4, threatId: "whispering_idol" },
    poison_well: { id: "poison_well", title: "Poison the Well", cost: 5, threatId: "plague_well" },
    grow_bloodroot: { id: "grow_bloodroot", title: "Grow Bloodroot", cost: 4, threatId: "bloodroot" },
    raise_grave_bell: { id: "raise_grave_bell", title: "Raise Grave Bell", cost: 4, threatId: "grave_bell" },
    wither_supplies: { id: "wither_supplies", title: "Wither Supplies", cost: 3, seedCardId: "withered_supplies" },
    rot_luck: { id: "rot_luck", title: "Rot Luck", cost: 4, seedCardId: "rot_luck" },
  };

  const noiseLabel = n => n >= 10 ? "Lockdown" : n >= 7 ? "Search Party" : n >= 4 ? "Alarmed" : n >= 2 ? "Suspicious" : "Quiet";
  const corruptionLabel = n => n >= 5 ? "Dominion" : n >= 3 ? "Corrupted" : n >= 1 ? "Tainted" : "Clean";

  function ensureDarkLordState() {
    game.hero.visibility ||= { state: "hidden", currentRegionId: game.hero.regionId, lastKnownRegionId: null, markedTurns: 0 };
    game.hero.visibility.currentRegionId = game.hero.regionId;
    Object.values(game.regions || {}).forEach(region => {
      region.noise = Math.max(0, region.noise || 0);
      region.corruption = Math.max(0, region.corruption || 0);
      region.threats ||= [];
    });
  }

  function setHeroVisibility(state, regionId = game.hero.regionId) {
    ensureDarkLordState();
    game.hero.visibility.state = state;
    if (["suspected", "revealed", "marked", "hunted"].includes(state)) game.hero.visibility.lastKnownRegionId = regionId;
    const region = game.regions[regionId];
    if (region && ["revealed", "marked", "hunted"].includes(state)) {
      if (!region.signals.includes("sighting")) region.signals.push("sighting");
      region.state = "Hero Revealed";
    }
  }

  function regionNoise(regionId, amount = 2) {
    ensureDarkLordState();
    const region = game.regions[regionId];
    if (!region) return;
    region.noise = Math.max(0, Math.min(10, (region.noise || 0) + amount));
    if (!region.signals.includes("noise")) region.signals.push("noise");
    if (region.noise >= 4 && game.hero.visibility.state === "hidden") setHeroVisibility("suspected", regionId);
    if (region.noise >= 7 && game.hero.regionId === regionId) setHeroVisibility("revealed", regionId);
  }

  function addThreatToRegion(regionId, threatId) {
    ensureDarkLordState();
    const region = game.regions[regionId];
    const threat = THREATS[threatId];
    if (!region || !threat) return false;
    if (!region.threats.some(active => active.id === threatId)) {
      region.threats.push({ id: threatId, turnsActive: 0 });
      addCardToRegionDeck(regionId, threat.cardId);
      game.log.unshift(`${threat.title} takes root in ${region.name}.`);
    }
    return true;
  }

  function removeThreatFromRegion(regionId, threatId) {
    ensureDarkLordState();
    const region = game.regions[regionId];
    const threat = THREATS[threatId];
    if (!region || !threat) return;
    region.threats = region.threats.filter(active => active.id !== threatId);
    region.corruption = Math.max(0, region.corruption - 1);
    region.deck = (region.deck || []).filter(cardId => cardId !== threat.cardId);
    game.log.unshift(`${threat.title} is destroyed in ${region.name}.`);
  }

  function resolveRegionThreats() {
    ensureDarkLordState();
    Object.values(game.regions).forEach(region => {
      (region.threats || []).forEach(active => {
        const threat = THREATS[active.id];
        if (!threat) return;
        active.turnsActive = (active.turnsActive || 0) + 1;
        region.corruption = Math.min(6, region.corruption + (threat.corruptionPerRound || 0));
        if (threat.noisePerRound) regionNoise(region.id, threat.noisePerRound);
      });
      region.noise = Math.max(0, region.noise - 1);
      if (region.noise === 0) region.signals = (region.signals || []).filter(signal => signal !== "noise");
    });
    const corrupted = Object.values(game.regions).filter(region => region.corruption >= 3).length;
    if (corrupted) {
      game.darkLord.evilEnergy = Math.min(game.darkLord.maxEvilEnergy, game.darkLord.evilEnergy + corrupted * 2);
      game.log.unshift(`Corrupted regions feed the Dark Lord +${corrupted * 2} Evil Energy.`);
    }
  }

  function scoreRegion(region) {
    const knownHere = game.hero.visibility?.lastKnownRegionId === region.id && ["revealed", "marked", "hunted"].includes(game.hero.visibility?.state) ? 8 : 0;
    return region.noise * 2 + region.corruption + (region.threats?.length || 0) + knownHere;
  }

  function bestRegion(mode = "pressure") {
    const regions = Object.values(game.regions).filter(region => region.id !== "castle");
    if (mode === "revealed" && game.hero.visibility?.lastKnownRegionId) return game.regions[game.hero.visibility.lastKnownRegionId] || regions[0];
    if (mode === "low_corruption") return [...regions].sort((a, b) => a.corruption - b.corruption)[0];
    return [...regions].sort((a, b) => scoreRegion(b) - scoreRegion(a))[0];
  }

  function planCommand(commandId, regionId) {
    const command = COMMANDS[commandId];
    const region = game.regions[regionId];
    if (!command || !region || game.darkLord.evilEnergy < command.cost) return false;
    game.darkLord.evilEnergy -= command.cost;
    if (command.threatId) addThreatToRegion(regionId, command.threatId);
    if (command.seedCardId) addCardToRegionDeck(regionId, command.seedCardId);
    region.pending = [...(region.pending || []), command.title];
    game.darkLord.pending.push({ card: command, regionId });
    game.log.unshift(`Dark Lord plans ${command.title} on ${region.name}.`);
    return true;
  }

  function chooseAiDarkLordPlan() {
    ensureDarkLordState();
    let plan;
    if (["revealed", "marked", "hunted"].includes(game.hero.visibility.state)) {
      const r = bestRegion("revealed"); plan = [["release_hounds", r.id], ["seal_exits", r.id], ["raise_grave_bell", r.id]];
    } else if (Object.values(game.regions).some(r => r.noise >= 4)) {
      const r = bestRegion(); plan = [["send_scout", r.id], ["raise_grave_bell", r.id]];
    } else if ((game.hero.food || 0) >= 3) {
      const r = bestRegion(); plan = [["poison_well", r.id], ["wither_supplies", r.id]];
    } else if ((game.hero.knowledge || []).length >= 3) {
      const r = bestRegion(); plan = [["rot_luck", r.id], ["grow_bloodroot", r.id]];
    } else {
      const r = bestRegion("low_corruption"); plan = [["plant_whispering_idol", r.id], ["send_scout", r.id]];
    }
    plan.forEach(([id, regionId]) => planCommand(id, regionId));
  }

  const baseApplyRewards = applyRewards;
  window.applyRewards = function applyRewards(rewards = []) {
    const result = baseApplyRewards(rewards);
    rewards.forEach(reward => {
      if (reward.type === "noise") regionNoise(game.hero.regionId, reward.amount || 2);
      if (reward.type === "status" && reward.value === "Revealed") setHeroVisibility("revealed", game.hero.regionId);
      if (reward.type === "status" && reward.value === "Hidden" && game.hero.visibility?.state !== "marked") game.hero.visibility.state = "hidden";
    });
    return result;
  };
  applyRewards = window.applyRewards;

  const baseResolveDarkLordPlan = resolveDarkLordPlan;
  window.resolveDarkLordPlan = function resolveDarkLordPlan() {
    chooseAiDarkLordPlan();
    baseResolveDarkLordPlan();
    resolveRegionThreats();
  };
  resolveDarkLordPlan = window.resolveDarkLordPlan;

  Object.assign(window, { DARK_THREATS: THREATS, DARK_COMMANDS: COMMANDS, ensureDarkLordState, setHeroVisibility, regionNoise, addThreatToRegion, removeThreatFromRegion, resolveRegionThreats, chooseAiDarkLordPlan, noiseLabel, corruptionLabel });
  ensureDarkLordState();
  render?.();
})();
