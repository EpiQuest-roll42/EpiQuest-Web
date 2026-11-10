import { Outlet, NavLink, Link } from 'react-router';
import { useEffect } from 'react';
import { useMatches } from 'react-router';
import { isRouteHandle } from '../RouteHandle';

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
  return (
    <>
      <a href="#contenu-principal" className="skip-link">
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

      <main id="contenu-principal" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
