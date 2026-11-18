import type { PropsWithChildren } from 'react';
import type {
  ThemePreference,
  ThemePreferenceStorage,
} from '../models/preferences/themePreferenceStorage';
import { ThemePreferenceStorageContext } from './themePreferenceStorageContext';

export function ThemePreferenceStorageProvider({
  storage,
  initialPreference,
  children,
}: PropsWithChildren<{
  storage: ThemePreferenceStorage;
  initialPreference: ThemePreference | null;
}>) {
  return (
    <ThemePreferenceStorageContext.Provider value={{ storage, initialPreference }}>
      {children}
    </ThemePreferenceStorageContext.Provider>
  );
}
