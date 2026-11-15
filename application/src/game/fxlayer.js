// Live pixelfx one-shots (novas, meteors, sparks), lightning arcs and damage numbers, painted into one frame
// that follows the camera and is composited over the scene each tick.

import { createFrame, clearFrame, createFx, composite, painterFor, hex } from "pixelfx";
import * as frostNova from "pixelfx/fx/ice/frost-nova";
import * as meteor from "pixelfx/fx/fire/meteor";
import * as hitSpark from "pixelfx/fx/impacts/hit-spark";
import * as zapHit from "pixelfx/fx/lightning/zap-hit";
import * as poof from "pixelfx/fx/spawn/poof";
import * as collectBurst from "pixelfx/fx/pickups/collect-burst";
import * as levelUp from "pixelfx/fx/ui/level-up";
import * as implosion from "pixelfx/fx/explosions/implosion";
import * as bigExplosion from "pixelfx/fx/explosions/small-explosion";

const MODS = { frostNova, meteor, hitSpark, zapHit, poof, collectBurst, levelUp, implosion, bigExplosion };

/** How many of each may play at once, and how long before one is cut short (its tail is mostly smoke). */
const LIMITS = {
  frostNova: { max: 3, life: 1.6 },
  meteor: { max: 5, life: 2.0 },
  hitSpark: { max: 14, life: 0.5 },
  zapHit: { max: 10, life: 0.6 },
  poof: { max: 6, life: 0.55 },
  collectBurst: { max: 4, life: 1.0 },
  levelUp: { max: 1, life: 3.2 },
  implosion: { max: 1, life: 1.65 },
  bigExplosion: { max: 2, life: 2.4 },
};

const WHITE = hex("#ffffff"), INK = hex("#120c18"), RED = hex("#ff5a4a"), GOLD = hex("#ffd75e"), VOLT = hex("#9fe8ff");

export function createFxLayer() {
  let frame = null, img = null, canvas = null, g = null;
  const live = [], arcs = [], numbers = [];

  function resize(w, h) {
    frame = createFrame(w, h);
    img = new ImageData(w, h);
    canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    g = canvas.getContext("2d");
  }

  /** Plays a named effect at a world point; returns false when that effect is at its limit. */
  function spawn(name, x, y, opts = {}) {
    const lim = LIMITS[name];
    if (live.filter((e) => e.name === name).length >= lim.max) return false;
    live.push({ name, fx: createFx(MODS[name], { ...opts, x, y, seed: (Math.random() * 1e6) | 0 }), life: lim.life });
    return true;
  }

  /** A jagged lightning arc between two points, for a split second. */
  function arc(x0, y0, x1, y1) {
    const pts = [[x0, y0]], n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 10));
    for (let i = 1; i < n; i++) {
      const u = i / n;
      pts.push([x0 + (x1 - x0) * u + (Math.random() - 0.5) * 10, y0 + (y1 - y0) * u + (Math.random() - 0.5) * 10]);
    }
    pts.push([x1, y1]);
    arcs.push({ pts, t: 0.16 });
  }

  function number(x, y, value, kind = "hit") {
    if (numbers.length > 60) numbers.shift();
    numbers.push({ x, y, value: String(value), kind, t: 0 });
  }

  function update(dt) {
    for (let i = live.length - 1; i >= 0; i--) {
      const e = live[i];
      e.fx.update(dt);
      e.life -= dt;
      if (e.life <= 0) e.fx.stop();
      if (e.fx.done()) live.splice(i, 1);
    }
    for (let i = arcs.length - 1; i >= 0; i--) if ((arcs[i].t -= dt) <= 0) arcs.splice(i, 1);
    for (let i = numbers.length - 1; i >= 0; i--) if ((numbers[i].t += dt) > 0.8) numbers.splice(i, 1);
  }

  function paint(camX, camY) {
    frame.ox = Math.round(camX);
    frame.oy = Math.round(camY);
    clearFrame(frame);
    for (const e of live) e.fx.draw(frame);
    const p = painterFor(frame);
    for (const a of arcs) {
      for (let i = 1; i < a.pts.length; i++) {
        const [x0, y0] = a.pts[i - 1], [x1, y1] = a.pts[i];
        p.glowLine(x0, y0, x1, y1, 4, VOLT, 0.5);
        p.line(x0, y0, x1, y1, WHITE);
      }
    }
    for (const n of numbers) {
      const rise = n.t * 18, a = n.t < 0.6 ? 1 : 1 - (n.t - 0.6) / 0.2;
      const c = n.kind === "hurt" ? RED : n.kind === "gold" ? GOLD : WHITE;
      p.text(n.value, Math.round(n.x), Math.round(n.y - 14 - rise), c, { align: "center", shadow: INK, a });
    }
  }

  /** Composites the frame and draws it over the scene. */
  function drawTo(ctx, camX, camY) {
    paint(camX, camY);
    composite(frame, img.data, null);
    g.putImageData(img, 0, 0);
    ctx.drawImage(canvas, 0, 0);
  }

  function clear() {
    live.length = 0;
    arcs.length = 0;
    numbers.length = 0;
  }

  return { resize, spawn, arc, number, update, drawTo, clear };
}
