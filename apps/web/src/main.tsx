import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { createRepositories } from './app/createRepositories';
import { queryClient } from './app/queryClient';
import { RepositoriesProvider } from './app/RepositoriesProvider';
import './index.css';

const root = createRoot(document.getElementById('root')!);

void createRepositories()
  .then((repositories) => {
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RepositoriesProvider repositories={repositories}>
            <App />
          </RepositoriesProvider>
        </QueryClientProvider>
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
