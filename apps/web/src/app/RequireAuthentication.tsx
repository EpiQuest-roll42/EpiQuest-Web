import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useRouteStatus } from './routeStatusHooks';
import { useSession } from '../viewModels/useSession';

interface RequireAuthenticationProps {
  children?: ReactNode;
}

export function RequireAuthentication({ children }: RequireAuthenticationProps) {
  const { isAuthenticated, isLoading, error } = useSession();
  const location = useLocation();
  useRouteStatus(isLoading ? 'Vérification de la session…' : '');

  if (isLoading) {
    return null;
  }
  if (error !== null) {
    return <p role="alert">{error}</p>;
  }
  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/connexion" state={{ returnTo }} replace />;
  }

  return children === undefined ? <Outlet /> : children;
}
