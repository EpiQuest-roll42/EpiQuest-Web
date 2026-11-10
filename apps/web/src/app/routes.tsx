import { Navigate, type RouteObject } from 'react-router';
import { RequireAuthentication } from './RequireAuthentication';
import { AppLayout } from './layout/AppLayout';
import { PlayerDisplayLayout } from './layout/PlayerDisplayLayout';
import { RouteHydrateFallback } from './layout/RouteHydrateFallback';
import { RouteTitleLayout } from './layout/RouteTitleLayout';
import type { RouteHandle } from './RouteHandle';
import { CampaignListView } from '../views/CampaignListView';
import { JoinCampaignView } from '../views/JoinCampaignView';
import { LoginView } from '../views/LoginView';
import { NotFoundView } from '../views/NotFoundView';
import { RegisterView } from '../views/RegisterView';

export const appRoutes: RouteObject[] = [
  {
    element: <RouteTitleLayout />,
    HydrateFallback: RouteHydrateFallback,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/campagnes" replace />,
          },
          {
            path: 'connexion',
            element: <LoginView />,
            handle: { title: 'Connexion' } satisfies RouteHandle,
          },
          {
            path: 'inscription',
            element: <RegisterView />,
            handle: { title: 'Inscription' } satisfies RouteHandle,
          },
          {
            path: 'campagnes',
            element: <RequireAuthentication />,
            children: [
              {
                index: true,
                element: <CampaignListView />,
                handle: { title: 'Mes campagnes' } satisfies RouteHandle,
              },
              {
                path: ':campaignId',
                lazy: async () => {
                  const { GameMasterView } = await import('../views/GameMasterView');
                  return { Component: GameMasterView };
                },
                handle: { title: 'Campagne' } satisfies RouteHandle,
              },
            ],
          },
          {
            path: 'rejoindre',
            element: (
              <RequireAuthentication>
                <JoinCampaignView />
              </RequireAuthentication>
            ),
            handle: { title: 'Rejoindre une campagne' } satisfies RouteHandle,
          },
          {
            path: '*',
            element: <NotFoundView />,
            handle: { title: 'Page introuvable' } satisfies RouteHandle,
          },
        ],
      },
      {
        path: '/vue-joueurs',
        element: <PlayerDisplayLayout />,
        children: [
          {
            index: true,
            lazy: async () => {
              const { PlayerDisplayView } = await import('../views/PlayerDisplayView');
              return { Component: PlayerDisplayView };
            },
            handle: { title: 'Vue joueurs' } satisfies RouteHandle,
          },
        ],
      },
    ],
  },
];
