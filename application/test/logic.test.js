import { describe, it, expect } from "vitest";
import { createLoadout, offerCards, applyCard, power, MAX_TIER } from "../src/game/runes.js";
import { defaultSave, buy, costOf, offlineGold, settleOffline, runGold, loadSave, storeSave } from "../src/game/progress.js";
import { createRun, mergeFarGems } from "../src/game/world.js";

const seq = (...xs) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

describe("runes", () => {
  it("doubles an owned spell tile like 2048", () => {
    const l = createLoadout();
    const merged = applyCard(l, { kind: "spell", id: "bolt", from: 2, to: 4 });
    expect(merged).toBe(true);
    expect(l.spells.bolt).toBe(4);
    expect(power(l.spells.bolt)).toBe(2);
  });

  it("adds a new spell at tier 2 without merging", () => {
    const l = createLoadout();
    expect(applyCard(l, { kind: "spell", id: "nova", from: 0, to: 2 })).toBe(false);
    expect(l.spells.nova).toBe(2);
  });

  it("offers distinct cards and skips maxed spells", () => {
    const l = createLoadout();
    l.spells.bolt = MAX_TIER;
    const cards = offerCards(l, seq(0, 0, 0), 3);
    expect(cards).toHaveLength(3);
    expect(new Set(cards.map((c) => c.id)).size).toBe(3);
    expect(cards.some((c) => c.id === "bolt")).toBe(false);
  });

  it("counts passive levels", () => {
    const l = createLoadout();
    applyCard(l, { kind: "passive", id: "tail" });
    applyCard(l, { kind: "passive", id: "tail" });
    expect(l.passives.tail).toBe(2);
  });
});

describe("progress", () => {
  it("prices grow 15% per level", () => {
    expect(costOf("might", 0)).toBe(30);
    expect(costOf("might", 1)).toBe(34);
    expect(costOf("might", 10)).toBe(Math.floor(30 * 1.15 ** 10));
  });

  it("buys only with enough gold", () => {
    const s = { ...defaultSave(0), gold: 40 };
    const next = buy(s, "might");
    expect(next.gold).toBe(10);
    expect(next.upgrades.might).toBe(1);
    expect(buy(next, "might")).toBeNull();
  });

  it("spends a boss ticket before gold", () => {
    const s = { ...defaultSave(0), gold: 0, freeBuys: 2 };
    const once = buy(s, "forge");
    expect(once.upgrades.forge).toBe(1);
    expect(once.freeBuys).toBe(1);
    expect(once.gold).toBe(0);
    const twice = buy(once, "might");
    expect(twice.freeBuys).toBe(0);
    expect(buy(twice, "might")).toBeNull();
  });

  it("old saves load with no free tickets", () => {
    const storage = { getItem: () => JSON.stringify({ gold: 5, upgrades: {} }) };
    expect(loadSave(storage).freeBuys).toBe(0);
  });

  it("forge earns while away, capped at eight hours", () => {
    const s = defaultSave(0);
    s.upgrades.forge = 2;
    expect(offlineGold(s, 10 * 60000)).toBe(40);
    expect(offlineGold(s, 24 * 60 * 60000)).toBe(8 * 60 * 4);
    expect(offlineGold({ ...s, upgrades: { ...s.upgrades, forge: 0 } }, 60000)).toBe(0);
  });

  it("settling pays the forge once and restarts the clock", () => {
    const s = defaultSave(0);
    s.upgrades.forge = 1;
    const first = settleOffline(s, 5 * 60000);
    expect(first.earned).toBe(10);
    expect(first.save.gold).toBe(10);
    expect(first.save.lastSeen).toBe(5 * 60000);
    expect(settleOffline(first.save, 5 * 60000).earned).toBe(0);
  });

  it("greed boosts run gold", () => {
    expect(runGold(100, { greed: 2 })).toBe(130);
  });

  it("round-trips through storage and survives broken data", () => {
    const mem = new Map();
    const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
    const s = { ...defaultSave(5), gold: 77 };
    storeSave(storage, s);
    expect(loadSave(storage).gold).toBe(77);
    mem.set("ember-tail-save-v1", "{nope");
    expect(loadSave(storage, 9).gold).toBe(0);
    expect(loadSave({ getItem: () => { throw new Error("blocked"); } }).gold).toBe(0);
  });
});

describe("world", () => {
  const gem = (x, value = 1) => ({ kind: "gem", x, y: 0, value, t: 0 });

  it("merges the farthest gems into one, keeping their xp", () => {
    const run = createRun(defaultSave(0));
    run.pickups = Array.from({ length: 150 }, (_, i) => gem(i + 1));
    mergeFarGems(run);
    expect(run.pickups).toHaveLength(51);
    expect(run.pickups.reduce((s, g) => s + g.value, 0)).toBe(150);
  });

  it("leaves a floor with nothing to merge alone", () => {
    const run = createRun(defaultSave(0));
    run.pickups = Array.from({ length: 401 }, () => ({ kind: "coin", x: 50, y: 0, value: 1, t: 0 }));
    expect(() => mergeFarGems(run)).not.toThrow();
    expect(run.pickups).toHaveLength(401);
  });
});
