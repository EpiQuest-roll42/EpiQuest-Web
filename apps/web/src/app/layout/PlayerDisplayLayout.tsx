import { useEffect } from 'react';
import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { RouteLoadingFallback } from './RouteLoadingFallback';
import { RouteStatusRegion } from './RouteStatusRegion';

export function PlayerDisplayLayout() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'table');
    document.documentElement.setAttribute('data-text-scale', 'table');

    return () => {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-text-scale');
    };
  }, []);

  return (
    <main>
      <RouteStatusRegion />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Outlet />
      </Suspense>
    </main>
  );
}
