// Spawning waves around the view, chasing, crowding, and touching the player (and the player's burning tail).

import { ENEMIES, BOSS_EVERY, MAX_ENEMIES, difficulty } from "./config.js";
import { eachNear, hurtEnemy, hurtPlayer, tailPoints, rand } from "./world.js";

const TAIL_TICK = 0.45;

function pickKind(t) {
  const kinds = Object.entries(ENEMIES).filter(([, d]) => t >= d.from && d.weight > 0);
  let roll = Math.random() * kinds.reduce((s, [, d]) => s + d.weight, 0);
  for (const [k, d] of kinds) if ((roll -= d.weight) <= 0) return k;
  return kinds[0][0];
}

function spawnEnemy(run, kind, view) {
  const def = ENEMIES[kind], diff = difficulty(run.t), p = run.player;
  const a = Math.random() * Math.PI * 2, r = Math.hypot(view.w, view.h) / 2 + 24;
  const hp = def.hp * diff.hp * (def.boss ? 1 + run.t / 240 : 1);
  run.enemies.push({
    kind, x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r,
    hp, maxHp: hp, radius: def.radius, speed: def.speed * diff.speed * rand(0.9, 1.1),
    kx: 0, ky: 0, flash: 0, slow: 0, tailCd: 0, orbCd: 0, phase: Math.random() * 10,
  });
}

export function updateSpawns(run, dt, view) {
  const diff = difficulty(run.t);
  run.spawnAcc += diff.spawn * dt;
  while (run.spawnAcc >= 1) {
    run.spawnAcc -= 1;
    if (run.enemies.length < MAX_ENEMIES) spawnEnemy(run, pickKind(run.t), view);
  }
  if (run.t >= run.nextBoss) {
    run.nextBoss += BOSS_EVERY;
    spawnEnemy(run, "skull", view);
    run.alert = { key: "bossAppears", t: 2.5 };
    // a ring of slimes rides in with it
    for (let i = 0; i < 16; i++) if (run.enemies.length < MAX_ENEMIES) spawnEnemy(run, "slime", view);
  }
}

export function updateEnemies(run, dt, fx, view) {
  const p = run.player, far = Math.hypot(view.w, view.h) * 0.9;
  for (const e of run.enemies) {
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    // stragglers left far behind are brought back round in front, so the crowd stays on screen
    if (d > far && !ENEMIES[e.kind].boss) {
      e.x = p.x + (dx / d) * far * 0.6;
      e.y = p.y + (dy / d) * far * 0.6;
      continue;
    }
    const sp = e.speed * (e.slow > 0 ? 0.45 : 1);
    e.x += (dx / d) * sp * dt + e.kx * dt;
    e.y += (dy / d) * sp * dt + e.ky * dt;
    const damp = Math.max(0, 1 - dt * 8);
    e.kx *= damp;
    e.ky *= damp;
    e.flash = Math.max(0, e.flash - dt);
    e.slow = Math.max(0, e.slow - dt);
    e.tailCd = Math.max(0, e.tailCd - dt);
    e.orbCd = Math.max(0, e.orbCd - dt);
  }
  separate(run);
  touchPlayer(run, fx);
  burnWithTail(run, fx);
  run.enemies = run.enemies.filter((e) => e.hp > 0);
}

/** Pushes overlapping enemies apart so the crowd reads as a swarm, not a single blob. */
function separate(run) {
  for (const e of run.enemies) {
    eachNear(run, e.x, e.y, e.radius * 0.8, (o) => {
      if (o === e) return;
      const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy) || 0.01, overlap = e.radius + o.radius - d;
      if (overlap <= 0) return;
      const k = Math.min(overlap, 3) * 0.25;
      e.x += (dx / d) * k;
      e.y += (dy / d) * k;
    });
  }
}

function touchPlayer(run, fx) {
  const p = run.player;
  eachNear(run, p.x, p.y, 7, (e) => hurtPlayer(run, fx, ENEMIES[e.kind].dmg));
}

function burnWithTail(run, fx) {
  const dmg = 5 * (1 + 0.25 * run.loadout.passives.tail) * run.bonus.dmg;
  for (const pt of tailPoints(run))
    eachNear(run, pt.x, pt.y, 5, (e) => {
      if (e.tailCd > 0) return;
      e.tailCd = TAIL_TICK;
      hurtEnemy(run, fx, e, dmg, 30, pt.x, pt.y);
    });
}
