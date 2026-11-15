// Level-up cards and 2048-style spell tiers: picking a spell you already own doubles its tile (2 -> 4 -> 8 ...).

export const MAX_TIER = 64;

export const SPELLS = {
  bolt: { name: "불씨 화살", desc: "가장 가까운 적에게 불덩이를 쏩니다." },
  nova: { name: "서리 폭발", desc: "주변에 얼음 고리를 터뜨려 적을 느리게 합니다." },
  chain: { name: "연쇄 번개", desc: "번개가 적에서 적으로 튑니다." },
  orb: { name: "비전 궤도", desc: "구슬이 주위를 돌며 적을 갈아냅니다." },
  meteor: { name: "메테오", desc: "적 무리 위로 불타는 바위를 떨어뜨립니다." },
};

export const PASSIVES = {
  tail: { name: "긴 꼬리", desc: "꼬리 불씨 +2. 꼬리에 닿은 적이 탑니다." },
  swift: { name: "순풍", desc: "이동 속도 +12%" },
  magnet: { name: "자석", desc: "획득 범위 +40%" },
  heart: { name: "장작", desc: "최대 체력 +20, 체력 완전 회복" },
};

/** log2 of a tier: 2 -> 1, 4 -> 2 ... 0 when the spell isn't owned. */
export const power = (tier) => (tier ? Math.log2(tier) : 0);

export function createLoadout() {
  return { spells: { bolt: 2 }, passives: { tail: 0, swift: 0, magnet: 0, heart: 0 } };
}

/** Up to n distinct cards the player can still take, picked with rng() in [0, 1). */
export function offerCards(loadout, rng, n = 3) {
  const pool = [];
  for (const id of Object.keys(SPELLS)) {
    const tier = loadout.spells[id] ?? 0;
    if (tier < MAX_TIER) pool.push({ kind: "spell", id, from: tier, to: tier ? tier * 2 : 2 });
  }
  for (const id of Object.keys(PASSIVES)) pool.push({ kind: "passive", id, from: loadout.passives[id], to: loadout.passives[id] + 1 });
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
