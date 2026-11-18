export type ThemePreference = 'clair' | 'table';

const THEME_PREFERENCE_KEY = 'lanterne.theme';

export interface ThemePreferenceStorage {
  read(): ThemePreference | null;
  write(preference: ThemePreference): void;
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'clair' || value === 'table';
}

export function createThemePreferenceStorage(getStorage: () => Storage): ThemePreferenceStorage {
  return {
    read() {
      try {
        const value = getStorage().getItem(THEME_PREFERENCE_KEY);
        return isThemePreference(value) ? value : null;
      } catch {
        return null;
      }
    },
    write(preference: ThemePreference) {
      try {
        getStorage().setItem(THEME_PREFERENCE_KEY, preference);
      } catch {
        // Storage is optional for now;
      }
    },
  };
}
