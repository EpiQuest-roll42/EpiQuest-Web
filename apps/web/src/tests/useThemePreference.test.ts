import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createThemePreferenceStorage } from '../models/preferences/themePreferenceStorage';
import type { ThemePreference } from '../models/preferences/themePreferenceStorage';
import type { SystemColorScheme } from '../models/preferences/systemColorScheme';
import { useThemePreference } from '../viewModels/useThemePreference';
import { createFailingStorage, createMemoryStorage } from './storageFixtures';

function createSystemColorScheme({ dark }: { dark: boolean }) {
  let isDark = dark;
  const listeners = new Set<() => void>();
  const system: SystemColorScheme = {
    read: vi.fn((): ThemePreference => (isDark ? 'table' : 'clair')),
    subscribe: vi.fn((onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    }),
  };

  return {
    system,
    listenerCount: () => listeners.size,
    /** Simulates the user switching their operating system to dark or light mode. */
    setDark(next: boolean) {
      isDark = next;
      listeners.forEach((listener) => listener());
    },
  };
}

function createStorage(browserStorage: Storage = createMemoryStorage()) {
  return createThemePreferenceStorage(() => browserStorage);
}

describe('useThemePreference', () => {
  it('follows the light system scheme while the user has not chosen', () => {
    const colorScheme = createSystemColorScheme({ dark: false });

    const storage = createStorage();

    const { result } = renderHook(() =>
      useThemePreference(storage, { systemColorScheme: colorScheme.system }),
    );

    expect(result.current.palette).toBe('clair');
    expect(result.current.chosenPalette).toBeNull();
  });

  it('follows the dark system scheme while the user has not chosen', () => {
    const colorScheme = createSystemColorScheme({ dark: true });

    const storage = createStorage();

    const { result } = renderHook(() =>
      useThemePreference(storage, { systemColorScheme: colorScheme.system }),
    );

    expect(result.current.palette).toBe('table');
    expect(result.current.chosenPalette).toBeNull();
  });

  it('reads the injected system color scheme', () => {
    const colorScheme = createSystemColorScheme({ dark: false });

    const storage = createStorage();

    renderHook(() => useThemePreference(storage, { systemColorScheme: colorScheme.system }));

    expect(colorScheme.system.read).toHaveBeenCalled();
  });

  it('prefers the saved choice over the system scheme', () => {
    const colorScheme = createSystemColorScheme({ dark: true });
    const storage = createStorage();
    storage.write('clair');

    const { result } = renderHook(() =>
      useThemePreference(storage, { systemColorScheme: colorScheme.system }),
    );

    expect(result.current.palette).toBe('clair');
    expect(result.current.chosenPalette).toBe('clair');
  });

  it('switches to the chosen palette and saves the choice', () => {
    const colorScheme = createSystemColorScheme({ dark: false });
    const browserStorage = createMemoryStorage();
    const storage = createStorage(browserStorage);
    const { result } = renderHook(() =>
      useThemePreference(storage, { systemColorScheme: colorScheme.system }),
    );

    act(() => result.current.choosePalette('table'));

    expect(result.current.palette).toBe('table');
    expect(result.current.chosenPalette).toBe('table');
    expect(createStorage(browserStorage).read()).toBe('table');
  });

  it('follows a system scheme change while the user has not chosen', () => {
    const colorScheme = createSystemColorScheme({ dark: false });
    const storage = createStorage();
    const { result } = renderHook(() =>
      useThemePreference(storage, { systemColorScheme: colorScheme.system }),
    );

    act(() => colorScheme.setDark(true));
    expect(result.current.palette).toBe('table');

    act(() => colorScheme.setDark(false));
    expect(result.current.palette).toBe('clair');
    expect(result.current.chosenPalette).toBeNull();
  });

  it('ignores system scheme changes once the user has chosen', () => {
    const colorScheme = createSystemColorScheme({ dark: false });
    const storage = createStorage();
    const { result } = renderHook(() =>
      useThemePreference(storage, { systemColorScheme: colorScheme.system }),
    );

    act(() => result.current.choosePalette('clair'));
    act(() => colorScheme.setDark(true));

    expect(result.current.palette).toBe('clair');
    expect(result.current.chosenPalette).toBe('clair');
  });

  it('keeps the choice for the session when it cannot be saved', () => {
    const colorScheme = createSystemColorScheme({ dark: false });
    const storage = createStorage(createFailingStorage());
    const { result } = renderHook(() =>
      useThemePreference(storage, { systemColorScheme: colorScheme.system }),
    );

    act(() => result.current.choosePalette('table'));

    expect(result.current.palette).toBe('table');
    expect(result.current.chosenPalette).toBe('table');
  });

  it('stops listening to the system scheme when unmounted', () => {
    const colorScheme = createSystemColorScheme({ dark: false });
    const storage = createStorage();
    const { unmount } = renderHook(() =>
      useThemePreference(storage, { systemColorScheme: colorScheme.system }),
    );
    expect(colorScheme.listenerCount()).toBeGreaterThan(0);

    unmount();

    expect(colorScheme.listenerCount()).toBe(0);
  });

  it('reads saved storage only on the first render', () => {
    const colorScheme = createSystemColorScheme({ dark: false });
    const storage = createStorage();
    const read = vi.spyOn(storage, 'read');
    const { rerender } = renderHook(() =>
      useThemePreference(storage, { systemColorScheme: colorScheme.system }),
    );

    rerender();

    expect(read).toHaveBeenCalledTimes(1);
  });
});
