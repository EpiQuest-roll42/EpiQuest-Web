import { describe, expect, it } from 'vitest';
import { createThemePreferenceStorage } from '../models/preferences/themePreferenceStorage';

/** A Storage kept in memory, standing in for the browser localStorage. */
function createMemoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, String(value));
    },
  };
}

/** A Storage whose every access fails, as when storage is full or blocked. */
function createFailingStorage(): Storage {
  const fail = (): never => {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
  };
  return {
    get length() {
      return fail();
    },
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}

/** Saves a choice, then returns the single key the storage wrote it under. */
function keyUsedBy(storage: Storage): string {
  createThemePreferenceStorage(() => storage).write('table');
  expect(storage.length).toBe(1);
  const key = storage.key(0);
  if (key === null) throw new Error('The preference was not saved.');
  return key;
}

describe('theme preference storage', () => {
  it('returns null when the user has not chosen a palette yet', () => {
    const preferences = createThemePreferenceStorage(() => createMemoryStorage());

    expect(preferences.read()).toBeNull();
  });

  it('returns the palette the user chose last', () => {
    const browserStorage = createMemoryStorage();
    const preferences = createThemePreferenceStorage(() => browserStorage);

    preferences.write('table');
    expect(preferences.read()).toBe('table');

    preferences.write('clair');
    expect(preferences.read()).toBe('clair');
  });

  it('keeps the choice after a reload', () => {
    const browserStorage = createMemoryStorage();
    createThemePreferenceStorage(() => browserStorage).write('table');

    const afterReload = createThemePreferenceStorage(() => browserStorage);

    expect(afterReload.read()).toBe('table');
  });

  it('saves the choice under a single key named after the application', () => {
    const browserStorage = createMemoryStorage();

    expect(keyUsedBy(browserStorage)).toMatch(/^lanterne\./);
  });

  it.each(['dark', 'TABLE', '"table"', ''])(
    'treats an unknown saved value (%j) as no choice',
    (savedValue) => {
      const browserStorage = createMemoryStorage();
      browserStorage.setItem(keyUsedBy(browserStorage), savedValue);

      const preferences = createThemePreferenceStorage(() => browserStorage);

      expect(preferences.read()).toBeNull();
    },
  );

  it('does not throw when the browser refuses access to storage', () => {
    const blocked = () => {
      throw new DOMException('Access to storage is denied.', 'SecurityError');
    };

    const preferences = createThemePreferenceStorage(blocked);

    expect(preferences.read()).toBeNull();
    expect(() => preferences.write('table')).not.toThrow();
  });

  it('does not throw when reading or writing fails', () => {
    const preferences = createThemePreferenceStorage(() => createFailingStorage());

    expect(preferences.read()).toBeNull();
    expect(() => preferences.write('table')).not.toThrow();
  });
});
