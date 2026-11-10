import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../app/routes';

vi.mock('../views/CampaignListView', () => ({
  CampaignListView: () => <h1>Mes campagnes</h1>,
}));

describe('appRoutes', () => {
  it.each([
    ['/connexion', 'Connexion'],
    ['/inscription', 'Inscription'],
    ['/campagnes', 'Mes campagnes'],
    ['/campagnes/00000000-0000-4000-8000-000000000001', 'Campagne'],
    ['/rejoindre', 'Rejoindre une campagne'],
    ['/vue-joueurs', 'Vue joueurs'],
    ['/adresse-inconnue', 'Page introuvable'],
  ])('renders the appropriate heading at %s', async (path, heading) => {
    const router = createMemoryRouter(appRoutes, { initialEntries: [path] });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe(`${heading} · Lanterne`));
  });

  it('renders the not-found page inside the standard layout', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/adresse-inconnue'] });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('marks the current navigation link with aria-current', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/campagnes'] });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('link', { name: 'Mes campagnes' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Rejoindre une campagne' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('redirects the root path to the campaign list', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/'] });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Mes campagnes' })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/campagnes'));
  });

  it('renders the player display without the application navigation layout', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/vue-joueurs'] });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Vue joueurs' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });
});
