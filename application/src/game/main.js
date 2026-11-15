// Boot, the screen flow (title -> play -> level-up / pause -> game over) and the main loop.

import { VIEW_SHORT, VIEW_LONG_MAX } from "./config.js";
import { bakeAll } from "./sprites.js";
import { createFxLayer } from "./fxlayer.js";
import { createInput } from "./input.js";
import { createRun, rebuildGrid, updatePlayer, updatePickups, onPassive } from "./world.js";
import { updateSpawns, updateEnemies } from "./enemies.js";
import { updateSpells } from "./spells.js";
import { drawWorld, drawOverlay, makeFloor } from "./render.js";
import { offerCards, applyCard } from "./runes.js";
import { loadSave, storeSave, buy, settleOffline, runGold } from "./progress.js";
import * as ui from "./ui.js";
import { setLang } from "../i18n/index.js";

const canvas = ui.el("game");
const ctx = canvas.getContext("2d");
const view = { w: 480, h: 270 };
const fx = createFxLayer();
const input = createInput(canvas, ui.el("dash"));
const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

let S = null, floor = null, run = null, save = loadSave(storage), mode = "title", shopReturn = "title";
let cards = null, overDelay = 0, last = performance.now(), clock = 0, idle = null;

function resize() {
  const a = window.innerWidth / window.innerHeight;
  view.w = a >= 1 ? Math.min(VIEW_LONG_MAX, Math.round(VIEW_SHORT * a)) : VIEW_SHORT;
  view.h = a >= 1 ? VIEW_SHORT : Math.min(VIEW_LONG_MAX, Math.round(VIEW_SHORT / a));
  canvas.width = view.w;
  canvas.height = view.h;
  ctx.imageSmoothingEnabled = false;
  fx.resize(view.w, view.h);
}

// ---- screen flow

function toTitle() {
  mode = "title";
  run = null;
  fx.clear();
  ui.setHud(false);
  ui.renderTitle(save, 0);
  ui.show("title");
}

function startRun() {
  // the title is server-rendered and clickable before the sprites are baked
  if (!S) return;
  // boss tickets are only good until the next run: unused ones burn out here
  if (save.freeBuys) {
    save = { ...save, freeBuys: 0 };
    storeSave(storage, save);
  }
  run = createRun(save);
  fx.clear();
  ui.resetHud();
  ui.setHud(true);
  overDelay = 1.3;
  resumePlay();
}

/** Back to the action. A dash pressed on a menu (Space on the title, a right click on a card) is dropped. */
function resumePlay() {
  input.takeDash();
  mode = "play";
  ui.show();
}

function openShop(from) {
  shopReturn = from;
  mode = "shop";
  const refresh = () =>
    ui.renderShop(save, (id) => {
      const next = buy(save, id);
      if (!next) return;
      save = next;
      storeSave(storage, save);
      refresh();
    });
  refresh();
  ui.show("shop");
}

function closeShop() {
  if (shopReturn === "over") {
    mode = "over";
    ui.show("over");
  } else toTitle();
}

function openLevelUp() {
  mode = "levelup";
  cards = offerCards(run.loadout, Math.random);
  ui.showCards(run, cards, pickCard);
}

function pickCard(card) {
  if (mode !== "levelup") return;
  applyCard(run.loadout, card);
  if (card.kind === "passive") onPassive(run, card.id);
  fx.spawn("levelUp", run.player.x, run.player.y + 10);
  run.pendingLevels--;
  cards = null;
  if (run.pendingLevels > 0) openLevelUp();
  else resumePlay();
}

function setPaused(on) {
  if (on && mode === "play") {
    mode = "paused";
    ui.show("paused");
  } else if (!on && mode === "paused") resumePlay();
}

function endRun() {
  const gold = runGold(run.coins + Math.floor(run.t / 10), save.upgrades);
  const isBest = run.t > save.best;
  save = {
    ...save,
    gold: save.gold + gold,
    best: Math.max(save.best, run.t),
    runs: save.runs + 1,
    freeBuys: run.bossKills,
    lastSeen: Date.now(),
  };
  storeSave(storage, save);
  ui.renderOver(run, gold, isBest);
  ui.setHud(false);
  mode = "over";
  ui.show("over");
}

// ---- simulation

function steering() {
  const k = input.keyDir();
  if (k) return { x: k.x, y: k.y, dir: true };
  const s = input.state;
  if (!s.pointerActive || !s.pointer) return null;
  return { x: s.pointer.x + camera().x, y: s.pointer.y + camera().y };
}

function camera() {
  const p = run.player;
  return { x: Math.round(p.x - view.w / 2), y: Math.round(p.y - view.h / 2) };
}

function step(dt) {
  run.t += dt;
  updatePlayer(run, dt, steering(), input.takeDash(), fx);
  rebuildGrid(run);
  updateSpawns(run, dt, view);
  updateEnemies(run, dt, fx, view);
  rebuildGrid(run);
  updateSpells(run, dt, fx);
  updatePickups(run, dt, fx);
  if (run.alert && (run.alert.t -= dt) <= 0) run.alert = null;
  if (run.pendingLevels > 0 && !run.over) openLevelUp();
}

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  clock += dt;
  if (mode === "play") {
    if (run.over) {
      overDelay -= dt;
      if (overDelay <= 0) endRun();
    } else step(dt);
  }
  if (mode === "play" || mode === "over") fx.update(dt);
  if (run) run.shake = Math.max(0, run.shake - dt);
  render();
  if (run && mode === "play") ui.updateHud(run);
  requestAnimationFrame(tick);
}

function render() {
  if (!S) {
    ctx.fillStyle = "#0c0a12";
    ctx.fillRect(0, 0, view.w, view.h);
    return;
  }
  if (!run) return renderIdle();
  const cam = camera(), sh = run.shake > 0 ? Math.round((Math.random() - 0.5) * 6 * run.shake * 4) : 0;
  cam.x += sh;
  cam.y += sh;
  drawWorld(ctx, run, S, floor, cam, view, clock);
  fx.drawTo(ctx, cam.x, cam.y);
  drawOverlay(ctx, run, cam, view, clock);
}

/** Behind the title: the ember idling on the flagstones. */
function renderIdle() {
  const cam = { x: Math.round(clock * 8), y: 0 };
  idle ??= createRun(save);
  idle.player.x = cam.x + view.w / 2;
  idle.player.y = view.h * 0.72;
  idle.player.trail = [{ x: idle.player.x, y: idle.player.y }, { x: idle.player.x - 40, y: idle.player.y }];
  drawWorld(ctx, idle, S, floor, cam, view, clock);
}

// ---- wiring

function wire() {
  ui.el("play").addEventListener("click", startRun);
  ui.el("open-shop").addEventListener("click", () => openShop("title"));
  ui.el("close-shop").addEventListener("click", closeShop);
  ui.el("retry").addEventListener("click", startRun);
  ui.el("over-shop").addEventListener("click", () => openShop("over"));
  ui.el("over-title").addEventListener("click", toTitle);
  ui.el("resume").addEventListener("click", () => setPaused(false));
  ui.el("quit").addEventListener("click", () => {
    run.player.hp = 0;
    run.over = true;
    overDelay = 0;
    setPaused(false);
  });
  ui.el("pause-btn").addEventListener("click", () => setPaused(true));
  input.setKeyHandler((e) => {
    if (e.code === "Escape" || e.code === "KeyP") setPaused(mode === "play");
    if (mode === "levelup" && cards && /^Digit[1-3]$/.test(e.code)) {
      const c = cards[+e.code.slice(5) - 1];
      if (c) pickCard(c);
    }
    if (mode === "over" && e.code === "KeyR") startRun();
    if (mode === "title" && e.code === "Enter") startRun();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      setPaused(true);
      save = { ...save, lastSeen: Date.now() };
      storeSave(storage, save);
    } else if (S) payOffline();
  });
  // clicking another window leaves the keys stuck and the swarm unattended
  window.addEventListener("blur", () => setPaused(true));
  window.addEventListener("resize", resize);
}

let started = false;

/** Boots the game into the page's markup, speaking `lang`. Safe to call more than once (React may mount twice in dev). */
export async function startGame(lang) {
  if (started) return;
  started = true;
  setLang(lang);
  resize();
  wire();
  requestAnimationFrame(tick);
  ui.renderTitle(save, 0);
  // let the title paint before the bake blocks the thread
  await new Promise((r) => setTimeout(r, 30));
  S = bakeAll();
  floor = makeFloor();
  toTitle();
  payOffline();
}

/** Credits the forge for the time away (since boot or since the tab was hidden). */
function payOffline() {
  const settled = settleOffline(save, Date.now());
  save = settled.save;
  storeSave(storage, save);
  if (mode === "title" && settled.earned) ui.renderTitle(save, settled.earned);
}
