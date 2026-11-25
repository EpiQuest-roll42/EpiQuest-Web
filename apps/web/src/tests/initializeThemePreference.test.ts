import { describe, expect, it, vi } from 'vitest';
import { initializeThemePreference } from '../app/themePreferenceDom';
import { createThemePreferenceStorage } from '../models/preferences/themePreferenceStorage';
import { createMemoryStorage } from './storageFixtures';

describe('initializeThemePreference', () => {
  it('removes the theme attribute when no preference is saved', () => {
    const root = document.createElement('html');
    root.setAttribute('data-theme', 'table');
    const storage = createThemePreferenceStorage(() => createMemoryStorage());

    expect(initializeThemePreference(storage, root)).toBeNull();
    expect(root).not.toHaveAttribute('data-theme');
  });

  it('reads and applies a saved preference before returning it', () => {
    const root = document.createElement('html');
    const memoryStorage = createMemoryStorage();
    memoryStorage.setItem('lanterne.theme', 'table');
    const storage = createThemePreferenceStorage(() => memoryStorage);
    const read = vi.spyOn(storage, 'read');

    expect(initializeThemePreference(storage, root)).toBe('table');
    expect(read).toHaveBeenCalledTimes(1);
    expect(root).toHaveAttribute('data-theme', 'table');
  });
});
