type Vector = { x: number; y: number };

const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const UP = ['ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const PAGE_KEYS = new Set([...LEFT, ...RIGHT, ...UP, ...DOWN, 'Space']);

const held = new Set<string>();
const fresh = new Set<string>();
const stick: Vector = { x: 0, y: 0 };

function press(code: string): void {
  if (!held.has(code)) fresh.add(code);
  held.add(code);
}

function release(code: string): void {
  held.delete(code);
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

const anyHeld = (codes: string[]) => codes.some((code) => held.has(code));

window.addEventListener('keydown', (e) => {
  if (isTyping(e.target)) return;
  if (PAGE_KEYS.has(e.code)) e.preventDefault();
  press(e.code);
});
window.addEventListener('keyup', (e) => release(e.code));
// A key released while the iframe has no focus never sends `keyup`.
window.addEventListener('blur', () => {
  held.clear();
  fresh.clear();
  stick.x = 0;
  stick.y = 0;
});

/** Keyboard and on-screen controls as one state, live from the moment this module loads. Codes are `KeyboardEvent.code` values. */
export const input = {
  /** WASD, arrows, pressed buttons and the stick, x right and y down, never longer than 1. */
  move(): Vector {
    const x = Number(anyHeld(RIGHT)) - Number(anyHeld(LEFT)) + stick.x;
    const y = Number(anyHeld(DOWN)) - Number(anyHeld(UP)) + stick.y;
    const length = Math.hypot(x, y);
    return length > 1 ? { x: x / length, y: y / length } : { x, y };
  },
  held(code: string): boolean {
    return held.has(code);
  },
  /** True once per press: the first call after the key or button goes down. A press stays pending until read. */
  pressed(code: string): boolean {
    return fresh.delete(code);
  },
  /** For on-screen buttons: `press('ArrowLeft')` on pointer down, `release('ArrowLeft')` on pointer up. */
  press,
  release,
  /** For an on-screen stick: its offset with each axis in -1..1, and `setStick(0, 0)` on release. */
  setStick(x: number, y: number): void {
    stick.x = x;
    stick.y = y;
  },
};
