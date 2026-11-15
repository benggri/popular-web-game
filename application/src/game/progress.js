// Persistent progress between runs: gold, best score, and permanent upgrades whose price grows 15% per level.

const KEY = "ember-tail-save-v1";
const OFFLINE_CAP_MIN = 8 * 60;

export const UPGRADES = {
  might: { name: "위력", desc: "주문 피해 +10%", base: 30 },
  vitality: { name: "활력", desc: "최대 체력 +15", base: 25 },
  haste: { name: "신속", desc: "이동 속도 +5%", base: 40 },
  greed: { name: "탐욕", desc: "판마다 얻는 골드 +15%", base: 50 },
  forge: { name: "불씨 대장간", desc: "접속하지 않는 동안 분당 골드 +2", base: 120 },
};

export function defaultSave(now = Date.now()) {
  const upgrades = Object.fromEntries(Object.keys(UPGRADES).map((id) => [id, 0]));
  return { gold: 0, best: 0, runs: 0, upgrades, lastSeen: now };
}

export const costOf = (id, level) => Math.floor(UPGRADES[id].base * 1.15 ** level);

/** Buys one level of an upgrade. Returns the new save, or null when the gold isn't there. */
export function buy(save, id) {
  const cost = costOf(id, save.upgrades[id]);
  if (save.gold < cost) return null;
  return { ...save, gold: save.gold - cost, upgrades: { ...save.upgrades, [id]: save.upgrades[id] + 1 } };
}

/** Gold the forge made since lastSeen, capped at eight hours. */
export function offlineGold(save, now) {
  const minutes = Math.min(Math.max(0, (now - save.lastSeen) / 60000), OFFLINE_CAP_MIN);
  return Math.floor(minutes * save.upgrades.forge * 2);
}

/** Pays out the forge's offline gold and restarts the clock. Returns the new save and what was earned. */
export function settleOffline(save, now) {
  const earned = offlineGold(save, now);
  return { save: { ...save, gold: save.gold + earned, lastSeen: now }, earned };
}

/** Gold a finished run pays out, before it's added to the save. */
export function runGold(coins, upgrades) {
  return Math.floor(coins * (1 + 0.15 * upgrades.greed));
}

export function loadSave(storage, now = Date.now()) {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return defaultSave(now);
    const base = defaultSave(now), data = JSON.parse(raw);
    return { ...base, ...data, upgrades: { ...base.upgrades, ...data.upgrades } };
  } catch {
    return defaultSave(now);
  }
}

export function storeSave(storage, save) {
  try {
    storage?.setItem(KEY, JSON.stringify(save));
  } catch {
    // private mode or blocked storage: progress just won't persist
  }
}
