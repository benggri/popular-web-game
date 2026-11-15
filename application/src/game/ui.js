// The DOM around the canvas: screens, the HUD, level-up cards and the forge shop.

import { TILE, PLAYER } from "./config.js";
import { SPELLS, PASSIVES } from "./runes.js";
import { UPGRADES, costOf } from "./progress.js";
import { describeTier } from "./spells.js";

const $ = (id) => document.getElementById(id);
const SCREENS = ["loading", "title", "shop", "levelup", "paused", "over"];
const PASSIVE_ICON = { tail: "≈", swift: "»", magnet: "⊙", heart: "♥" };

export const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function show(...ids) {
  for (const id of SCREENS) $(id).hidden = !ids.includes(id);
}

export function setHud(visible) {
  $("hud").hidden = !visible;
}

function tileHtml(tier, extra = "") {
  const [bg, fg] = TILE[tier] ?? TILE[64];
  return `<span class="tile ${extra}" style="background:${bg};color:${fg}">${tier}</span>`;
}

// ---- HUD

let lastTiles = "";

export function updateHud(run) {
  const p = run.player;
  $("hp-fill").style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
  $("hp-text").textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
  $("xp-fill").style.width = `${(run.xp / run.xpNext) * 100}%`;
  $("lv-text").textContent = `LV ${run.level}`;
  $("timer").textContent = fmtTime(run.t);
  $("kills").textContent = run.kills;
  $("coins").textContent = run.coins;
  $("dash").style.setProperty("--ready", String(1 - p.dashCd / PLAYER.dashCooldown));
  const sig = JSON.stringify(run.loadout.spells);
  if (sig !== lastTiles) renderTiles(run, lastTiles ? JSON.parse(lastTiles) : {});
  lastTiles = sig;
}

function renderTiles(run, before) {
  $("tiles").innerHTML = Object.entries(run.loadout.spells)
    .map(([id, tier]) => {
      const [bg, fg] = TILE[tier];
      const pop = before[id] !== tier ? "pop" : "";
      return `<span class="tile ${pop}" style="background:${bg};color:${fg}">${tier}<small>${SPELLS[id].name}</small></span>`;
    })
    .join("");
}

export function resetHud() {
  lastTiles = "";
}

// ---- level-up cards

export function showCards(run, cards, onPick) {
  $("levelup-title").textContent = `레벨 ${run.level - run.pendingLevels + 1}!`;
  $("cards").innerHTML = cards
    .map((c, i) => {
      if (c.kind === "spell") {
        const s = SPELLS[c.id], merge = c.from ? `<span class="merge">${c.from} + ${c.from} = ${c.to}</span>` : `<span class="merge">새 주문</span>`;
        return `<button class="card" data-i="${i}">${tileHtml(c.to)}<span><span class="key">${i + 1}</span> <b>${s.name}</b></span><p>${s.desc}<br />${describeTier(c.id, c.to)}</p>${merge}</button>`;
      }
      const s = PASSIVES[c.id];
      return `<button class="card" data-i="${i}"><span class="tile passive">${PASSIVE_ICON[c.id]}</span><span><span class="key">${i + 1}</span> <b>${s.name}</b></span><p>${s.desc}</p><span class="merge">Lv ${c.to}</span></button>`;
    })
    .join("");
  for (const b of $("cards").querySelectorAll(".card")) b.addEventListener("click", () => onPick(cards[+b.dataset.i]));
  show("levelup");
  $("cards").querySelector(".card")?.focus({ preventScroll: true });
}

// ---- title, shop, game over

export function renderTitle(save, offline) {
  $("best").textContent = fmtTime(save.best);
  $("gold").textContent = save.gold;
  $("offline").hidden = !offline;
  if (offline) $("offline").textContent = `자리를 비운 사이 대장간이 ${offline} 골드를 벌었어요!`;
}

export function renderShop(save, onBuy) {
  $("shop-gold").textContent = save.gold;
  $("shop-list").innerHTML = Object.entries(UPGRADES)
    .map(([id, u]) => {
      const lv = save.upgrades[id], cost = costOf(id, lv);
      return `<li><div><b>${u.name}</b><span class="lv">Lv ${lv}</span><p>${u.desc}</p></div><button data-id="${id}" ${save.gold < cost ? "disabled" : ""}>● ${cost}</button></li>`;
    })
    .join("");
  for (const b of $("shop-list").querySelectorAll("button")) b.addEventListener("click", () => onBuy(b.dataset.id));
}

export function renderOver(run, gold, isBest) {
  $("r-time").textContent = fmtTime(run.t);
  $("r-kills").textContent = run.kills;
  $("r-level").textContent = run.level;
  $("r-gold").textContent = `+${gold}`;
  $("new-best").hidden = !isBest;
}

export const el = $;
