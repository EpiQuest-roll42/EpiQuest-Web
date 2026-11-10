import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isValidElement } from 'react';
import { createMemoryRouter, Navigate, RouterProvider, type RouteObject } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';
import { RouteTitleLayout } from '../app/layout/RouteTitleLayout';
import { isRouteHandle } from '../app/RouteHandle';
import { appRoutes } from '../app/routes';

vi.mock('../views/CampaignListView', () => ({
  CampaignListView: () => <h1>Mes campagnes</h1>,
}));

function isRedirect(route: RouteObject): boolean {
  return isValidElement(route.element) && route.element.type === Navigate;
}

function collectDisplayedLeafRoutes(routes: RouteObject[]): RouteObject[] {
  return routes.flatMap((route) =>
    route.children ? collectDisplayedLeafRoutes(route.children) : isRedirect(route) ? [] : [route],
  );
}

describe('document title', () => {
  it('is declared by every displayed route', () => {
    const routesWithoutTitle = collectDisplayedLeafRoutes(appRoutes)
      .filter((route) => !isRouteHandle(route.handle))
      .map((route) => route.path ?? '(index)');

    expect(routesWithoutTitle).toEqual([]);
  });

  it('follows client-side navigation', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/campagnes'] });
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(document.title).toBe('Mes campagnes · Lanterne'));

    await user.click(screen.getByRole('link', { name: 'Rejoindre une campagne' }));

    await waitFor(() => expect(document.title).toBe('Rejoindre une campagne · Lanterne'));
  });

  it('falls back to the product name when a route declares no title', async () => {
    const router = createMemoryRouter(
      [{ element: <RouteTitleLayout />, children: [{ path: '/', element: <h1>Sans titre</h1> }] }],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    await screen.findByRole('heading', { name: 'Sans titre' });
    await waitFor(() => expect(document.title).toBe('Lanterne'));
  });

  it('is set when the real application starts', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Mes campagnes' })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Mes campagnes · Lanterne'));
  });
});
