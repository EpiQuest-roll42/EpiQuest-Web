import { useRouteStatus } from '../routeStatusHooks';

export function RouteLoadingFallback() {
  useRouteStatus('Chargement de la page…');
  return null;
}
