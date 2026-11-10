import { useRouteStatusMessage } from '../routeStatusHooks';

export function RouteStatusRegion() {
  const message = useRouteStatusMessage();
  return (
    <p role="status" aria-live="polite">
      {message}
    </p>
  );
}
