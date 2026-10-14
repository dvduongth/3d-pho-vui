// No import or export: a `.d.ts` with neither is a global script, so this
// augments the DOM's `Window` without a `declare global` wrapper.

type GameState = {
  scene: string;
  running: boolean;
  entities: number;
  player?: { x: number; y: number; z?: number; hp?: number };
  score?: number;
  custom?: Record<string, number | string | boolean>;
};

interface Window {
  /** PRD §9.3 / ADR-08. Every template assigns this; the test harness reads it. */
  __GAME_STATE__: () => GameState;
  /** Dev-only hooks the game assigns under `import.meta.env.DEV`, for Game Creator's playtest. */
  __GAME_TEST__?: Record<string, (...args: never[]) => unknown>;
}
