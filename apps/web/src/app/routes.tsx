import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from './layout/AppLayout';
import { PlayerDisplayLayout } from './layout/PlayerDisplayLayout';
import { CampaignListView } from '../views/CampaignListView';
import { GameMasterView } from '../views/GameMasterView';
import { JoinCampaignView } from '../views/JoinCampaignView';
import { LoginView } from '../views/LoginView';
import { NotFoundView } from '../views/NotFoundView';
import { PlayerDisplayView } from '../views/PlayerDisplayView';
import { RegisterView } from '../views/RegisterView';

export const appRoutes: RouteObject[] = [
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
      },
      {
        path: 'inscription',
        element: <RegisterView />,
      },
      {
        path: 'campagnes',
        element: <CampaignListView />,
      },
      {
        path: 'campagnes/:campaignId',
        element: <GameMasterView />,
      },
      {
        path: 'rejoindre',
        element: <JoinCampaignView />,
      },
      {
        path: '*',
        element: <NotFoundView />,
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
      },
    ],
  },
];
