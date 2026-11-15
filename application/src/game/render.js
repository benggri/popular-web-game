// Draws the world in view space: the floor, pickups, the swarm, the tail, the player and the bolts.

import { ENEMIES } from "./config.js";
import { frameAt, BOLT_DIRS } from "./sprites.js";
import { tailPoints } from "./world.js";

const LIFT = { slime: 9, bat: 2, ghost: 16, eyeball: 20, skull: 34, player: 14 };
const TILE = 96;

/** A seamless dark flagstone tile, made once. */
export function makeFloor() {
  const c = document.createElement("canvas");
  c.width = c.height = TILE;
  const g = c.getContext("2d");
  g.fillStyle = "#14111c";
  g.fillRect(0, 0, TILE, TILE);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let by = 0; by < TILE; by += 24)
    for (let bx = 0; bx < TILE; bx += 32) {
      const off = (by / 24) % 2 ? 16 : 0, shade = 22 + ((rnd() * 8) | 0);
      g.fillStyle = `rgb(${shade},${shade - 4},${shade + 10})`;
      g.fillRect((bx + off) % TILE, by, 31, 23);
      if (bx + off + 31 > TILE) g.fillRect(0, by, (bx + off + 31) % TILE, 23);
      g.fillStyle = "rgba(255,255,255,0.04)";
      g.fillRect((bx + off) % TILE, by, 31, 1);
    }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = rnd() < 0.5 ? "#0e0c14" : "#2a2436";
    g.fillRect((rnd() * TILE) | 0, (rnd() * TILE) | 0, 1 + ((rnd() * 2) | 0), 1);
  }
  return c;
}

function drawFloor(ctx, floor, camX, camY, w, h) {
  const ox = -(((camX % TILE) + TILE) % TILE), oy = -(((camY % TILE) + TILE) % TILE);
  for (let y = oy; y < h; y += TILE) for (let x = ox; x < w; x += TILE) ctx.drawImage(floor, x, y);
}

function blit(ctx, s, i, x, y, white = false, scale = 1) {
  const img = (white && s.white ? s.white : s.frames)[i];
  if (scale === 1) ctx.drawImage(img, Math.round(x - s.ox), Math.round(y - s.oy));
  else ctx.drawImage(img, Math.round(x - s.ox * scale), Math.round(y - s.oy * scale), img.width * scale, img.height * scale);
}

function drawGem(ctx, x, y, value, t) {
  const big = value >= 5, r = big ? 4 : 3, bob = Math.round(Math.sin(t * 5) * 1);
  ctx.fillStyle = big ? "#c77dff" : "#5ec8ff";
  ctx.beginPath();
  ctx.moveTo(x, y - r + bob);
  ctx.lineTo(x + r, y + bob);
  ctx.lineTo(x, y + r + bob);
  ctx.lineTo(x - r, y + bob);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - 1, y - 1 + bob, 1, 1);
}

function drawShadow(ctx, x, y, r) {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPickups(ctx, run, S, camX, camY, now) {
  for (const it of run.pickups) {
    const x = Math.round(it.x - camX), y = Math.round(it.y - camY);
    if (it.kind === "gem") drawGem(ctx, x, y, it.value, now + it.x);
    else if (it.kind === "coin") blit(ctx, S.coin, frameAt(S.coin, now), x, y + 8, false, 0.5);
    else blit(ctx, S.heart, frameAt(S.heart, now), x, y + 10, false, 0.6);
  }
}

function drawEnemies(ctx, run, S, camX, camY, now) {
  const list = run.enemies.slice().sort((a, b) => a.y - b.y);
  for (const e of list) {
    const def = ENEMIES[e.kind], s = S[def.sprite], scale = def.boss ? 2 : 1;
    const x = e.x - camX, y = e.y - camY;
    drawShadow(ctx, x, y + e.radius * 0.6, e.radius * 0.8);
    blit(ctx, s, frameAt(s, now + e.phase), x, y + LIFT[e.kind] * scale, e.flash > 0, scale);
    if (e.slow > 0) {
      ctx.fillStyle = "rgba(140,220,255,0.25)";
      ctx.fillRect(Math.round(x - e.radius), Math.round(y - e.radius), e.radius * 2, e.radius * 2);
    }
    if (def.boss) drawBossBar(ctx, e, x, y);
  }
}

function drawBossBar(ctx, e, x, y) {
  const w = 40, k = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = "#120c18";
  ctx.fillRect(Math.round(x - w / 2 - 1), Math.round(y - 52), w + 2, 4);
  ctx.fillStyle = "#ff4d6d";
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - 51), Math.round(w * k), 2);
}

function drawTail(ctx, run, camX, camY, now) {
  const pts = tailPoints(run);
  for (let i = pts.length - 1; i >= 0; i--) {
    const x = Math.round(pts[i].x - camX), y = Math.round(pts[i].y - camY), k = 1 - i / (pts.length + 2);
    const r = 2 + Math.round(3 * k + Math.sin(now * 9 + i) * 0.6);
    ctx.fillStyle = "rgba(44,196,180,0.25)";
    ctx.fillRect(x - r - 2, y - r - 2, (r + 2) * 2, (r + 2) * 2);
    ctx.fillStyle = i % 2 ? "#2cc4b4" : "#7ef0dc";
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = "#c8fff2";
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}

function drawPlayer(ctx, run, S, camX, camY, now) {
  const p = run.player, x = p.x - camX, y = p.y - camY;
  const blink = p.hurt > 0 && Math.floor(p.hurt * 20) % 2 === 0;
  drawShadow(ctx, x, y + 8, 6);
  if (p.dash > 0) {
    ctx.globalAlpha = 0.35;
    blit(ctx, S.player, frameAt(S.player, now), x - p.vx * 0.05, y - p.vy * 0.05 + LIFT.player);
    ctx.globalAlpha = 1;
  }
  blit(ctx, S.player, frameAt(S.player, now), x, y + LIFT.player, blink);
}

function drawBolts(ctx, run, S, camX, camY, now) {
  const b0 = S.bolt, i = Math.floor(now * b0.fps) % b0.dirs[0].length;
  for (const b of run.projectiles) {
    const d = ((Math.round((b.angle / (Math.PI * 2)) * BOLT_DIRS) % BOLT_DIRS) + BOLT_DIRS) % BOLT_DIRS;
    ctx.drawImage(b0.dirs[d][i], Math.round(b.x - camX - b0.ox), Math.round(b.y - camY - b0.oy));
  }
}

function drawOrbs(ctx, run, S, camX, camY, now) {
  if (!run.orbs || !run.loadout.spells.orb) return;
  for (const o of run.orbs) blit(ctx, S.orb, frameAt(S.orb, now), o.x - camX, o.y - camY + 14, false, 0.6);
}

/** A red arrow on the view's edge pointing at each boss that's off screen. */
function drawBossPointers(ctx, run, camX, camY, view, now) {
  const cx = view.w / 2, cy = view.h / 2, pad = 14;
  for (const e of run.enemies) {
    if (!ENEMIES[e.kind].boss) continue;
    const x = e.x - camX, y = e.y - camY;
    if (x > -e.radius && x < view.w + e.radius && y > -e.radius && y < view.h + e.radius) continue;
    const a = Math.atan2(y - cy, x - cx), k = Math.min((cx - pad) / Math.abs(Math.cos(a) || 1e-6), (cy - pad) / Math.abs(Math.sin(a) || 1e-6));
    const px = cx + Math.cos(a) * k, py = cy + Math.sin(a) * k;
    ctx.save();
    ctx.translate(Math.round(px), Math.round(py));
    ctx.rotate(a);
    ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(now * 6));
    ctx.fillStyle = "#120c18";
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-6, 7);
    ctx.fill();
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-4, -5);
    ctx.lineTo(-4, 5);
    ctx.fill();
    ctx.restore();
  }
}

/** A pulsing red rim when the ember is low on health. */
function drawDanger(ctx, run, view, now) {
  const p = run.player, k = p.hp / p.maxHp;
  if (run.over || k >= 0.3) return;
  const pulse = 0.5 + 0.5 * Math.sin(now * (6 + (0.3 - k) * 20));
  const r = Math.hypot(view.w, view.h) / 2, g = ctx.createRadialGradient(view.w / 2, view.h / 2, r * 0.55, view.w / 2, view.h / 2, r);
  g.addColorStop(0, "rgba(255,40,60,0)");
  g.addColorStop(1, `rgba(255,40,60,${(0.25 + 0.25 * pulse).toFixed(3)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
}

/** Screen-space warnings drawn over everything, effects included. */
export function drawOverlay(ctx, run, cam, view, now) {
  drawBossPointers(ctx, run, cam.x, cam.y, view, now);
  drawDanger(ctx, run, view, now);
}

/** The whole scene, minus the live effects layer that goes on top. */
export function drawWorld(ctx, run, S, floor, cam, view, now) {
  const { x: camX, y: camY } = cam;
  drawFloor(ctx, floor, camX, camY, view.w, view.h);
  drawPickups(ctx, run, S, camX, camY, now);
  drawTail(ctx, run, camX, camY, now);
  drawEnemies(ctx, run, S, camX, camY, now);
  drawOrbs(ctx, run, S, camX, camY, now);
  if (!run.over) drawPlayer(ctx, run, S, camX, camY, now);
  drawBolts(ctx, run, S, camX, camY, now);
}
