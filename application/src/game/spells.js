// The five spells. Each fires on its own cooldown; its tile tier (2, 4, 8 ...) sets how hard it hits.

import { power } from "./runes.js";
import { eachNear, nearestEnemy, hurtEnemy, rand } from "./world.js";

const BOLT_SPEED = 230, BOLT_LIFE = 1.4;

function stats(id, p) {
  switch (id) {
    case "bolt": return { cd: Math.max(0.28, 0.95 - 0.09 * p), count: 1 + Math.floor(p / 2), dmg: 8 + 4 * p, pierce: Math.floor(p / 3) };
    case "nova": return { cd: Math.max(1.4, 3.4 - 0.3 * p), radius: 56 + 10 * p, dmg: 12 + 7 * p };
    case "chain": return { cd: Math.max(0.6, 1.7 - 0.15 * p), jumps: 2 + p, dmg: 11 + 6 * p };
    case "orb": return { count: Math.min(6, 1 + p), radius: 40 + 3 * p, dmg: 6 + 3 * p, spin: 2.4 + 0.15 * p };
    case "meteor": return { cd: Math.max(1.6, 4.6 - 0.45 * p), count: 1 + Math.floor(p / 2), radius: 32 + 4 * p, dmg: 38 + 18 * p };
  }
}

export function updateSpells(run, dt, fx) {
  for (const [id, tier] of Object.entries(run.loadout.spells)) {
    const s = stats(id, power(tier));
    if (id === "orb") {
      spinOrbs(run, dt, s, fx);
      continue;
    }
    run.cds[id] = (run.cds[id] ?? 0.4) - dt;
    if (run.cds[id] > 0) continue;
    const fired = CAST[id](run, s, fx);
    run.cds[id] = fired ? s.cd : 0.2;
  }
  updateBolts(run, dt, fx);
  updateDelayed(run, dt, fx);
}

const CAST = {
  bolt(run, s) {
    const p = run.player, target = nearestEnemy(run, p.x, p.y, 220);
    if (!target) return false;
    const base = Math.atan2(target.y - p.y, target.x - p.x);
    for (let i = 0; i < s.count; i++) {
      const a = base + (i - (s.count - 1) / 2) * 0.18;
      run.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(a) * BOLT_SPEED, vy: Math.sin(a) * BOLT_SPEED, angle: a, t: 0, dmg: s.dmg * run.bonus.dmg, pierce: s.pierce, hit: new Set() });
    }
    return true;
  },

  nova(run, s, fx) {
    const p = run.player;
    if (!nearestEnemy(run, p.x, p.y, s.radius)) return false;
    fx.spawn("frostNova", p.x, p.y + 10, { reach: s.radius });
    eachNear(run, p.x, p.y, s.radius, (e) => {
      e.slow = 1.6;
      hurtEnemy(run, fx, e, s.dmg * run.bonus.dmg, 70);
    });
    return true;
  },

  chain(run, s, fx) {
    const p = run.player;
    let from = { x: p.x, y: p.y }, e = nearestEnemy(run, p.x, p.y, 130);
    if (!e) return false;
    const hit = new Set();
    for (let j = 0; j < s.jumps && e; j++) {
      fx.arc(from.x, from.y, e.x, e.y);
      fx.spawn("zapHit", e.x, e.y);
      hit.add(e);
      hurtEnemy(run, fx, e, s.dmg * run.bonus.dmg, 20, from.x, from.y);
      from = { x: e.x, y: e.y };
      e = nearestEnemy(run, from.x, from.y, 90, hit);
    }
    return true;
  },

  meteor(run, s, fx) {
    const living = run.enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - run.player.x, e.y - run.player.y) < 200);
    if (!living.length) return false;
    for (let i = 0; i < s.count; i++) {
      const target = living[(Math.random() * living.length) | 0], x = target.x + rand(-8, 8), y = target.y + rand(-8, 8);
      fx.spawn("meteor", x, y);
      // the rock lands 0.62 s into the effect
      run.delayed.push({ t: 0.62, x, y, radius: s.radius, dmg: s.dmg * run.bonus.dmg });
    }
    return true;
  },
};

function spinOrbs(run, dt, s, fx) {
  const p = run.player;
  run.orbAngle += s.spin * dt;
  run.orbs = [];
  for (let i = 0; i < s.count; i++) {
    const a = run.orbAngle + (i / s.count) * Math.PI * 2, x = p.x + Math.cos(a) * s.radius, y = p.y + Math.sin(a) * s.radius * 0.8;
    run.orbs.push({ x, y });
    eachNear(run, x, y, 8, (e) => {
      if (e.orbCd > 0) return;
      e.orbCd = 0.5;
      hurtEnemy(run, fx, e, s.dmg * run.bonus.dmg, 50, x, y);
    });
  }
}

function updateBolts(run, dt, fx) {
  for (const b of run.projectiles) {
    b.t += dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    eachNear(run, b.x, b.y, 4, (e) => {
      if (b.pierce < 0 || b.hit.has(e)) return;
      b.hit.add(e);
      b.pierce--;
      hurtEnemy(run, fx, e, b.dmg, 40, b.x - b.vx, b.y - b.vy);
      fx.spawn("hitSpark", b.x, b.y + 6, { angle: b.angle });
    });
  }
  run.projectiles = run.projectiles.filter((b) => b.t < BOLT_LIFE && b.pierce >= 0);
}

function updateDelayed(run, dt, fx) {
  for (const d of run.delayed) {
    d.t -= dt;
    if (d.t > 0) continue;
    run.shake = Math.max(run.shake, 0.22);
    eachNear(run, d.x, d.y, d.radius, (e) => hurtEnemy(run, fx, e, d.dmg, 90, d.x, d.y));
  }
  run.delayed = run.delayed.filter((d) => d.t > 0);
}

/** A spell's numbers at a tier, for the level-up cards to describe. */
export const tierStats = (id, tier) => stats(id, power(tier));
