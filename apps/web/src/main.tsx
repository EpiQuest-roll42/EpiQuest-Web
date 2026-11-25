import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { createRepositories } from './app/createRepositories';
import { queryClient } from './app/queryClient';
import { RepositoriesProvider } from './app/RepositoriesProvider';
import { initializeThemePreference } from './app/themePreferenceDom';
import { ThemePreferenceStorageProvider } from './app/ThemePreferenceStorageProvider';
import { createThemePreferenceStorage } from './models/preferences/themePreferenceStorage';
import './index.css';

const themePreferenceStorage = createThemePreferenceStorage(() => window.localStorage);
const initialThemePreference = initializeThemePreference(
  themePreferenceStorage,
  document.documentElement,
);

const root = createRoot(document.getElementById('root')!);

void createRepositories()
  .then((repositories) => {
    root.render(
      <StrictMode>
        <ThemePreferenceStorageProvider
          storage={themePreferenceStorage}
          initialPreference={initialThemePreference}
        >
          <QueryClientProvider client={queryClient}>
            <RepositoriesProvider repositories={repositories}>
              <App />
            </RepositoriesProvider>
          </QueryClientProvider>
        </ThemePreferenceStorageProvider>
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    console.error('Impossible de configurer les repositories.', error);
    const message = error instanceof Error ? error.message : 'Erreur de configuration inconnue.';
    root.render(
      <main role="alert">
        <h1>Configuration indisponible</h1>
        <p>{message}</p>
      </main>,
    );
  });
