import { useState, useSyncExternalStore } from 'react';
import type {
  ThemePreference,
  ThemePreferenceStorage,
} from '../models/preferences/themePreferenceStorage';
import { systemColorScheme } from '../models/preferences/systemColorScheme';
import type { SystemColorScheme } from '../models/preferences/systemColorScheme';

export interface ThemePreferenceScreenState {
  palette: ThemePreference;
  chosenPalette: ThemePreference | null;
  choosePalette: (palette: ThemePreference) => void;
}

function getServerPalette(): ThemePreference {
  return 'clair';
}

export interface ThemePreferenceOptions {
  systemColorScheme?: SystemColorScheme;
  initialPreference?: ThemePreference | null;
}

export function useThemePreference(
  storage: ThemePreferenceStorage,
  {
    systemColorScheme: colorScheme = systemColorScheme,
    initialPreference,
  }: ThemePreferenceOptions = {},
): ThemePreferenceScreenState {
  const [chosenPalette, setChosenPalette] = useState<ThemePreference | null>(() =>
    initialPreference === undefined ? storage.read() : initialPreference,
  );
  const systemPalette = useSyncExternalStore(
    colorScheme.subscribe,
    colorScheme.read,
    getServerPalette,
  );

  function choosePalette(palette: ThemePreference) {
    setChosenPalette(palette);
    storage.write(palette);
  }

  return {
    palette: chosenPalette ?? systemPalette,
    chosenPalette,
    choosePalette,
  };
}
