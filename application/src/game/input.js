// Steering like Slither.io: the ember chases the pointer (mouse or a held touch). WASD/arrows also work.
// One button dashes: Space, Shift, right click, or the on-screen button.

const KEYS = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

export function createInput(canvas, dashButton) {
  const held = new Set();
  const state = { pointer: null, pointerActive: false, dash: false, usingKeys: false };
  let onKey = () => {};

  function toView(e) {
    // the canvas is letterboxed with object-fit: contain, so map through the drawn area, not the element box
    const r = canvas.getBoundingClientRect(), k = Math.min(r.width / canvas.width, r.height / canvas.height);
    const left = r.left + (r.width - canvas.width * k) / 2, top = r.top + (r.height - canvas.height * k) / 2;
    return { x: (e.clientX - left) / k, y: (e.clientY - top) / k };
  }

  window.addEventListener("keydown", (e) => {
    if (KEYS[e.code]) {
      held.add(e.code);
      state.usingKeys = true;
      e.preventDefault();
    }
    if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
      state.dash = true;
      e.preventDefault();
    }
    onKey(e);
  });
  window.addEventListener("keyup", (e) => held.delete(e.code));
  window.addEventListener("blur", () => held.clear());

  canvas.addEventListener("pointermove", (e) => {
    state.pointer = toView(e);
    if (e.pointerType === "mouse") {
      state.pointerActive = true;
      state.usingKeys = false;
    }
  });
  canvas.addEventListener("pointerdown", (e) => {
    state.pointer = toView(e);
    state.pointerActive = true;
    state.usingKeys = false;
    if (e.button === 2) state.dash = true;
    canvas.setPointerCapture?.(e.pointerId);
  });
  const release = (e) => {
    if (e.pointerType !== "mouse") state.pointerActive = false;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse") state.pointerActive = false;
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  dashButton?.addEventListener("pointerdown", (e) => {
    state.dash = true;
    e.preventDefault();
    e.stopPropagation();
  });

  /** Keyboard direction, or null when no movement key is held. */
  function keyDir() {
    let x = 0, y = 0;
    for (const code of held) {
      x += KEYS[code][0];
      y += KEYS[code][1];
    }
    if (!x && !y) return null;
    const l = Math.hypot(x, y);
    return { x: x / l, y: y / l };
  }

  /** Reads and clears the one-shot dash press. */
  function takeDash() {
    const d = state.dash;
    state.dash = false;
    return d;
  }

  return {
    state,
    keyDir,
    takeDash,
    setKeyHandler: (fn) => (onKey = fn),
  };
}
