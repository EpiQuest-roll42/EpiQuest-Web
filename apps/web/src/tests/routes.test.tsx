import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { createMockCampaignRepository } from '../models/repositories/mockCampaignRepository';
import { createMockSessionRepository } from '../models/repositories/mockSessionRepository';
import type { CurrentUser } from '../models/api/schema';
import type { Repositories } from '../models/repositories/Repositories';
import { RepositoriesProvider } from '../app/RepositoriesProvider';
import { currentUserQueryKey } from '../viewModels/useSession';
import { appRoutes } from '../app/routes';

vi.mock('../views/CampaignListView', () => ({
  CampaignListView: () => <h1 tabIndex={-1}>Mes campagnes</h1>,
}));

const authenticatedUser: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'RolePlayMaster',
  email: 'roleplaymaster@example.test',
  createdAt: '2026-11-02T18:15:00Z',
};

function createRepositories(session = createMockSessionRepository()): Repositories {
  return {
    campaigns: createMockCampaignRepository(),
    session,
  };
}

function renderRoutes(path: string, options: { session?: Repositories['session'] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <RepositoriesProvider repositories={createRepositories(options.session)}>
        <RouterProvider router={router} />
      </RepositoriesProvider>
    </QueryClientProvider>,
  );
  return { router, queryClient };
}

describe('appRoutes', () => {
  it.each([
    ['/connexion', 'Connexion', 'anonymous'],
    ['/inscription', 'Inscription', 'authenticated'],
    ['/campagnes', 'Mes campagnes', 'authenticated'],
    ['/campagnes/00000000-0000-4000-8000-000000000001', 'Campagne', 'authenticated'],
    ['/rejoindre', 'Rejoindre une campagne', 'authenticated'],
    ['/vue-joueurs', 'Vue joueurs', 'anonymous'],
    ['/adresse-inconnue', 'Page introuvable', 'authenticated'],
  ] as const)('renders the appropriate heading at %s', async (path, heading, session) => {
    const router = renderRoutes(path, {
      session: createMockSessionRepository(session === 'anonymous' ? null : undefined),
    }).router;

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe(`${heading} · Lanterne`));
    expect(screen.getByRole('heading', { name: heading })).toHaveAttribute('tabindex', '-1');
    router.dispose();
  });

  it('renders the not-found page inside the standard layout', async () => {
    const { router } = renderRoutes('/adresse-inconnue');

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    router.dispose();
  });

  it('marks the current navigation link with aria-current', async () => {
    const { router } = renderRoutes('/campagnes');

    expect(await screen.findByRole('link', { name: 'Mes campagnes' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Rejoindre une campagne' })).not.toHaveAttribute(
      'aria-current',
    );
    router.dispose();
  });

  it('redirects the root path to the campaign list', async () => {
    const { router } = renderRoutes('/');

    const heading = await screen.findByRole('heading', { name: 'Mes campagnes' });
    expect(heading).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/campagnes'));
    expect(document.activeElement).not.toBe(heading);
    router.dispose();
  });

  it('renders the player display without application navigation and with one main landmark', async () => {
    const { router } = renderRoutes('/vue-joueurs');

    expect(await screen.findByRole('heading', { name: 'Vue joueurs' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    router.dispose();
  });

  it('does not render a protected page while the session is loading', async () => {
    const session = {
      getCurrentUser: () => new Promise<CurrentUser | null>(() => {}),
    };
    const { router } = renderRoutes('/campagnes', { session });

    const status = await screen.findByRole('status');
    await waitFor(() => expect(status).toHaveTextContent('Vérification de la session'));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(status.closest('main')).toBe(screen.getByRole('main'));
    expect(screen.queryByRole('heading', { name: 'Mes campagnes' })).not.toBeInTheDocument();
    router.dispose();
  });

  it('moves focus to the protected page heading after the session finishes loading', async () => {
    const user = userEvent.setup();
    let resolveSession: ((user: CurrentUser) => void) | undefined;
    const session = {
      getCurrentUser: () =>
        new Promise<CurrentUser>((resolve) => {
          resolveSession = resolve;
        }),
    };
    const { router } = renderRoutes('/inscription', { session });

    await screen.findByRole('heading', { name: 'Inscription' });
    await user.click(screen.getByRole('link', { name: 'Mes campagnes' }));
    const status = await screen.findByRole('status');
    await waitFor(() => expect(status).toHaveTextContent('Vérification de la session'));
    expect(screen.queryByRole('heading', { name: 'Mes campagnes' })).not.toBeInTheDocument();

    await act(async () => resolveSession?.(authenticatedUser));

    const heading = await screen.findByRole('heading', { name: 'Mes campagnes' });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(status.closest('main')).toBe(screen.getByRole('main'));
    router.dispose();
  });

  it('does not steal focus if the user tabs elsewhere while a protected route loads', async () => {
    const user = userEvent.setup();
    let resolveSession: ((user: CurrentUser) => void) | undefined;
    const session = {
      getCurrentUser: () =>
        new Promise<CurrentUser>((resolve) => {
          resolveSession = resolve;
        }),
    };
    const { router } = renderRoutes('/inscription', { session });

    await screen.findByRole('heading', { name: 'Inscription' });
    await user.click(screen.getByRole('link', { name: 'Mes campagnes' }));
    await screen.findByRole('status');
    await user.tab();
    const focusedLink = screen.getByRole('link', { name: 'Rejoindre une campagne' });
    expect(document.activeElement).toBe(focusedLink);

    await act(async () => resolveSession?.(authenticatedUser));

    await screen.findByRole('heading', { name: 'Mes campagnes' });
    expect(document.activeElement).toBe(focusedLink);
    router.dispose();
  });

  it('redirects unauthenticated users to login and returns to the requested URL after login', async () => {
    let currentUser: CurrentUser | null = null;
    const session = {
      getCurrentUser: async () => currentUser,
    };
    const { router, queryClient } = renderRoutes('/rejoindre#7KQ2M-9XMAT', { session });

    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/connexion');
    expect(router.state.location.state).toEqual({ returnTo: '/rejoindre#7KQ2M-9XMAT' });

    currentUser = authenticatedUser;
    await act(async () => {
      queryClient.setQueryData(currentUserQueryKey, authenticatedUser);
    });

    expect(await screen.findByText('7KQ2M-9XMAT')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/rejoindre');
    expect(router.state.location.hash).toBe('#7KQ2M-9XMAT');
    router.dispose();
  });

  it('does not move focus on first load and focuses the new heading after keyboard navigation', async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes('/campagnes');
    const campaignsHeading = await screen.findByRole('heading', { name: 'Mes campagnes' });

    expect(document.activeElement).not.toBe(campaignsHeading);
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('link', { name: 'Rejoindre une campagne' }),
    );
    await user.keyboard('{Enter}');

    const joinHeading = await screen.findByRole('heading', { name: 'Rejoindre une campagne' });
    await waitFor(() => expect(document.activeElement).toBe(joinHeading));
    router.dispose();
  });

  it('places the skip link first in keyboard order and moves focus to main', async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes('/campagnes');
    await screen.findByRole('heading', { name: 'Mes campagnes' });

    await user.tab();
    const skipLink = screen.getByRole('link', { name: 'Aller au contenu' });
    expect(document.activeElement).toBe(skipLink);

    await user.click(skipLink);
    expect(document.activeElement).toBe(screen.getByRole('main'));
    router.dispose();
  });

  it('removes the player display token from the browser address after loading', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/vue-joueurs#secret-token'] });

    render(
      <QueryClientProvider client={queryClient}>
        <RepositoriesProvider repositories={createRepositories(createMockSessionRepository(null))}>
          <RouterProvider router={router} />
        </RepositoriesProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Vue joueurs' })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.hash).toBe(''));
    expect(screen.queryByText('secret-token')).not.toBeInTheDocument();
    router.dispose();
  });

  it('rejects a backslash-based external return URL', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(currentUserQueryKey, authenticatedUser);
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [{ pathname: '/connexion', state: { returnTo: '/\\evil.example' } }],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepositoriesProvider repositories={createRepositories()}>
          <RouterProvider router={router} />
        </RepositoriesProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Mes campagnes' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/campagnes');
    router.dispose();
  });

  it('reports the missing player display token', async () => {
    const { router } = renderRoutes('/vue-joueurs');

    expect(
      await screen.findByText(/Ouvrez la vue depuis l’écran du maître du jeu/),
    ).toBeInTheDocument();
    router.dispose();
  });

  it('has no axe violations in the standard layout', async () => {
    const { router } = renderRoutes('/campagnes');
    await screen.findByRole('heading', { name: 'Mes campagnes' });

    const accessibility = await axe(document.body);
    expect(accessibility.violations).toEqual([]);
    router.dispose();
  });
});
