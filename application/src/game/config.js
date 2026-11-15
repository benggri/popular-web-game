// Balance and tuning in one place.

/** The shorter side of the view, in game pixels; the longer side follows the window. */
export const VIEW_SHORT = 340;
export const VIEW_LONG_MAX = 760;

export const PLAYER = {
  speed: 74,
  hp: 100,
  radius: 7,
  hurtFor: 0.6,
  dashSpeed: 3.2,
  dashFor: 0.24,
  dashCooldown: 2.2,
  magnet: 40,
  tailBase: 3,
  tailGap: 9,
};

/** Enemy kinds; `from` is the second of the run they start showing up. */
export const ENEMIES = {
  slime: { sprite: "slime", hp: 12, speed: 28, dmg: 8, radius: 9, xp: 1, from: 0, weight: 10 },
  bat: { sprite: "bat", hp: 8, speed: 54, dmg: 6, radius: 8, xp: 1, from: 25, weight: 7 },
  ghost: { sprite: "ghost", hp: 32, speed: 34, dmg: 12, radius: 10, xp: 3, from: 60, weight: 5 },
  eyeball: { sprite: "eyeball", hp: 70, speed: 24, dmg: 16, radius: 12, xp: 5, from: 120, weight: 3 },
  skull: { sprite: "skull", hp: 700, speed: 40, dmg: 25, radius: 18, xp: 40, from: Infinity, weight: 0, boss: true },
};

export const BOSS_EVERY = 120;
export const MAX_ENEMIES = 320;

/** Seconds of run -> enemy health and speed multipliers, and spawns per second. Space Waves-style ramp. */
export const difficulty = (t) => ({
  hp: 1 + t / 80,
  speed: Math.min(1.6, 1 + t / 300),
  spawn: Math.min(14, 1.1 + t / 18),
});

/** XP needed to go from `level` to the next. */
export const xpToNext = (level) => Math.floor(4 + level * 3 + level ** 1.5);

export const DROPS = { coin: 0.09, heart: 0.006 };

/** 2048 tile colors by tier, for the HUD and level-up cards. */
export const TILE = {
  2: ["#eee4da", "#776e65"],
  4: ["#ede0c8", "#776e65"],
  8: ["#f2b179", "#f9f6f2"],
  16: ["#f59563", "#f9f6f2"],
  32: ["#f67c5f", "#f9f6f2"],
  64: ["#f65e3b", "#f9f6f2"],
};
