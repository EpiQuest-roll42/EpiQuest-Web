import { Outlet, NavLink, Link } from 'react-router';
import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useMatches } from 'react-router';
import { Suspense } from 'react';
import { isRouteHandle } from '../RouteHandle';
import { RouteStatusRegion } from './RouteStatusRegion';
import { RouteLoadingFallback } from './RouteLoadingFallback';

export function DocumentTitleManager() {
  const matches = useMatches();

  useEffect(() => {
    const currentMatch = matches[matches.length - 1];
    const routeTitle = isRouteHandle(currentMatch?.handle) ? currentMatch.handle.title : undefined;

    if (routeTitle) {
      document.title = `${routeTitle} · Lanterne`;
    } else {
      document.title = 'Lanterne';
    }
  }, [matches]);

  return null;
}

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);

  function focusMain(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    mainRef.current?.focus();
  }

  return (
    <>
      <a href="#contenu-principal" className="skip-link" onClick={focusMain}>
        Aller au contenu
      </a>

      <header>
        <Link to="/campagnes">Lanterne</Link>
      </header>

      <nav aria-label="Navigation principale">
        <ul>
          <li>
            <NavLink to="/campagnes">Mes campagnes</NavLink>
          </li>
          <li>
            <NavLink to="/rejoindre">Rejoindre une campagne</NavLink>
          </li>
        </ul>
      </nav>

      <main id="contenu-principal" ref={mainRef} tabIndex={-1}>
        <RouteStatusRegion />
        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
