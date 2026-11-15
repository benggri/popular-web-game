// Level-up cards and 2048-style spell tiers: picking a spell you already own doubles its tile (2 -> 4 -> 8 ...).

export const MAX_TIER = 64;

// names and descriptions live in src/i18n
export const SPELLS = ["bolt", "nova", "chain", "orb", "meteor"];
export const PASSIVES = ["tail", "swift", "magnet", "heart"];

/** log2 of a tier: 2 -> 1, 4 -> 2 ... 0 when the spell isn't owned. */
export const power = (tier) => (tier ? Math.log2(tier) : 0);

export function createLoadout() {
  return { spells: { bolt: 2 }, passives: { tail: 0, swift: 0, magnet: 0, heart: 0 } };
}

/** Up to n distinct cards the player can still take, picked with rng() in [0, 1). */
export function offerCards(loadout, rng, n = 3) {
  const pool = [];
  for (const id of SPELLS) {
    const tier = loadout.spells[id] ?? 0;
    if (tier < MAX_TIER) pool.push({ kind: "spell", id, from: tier, to: tier ? tier * 2 : 2 });
  }
  for (const id of PASSIVES) pool.push({ kind: "passive", id, from: loadout.passives[id], to: loadout.passives[id] + 1 });
  const picks = [];
  while (picks.length < n && pool.length) picks.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return picks;
}

/** Applies a card in place. Returns true when it merged into an owned tile. */
export function applyCard(loadout, card) {
  if (card.kind === "spell") {
    const merged = !!loadout.spells[card.id];
    loadout.spells[card.id] = Math.min(MAX_TIER, card.to);
    return merged;
  }
  loadout.passives[card.id] += 1;
  return false;
}
