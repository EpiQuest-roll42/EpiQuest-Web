import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from './layout/AppLayout';
import { PlayerDisplayLayout } from './layout/PlayerDisplayLayout';
import { RouteTitleLayout } from './layout/RouteTitleLayout';
import type { RouteHandle } from './RouteHandle';
import { CampaignListView } from '../views/CampaignListView';
import { GameMasterView } from '../views/GameMasterView';
import { JoinCampaignView } from '../views/JoinCampaignView';
import { LoginView } from '../views/LoginView';
import { NotFoundView } from '../views/NotFoundView';
import { PlayerDisplayView } from '../views/PlayerDisplayView';
import { RegisterView } from '../views/RegisterView';

export const appRoutes: RouteObject[] = [
  {
    element: <RouteTitleLayout />,
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
            element: <CampaignListView />,
            handle: { title: 'Mes campagnes' } satisfies RouteHandle,
          },
          {
            path: 'campagnes/:campaignId',
            element: <GameMasterView />,
            handle: { title: 'Campagne' } satisfies RouteHandle,
          },
          {
            path: 'rejoindre',
            element: <JoinCampaignView />,
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
            element: <PlayerDisplayView />,
            handle: { title: 'Vue joueurs' } satisfies RouteHandle,
          },
        ],
      },
    ],
  },
];
