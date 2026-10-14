import data from './game-settings.json';

type SettingValue = number | string | boolean;
type Values = Record<string, SettingValue>;

/** Reads the values of src/game-settings.json. Games use the `settings` exported below. */
export function createSettings(file: { settings: { key: string; value: SettingValue }[] }) {
  const values: Values = Object.fromEntries(file.settings.map((s) => [s.key, s.value]));
  const listeners = new Set<(values: Readonly<Values>) => void>();

  // Game Creator's preview pushes edits here. `vite build` drops this block, so a deployed game keeps the saved values.
  if (import.meta.env.DEV) {
    const host = (
      window as unknown as {
        __gfSettings?: { subscribe: (fn: (next: Values) => void) => unknown };
      }
    ).__gfSettings;
    host?.subscribe((next) => {
      Object.assign(values, next);
      listeners.forEach((fn) => fn(values));
    });
  }

  return {
    get<T extends SettingValue = number>(key: string): T {
      return values[key] as T;
    },
    /** Calls `fn` now and after every live change. Returns the function that stops it. */
    subscribe(fn: (values: Readonly<Values>) => void): () => void {
      listeners.add(fn);
      fn(values);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}

export const settings = createSettings(data);
