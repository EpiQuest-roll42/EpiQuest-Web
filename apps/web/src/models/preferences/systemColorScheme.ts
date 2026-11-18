import type { ThemePreference } from './themePreferenceStorage';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export interface SystemColorScheme {
  read(): ThemePreference;
  subscribe(onChange: () => void): () => void;
}

function getDarkSchemeQuery(): MediaQueryList | null {
  if (typeof window.matchMedia !== 'function') {
    return null;
  }

  try {
    return window.matchMedia(DARK_SCHEME_QUERY);
  } catch {
    return null;
  }
}

export const systemColorScheme: SystemColorScheme = {
  read() {
    return getDarkSchemeQuery()?.matches ? 'table' : 'clair';
  },
  subscribe(onChange) {
    const query = getDarkSchemeQuery();
    if (query === null) {
      return () => {};
    }

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  },
};
