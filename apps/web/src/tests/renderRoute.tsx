import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RepositoriesProvider } from '../app/RepositoriesProvider';
import { ThemePreferenceStorageProvider } from '../app/ThemePreferenceStorageProvider';
import { appRoutes } from '../app/routes';
import { createThemePreferenceStorage } from '../models/preferences/themePreferenceStorage';
import { createMockCampaignRepository } from '../models/repositories/mockCampaignRepository';
import { createMockSessionRepository } from '../models/repositories/mockSessionRepository';
import type { Repositories } from '../models/repositories/Repositories';
import { createMemoryStorage } from './storageFixtures';

/** Renders the real application routes at `path`, on simulated data, as main.tsx would. */
export function renderRoute(path: string, { session }: { session?: Repositories['session'] } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  const repositories: Repositories = {
    campaigns: createMockCampaignRepository(),
    session: session ?? createMockSessionRepository(),
  };
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ThemePreferenceStorageProvider
        storage={createThemePreferenceStorage(() => createMemoryStorage())}
        initialPreference={null}
      >
        <RepositoriesProvider repositories={repositories}>
          <RouterProvider router={router} />
        </RepositoriesProvider>
      </ThemePreferenceStorageProvider>
    </QueryClientProvider>,
  );
  return { ...view, router };
}
