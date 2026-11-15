// A run's state, the player, pickups and the helpers every system shares (spatial grid, damage, kills).

import { PLAYER, ENEMIES, BOSS_EVERY, DROPS, xpToNext } from "./config.js";
import { createLoadout } from "./runes.js";

const CELL = 32;
// a dark poof, so a kill doesn't white out the swarm around it
const SOOT = ["#120e1a", "#211a2e", "#342a44", "#4c3f60", "#6a5a82", "#8e7ea8"];

export function createRun(save) {
  const u = save.upgrades;
  return {
    t: 0,
    kills: 0,
    coins: 0,
    level: 1,
    xp: 0,
    xpNext: xpToNext(1),
    pendingLevels: 0,
    over: false,
    bonus: { dmg: 1 + 0.1 * u.might, speed: 1 + 0.05 * u.haste, hp: 15 * u.vitality },
    loadout: createLoadout(),
    player: {
      x: 0, y: 0, vx: 0, vy: 0, dirX: 1, dirY: 0,
      hp: PLAYER.hp + 15 * u.vitality, maxHp: PLAYER.hp + 15 * u.vitality,
      hurt: 0, dash: 0, dashCd: 0,
      trail: [{ x: 0, y: 0 }],
    },
    enemies: [],
    projectiles: [],
    pickups: [],
    delayed: [],
    cds: {},
    orbAngle: 0,
    spawnAcc: 0,
    nextBoss: BOSS_EVERY,
    shake: 0,
    alert: null,
    grid: new Map(),
  };
}

// ---- spatial grid over enemies, rebuilt every tick

const key = (cx, cy) => (cx + 32768) * 65536 + (cy + 32768);

export function rebuildGrid(run) {
  run.grid.clear();
  for (const e of run.enemies) {
    const k = key(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
    let cell = run.grid.get(k);
    if (!cell) run.grid.set(k, (cell = []));
    cell.push(e);
  }
}

/** Calls fn(e) for live enemies whose bodies overlap the circle (x, y, r). */
export function eachNear(run, x, y, r, fn) {
  const reach = r + 20, x0 = Math.floor((x - reach) / CELL), x1 = Math.floor((x + reach) / CELL);
  const y0 = Math.floor((y - reach) / CELL), y1 = Math.floor((y + reach) / CELL);
  for (let cx = x0; cx <= x1; cx++)
    for (let cy = y0; cy <= y1; cy++) {
      const cell = run.grid.get(key(cx, cy));
      if (!cell) continue;
      for (const e of cell) {
        if (e.hp <= 0) continue;
        const rr = r + e.radius;
        if ((e.x - x) ** 2 + (e.y - y) ** 2 <= rr * rr) fn(e);
      }
    }
}

export function nearestEnemy(run, x, y, maxDist = Infinity, skip = null) {
  let best = null, bd = maxDist * maxDist;
  for (const e of run.enemies) {
    if (e.hp <= 0 || skip?.has(e)) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}

// ---- damage and kills

export function hurtEnemy(run, fx, e, dmg, push = 0, fromX = run.player.x, fromY = run.player.y) {
  if (e.hp <= 0) return;
  e.hp -= dmg;
  e.flash = 0.09;
  fx.number(e.x, e.y, Math.max(1, Math.round(dmg)));
  if (push && !ENEMIES[e.kind].boss) {
    const dx = e.x - fromX, dy = e.y - fromY, l = Math.hypot(dx, dy) || 1;
    e.kx += (dx / l) * push;
    e.ky += (dy / l) * push;
  }
  if (e.hp <= 0) killEnemy(run, fx, e);
}

function killEnemy(run, fx, e) {
  const def = ENEMIES[e.kind];
  run.kills++;
  fx.spawn(def.boss ? "bigExplosion" : "poof", e.x, e.y + e.radius, def.boss ? { size: 0.8 } : { palette: SOOT });
  run.pickups.push({ kind: "gem", x: e.x, y: e.y, value: def.xp, t: 0 });
  if (def.boss) {
    for (let i = 0; i < 12; i++) run.pickups.push({ kind: "coin", x: e.x + rand(-30, 30), y: e.y + rand(-20, 20), value: 2, t: 0 });
    run.pickups.push({ kind: "heart", x: e.x, y: e.y + 12, value: 40, t: 0 });
    run.shake = 0.5;
    return;
  }
  if (Math.random() < DROPS.coin) run.pickups.push({ kind: "coin", x: e.x + 4, y: e.y, value: 1 + ((Math.random() * 3) | 0), t: 0 });
  if (Math.random() < DROPS.heart) run.pickups.push({ kind: "heart", x: e.x - 4, y: e.y, value: 25, t: 0 });
}

export const rand = (a, b) => a + Math.random() * (b - a);

// ---- the player

/** Moves the player toward the steering target (a view-space pointer turned to world space) or keys. */
export function updatePlayer(run, dt, steer, dashPressed, fx) {
  const p = run.player, lo = run.loadout.passives;
  const speed = PLAYER.speed * run.bonus.speed * (1 + 0.12 * lo.swift);
  let tx = 0, ty = 0;
  if (steer) {
    const dx = steer.x - p.x, dy = steer.y - p.y, d = Math.hypot(dx, dy);
    if (steer.dir) {
      tx = steer.x;
      ty = steer.y;
    } else if (d > 4) {
      const k = Math.min(1, d / 40);
      tx = (dx / d) * k;
      ty = (dy / d) * k;
    }
  }
  if (tx || ty) {
    const l = Math.hypot(tx, ty);
    p.dirX = tx / l;
    p.dirY = ty / l;
  }
  p.dashCd = Math.max(0, p.dashCd - dt);
  if (dashPressed && p.dashCd <= 0) {
    p.dash = PLAYER.dashFor;
    p.dashCd = PLAYER.dashCooldown;
  }
  const boost = p.dash > 0 ? PLAYER.dashSpeed : 1;
  const wantX = (p.dash > 0 ? p.dirX : tx) * speed * boost, wantY = (p.dash > 0 ? p.dirY : ty) * speed * boost;
  const ease = Math.min(1, dt * 12);
  p.vx += (wantX - p.vx) * ease;
  p.vy += (wantY - p.vy) * ease;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.dash = Math.max(0, p.dash - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  recordTrail(p, PLAYER.tailGap * tailLength(run) + 4);
  if (p.hp <= 0 && !run.over) {
    run.over = true;
    fx.spawn("implosion", p.x, p.y);
  }
}

export const tailLength = (run) => PLAYER.tailBase + 2 * run.loadout.passives.tail;

/** Keeps a breadcrumb path behind the player, long enough for the tail. */
function recordTrail(p, keep) {
  const head = p.trail[0];
  if (Math.hypot(p.x - head.x, p.y - head.y) >= 2) p.trail.unshift({ x: p.x, y: p.y });
  let len = 0;
  for (let i = 1; i < p.trail.length; i++) {
    len += Math.hypot(p.trail[i].x - p.trail[i - 1].x, p.trail[i].y - p.trail[i - 1].y);
    if (len > keep) {
      p.trail.length = i + 1;
      break;
    }
  }
}

/** Points spaced `gap` apart along the trail, nearest first. */
export function tailPoints(run) {
  const p = run.player, n = tailLength(run), out = [];
  let want = PLAYER.tailGap, len = 0;
  for (let i = 1; i < p.trail.length && out.length < n; i++) {
    const a = p.trail[i - 1], b = p.trail[i], seg = Math.hypot(b.x - a.x, b.y - a.y);
    while (len + seg >= want && out.length < n) {
      const u = (want - len) / seg;
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
      want += PLAYER.tailGap;
    }
    len += seg;
  }
  return out;
}

export function hurtPlayer(run, fx, dmg) {
  const p = run.player;
  if (p.hurt > 0 || p.dash > 0 || run.over) return;
  p.hp -= dmg;
  p.hurt = PLAYER.hurtFor;
  run.shake = Math.max(run.shake, 0.18);
  fx.number(p.x, p.y, dmg, "hurt");
  fx.spawn("hitSpark", p.x, p.y + 6);
}

// ---- pickups and levels

export function updatePickups(run, dt, fx) {
  const p = run.player, reach = PLAYER.magnet * (1 + 0.4 * run.loadout.passives.magnet);
  for (let i = run.pickups.length - 1; i >= 0; i--) {
    const it = run.pickups[i];
    it.t += dt;
    const dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy);
    if (it.pulled || d < reach) {
      it.pulled = true;
      const sp = 140 + it.t * 30;
      it.x += (dx / (d || 1)) * sp * dt;
      it.y += (dy / (d || 1)) * sp * dt;
    }
    if (d < 8) {
      collect(run, it, fx);
      run.pickups.splice(i, 1);
    }
  }
  // too many gems on the floor: merge the far ones into one bigger gem, like 2048 tiles
  if (run.pickups.length > 400) mergeFarGems(run);
}

function collect(run, it, fx) {
  if (it.kind === "gem") {
    run.xp += it.value;
    while (run.xp >= run.xpNext) {
      run.xp -= run.xpNext;
      run.level++;
      run.xpNext = xpToNext(run.level);
      run.pendingLevels++;
    }
  } else if (it.kind === "coin") {
    run.coins += it.value;
    fx.number(it.x, it.y, "+" + it.value, "gold");
  } else if (it.kind === "heart") {
    const p = run.player;
    p.hp = Math.min(p.maxHp, p.hp + it.value);
    fx.spawn("collectBurst", p.x, p.y + 8);
  }
}

export function mergeFarGems(run) {
  const p = run.player, gems = run.pickups.filter((it) => it.kind === "gem" && !it.pulled);
  gems.sort((a, b) => (b.x - p.x) ** 2 + (b.y - p.y) ** 2 - ((a.x - p.x) ** 2 + (a.y - p.y) ** 2));
  const far = gems.slice(0, 100), total = far.reduce((s, g) => s + g.value, 0);
  // the floor can fill with coins and pulled gems too; with nothing to merge, leave it be
  if (far.length < 2) return;
  run.pickups = run.pickups.filter((it) => !far.includes(it));
  run.pickups.push({ kind: "gem", x: far[0].x, y: far[0].y, value: total, t: 0 });
}

/** Applies a passive card's side effects (the loadout itself is already updated). */
export function onPassive(run, id) {
  const p = run.player;
  if (id === "heart") {
    p.maxHp += 20;
    p.hp = p.maxHp;
  }
}
