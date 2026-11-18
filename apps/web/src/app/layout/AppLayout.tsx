import { Outlet, NavLink, Link } from 'react-router';
import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useMatches } from 'react-router';
import { Suspense } from 'react';
import { Check } from 'lucide-react';
import { isRouteHandle } from '../RouteHandle';
import { RouteStatusRegion } from './RouteStatusRegion';
import { RouteLoadingFallback } from './RouteLoadingFallback';
import { useThemePreferenceStorage } from '../useThemePreferenceStorage';
import { useThemePreference } from '../../viewModels/useThemePreference';
import { applyThemePreference } from '../themePreferenceDom';

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
  const { storage, initialPreference } = useThemePreferenceStorage();
  const { palette, chosenPalette, choosePalette } = useThemePreference(storage, {
    initialPreference,
  });

  useEffect(() => {
    applyThemePreference(chosenPalette, document.documentElement);
  }, [chosenPalette]);

  useEffect(() => () => document.documentElement.removeAttribute('data-theme'), []);

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
        <button
          className="button-toggle"
          type="button"
          aria-pressed={palette === 'table'}
          onClick={() => choosePalette(palette === 'table' ? 'clair' : 'table')}
        >
          {palette === 'table' && (
            <Check className="button-toggle__icon" aria-hidden="true" size="1em" />
          )}
          Palette table de jeu
        </button>
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
