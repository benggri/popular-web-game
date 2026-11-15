// Bakes pixelfx loops into canvas frames once at startup, so hundreds of critters cost a drawImage each.

import { createFrame, clearFrame, createFx, composite } from "pixelfx";
import * as spiritFlame from "pixelfx/fx/fire/spirit-flame";
import * as fireball from "pixelfx/fx/fire/fireball";
import * as arcaneOrb from "pixelfx/fx/arcane/arcane-orb";
import * as slime from "pixelfx/fx/critters/slime";
import * as bat from "pixelfx/fx/critters/bat";
import * as ghost from "pixelfx/fx/critters/ghost";
import * as eyeball from "pixelfx/fx/critters/eyeball";
import * as skull from "pixelfx/fx/critters/flying-skull";
import * as coin from "pixelfx/fx/pickups/coin-spin";
import * as heart from "pixelfx/fx/pickups/heart-pickup";

export const BOLT_DIRS = 16;

function toCanvas(frame, w, h) {
  const img = new ImageData(w, h);
  composite(frame, img.data, null);
  // drop the faintest glow: cut off at the frame's edge it reads as a pale box round the sprite
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 48) d[i] = 0;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d").putImageData(img, 0, 0);
  return c;
}

/** A white silhouette of a frame, flashed over a critter when it takes a hit. */
function silhouette(src) {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d");
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = "#fff";
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/**
 * Samples a looping effect into `count` frames. Returns { frames, white, ox, oy, fps }, where (ox, oy) is the
 * effect's origin inside each frame.
 */
export function bakeLoop(mod, count, opts = {}, withWhite = false) {
  const [w, h] = mod.meta.size, [ox, oy] = mod.meta.origin, D = mod.meta.duration;
  const frame = createFrame(w, h, -ox, -oy);
  const fx = createFx(mod, { ...opts, x: 0, y: 0 });
  const frames = [];
  for (let i = 0; i < count; i++) {
    clearFrame(frame);
    fx.draw(frame);
    frames.push(toCanvas(frame, w, h));
    fx.update(D / count);
  }
  return { frames, white: withWhite ? frames.map(silhouette) : null, ox, oy, fps: count / D };
}

/** The fireball turned to BOLT_DIRS headings, each a short loop, in a square frame round its head. */
function bakeBolt(count) {
  const S = 120, D = fireball.meta.duration, dirs = [];
  for (let d = 0; d < BOLT_DIRS; d++) {
    const angle = (d / BOLT_DIRS) * Math.PI * 2;
    const frame = createFrame(S, S, -S / 2, -S / 2);
    const fx = createFx(fireball, { x: 0, y: 0, angle });
    const frames = [];
    for (let i = 0; i < count; i++) {
      clearFrame(frame);
      fx.draw(frame);
      frames.push(toCanvas(frame, S, S));
      fx.update(D / count);
    }
    dirs.push(frames);
  }
  return { dirs, ox: S / 2, oy: S / 2, fps: count / D };
}

/** All baked sprites, keyed by name. Takes a moment; call behind the loading screen. */
export function bakeAll() {
  return {
    player: bakeLoop(spiritFlame, 18, {}, true),
    slime: bakeLoop(slime, 12, {}, true),
    bat: bakeLoop(bat, 12, {}, true),
    ghost: bakeLoop(ghost, 12, {}, true),
    eyeball: bakeLoop(eyeball, 12, {}, true),
    skull: bakeLoop(skull, 12, {}, true),
    orb: bakeLoop(arcaneOrb, 10),
    coin: bakeLoop(coin, 8),
    heart: bakeLoop(heart, 8),
    bolt: bakeBolt(6),
  };
}

/** The frame of a baked loop at time t. */
export const frameAt = (s, t) => Math.floor(t * s.fps) % s.frames.length;
