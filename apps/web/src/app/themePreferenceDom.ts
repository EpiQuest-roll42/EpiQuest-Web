import type {
  ThemePreference,
  ThemePreferenceStorage,
} from '../models/preferences/themePreferenceStorage';

export function applyThemePreference(
  preference: ThemePreference | null,
  root: Pick<HTMLElement, 'setAttribute' | 'removeAttribute'>,
): void {
  if (preference === null) {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', preference);
  }
}

export function initializeThemePreference(
  storage: ThemePreferenceStorage,
  root: Pick<HTMLElement, 'setAttribute' | 'removeAttribute'>,
): ThemePreference | null {
  const preference = storage.read();
  applyThemePreference(preference, root);
  return preference;
}
