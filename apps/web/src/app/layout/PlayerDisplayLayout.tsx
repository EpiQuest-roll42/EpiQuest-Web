import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { RouteLoadingFallback } from './RouteLoadingFallback';
import { RouteStatusRegion } from './RouteStatusRegion';

export function PlayerDisplayLayout() {
  return (
    <main>
      <RouteStatusRegion />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Outlet />
      </Suspense>
    </main>
  );
}
