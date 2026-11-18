import { createContext } from 'react';
import type {
  ThemePreference,
  ThemePreferenceStorage,
} from '../models/preferences/themePreferenceStorage';

export interface ThemePreferenceStorageContextValue {
  storage: ThemePreferenceStorage;
  initialPreference: ThemePreference | null;
}

export const ThemePreferenceStorageContext =
  createContext<ThemePreferenceStorageContextValue | null>(null);
