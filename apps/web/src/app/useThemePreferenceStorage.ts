import { useContext } from 'react';
import { ThemePreferenceStorageContext } from './themePreferenceStorageContext';
import type { ThemePreferenceStorageContextValue } from './themePreferenceStorageContext';

export function useThemePreferenceStorage(): ThemePreferenceStorageContextValue {
  const preferences = useContext(ThemePreferenceStorageContext);
  if (preferences === null) {
    throw new Error('Les préférences de thème doivent être fournies à l’application.');
  }
  return preferences;
}
