import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigation, useNavigationType } from 'react-router';
import { RouteStatusProvider } from '../RouteStatusProvider';
import { useRouteStatus } from '../routeStatusHooks';
import { DocumentTitleManager } from './AppLayout';

export function RouteTitleLayout() {
  return (
    <RouteStatusProvider>
      <RouteTitleLayoutContent />
    </RouteStatusProvider>
  );
}

function RouteTitleLayoutContent() {
  const location = useLocation();
  const navigation = useNavigation();
  const navigationType = useNavigationType();
  const previousLocationKey = useRef<string | null>(null);
  const isFirstLocationChange = useRef(true);
  const focusObserver = useRef<MutationObserver | null>(null);
  const cancelPendingFocus = useRef<(() => void) | null>(null);
  useRouteStatus(navigation.state === 'idle' ? '' : 'Chargement de la page…');

  useEffect(() => {
    if (previousLocationKey.current === null) {
      previousLocationKey.current = location.key;
      return;
    }

    if (previousLocationKey.current === location.key) {
      return;
    }

    previousLocationKey.current = location.key;
    focusObserver.current?.disconnect();
    focusObserver.current = null;
    cancelPendingFocus.current?.();
    cancelPendingFocus.current = null;
    const isInitialRedirect = isFirstLocationChange.current && navigationType === 'REPLACE';
    isFirstLocationChange.current = false;
    if (isInitialRedirect) {
      return;
    }

    const main = document.querySelector('main');
    if (main === null) {
      return;
    }

    const focusHeading = () => {
      const heading = main.querySelector<HTMLElement>('h1');
      if (heading === null) {
        return false;
      }

      heading.focus();
      focusObserver.current?.disconnect();
      focusObserver.current = null;
      cancelPendingFocus.current?.();
      cancelPendingFocus.current = null;
      return true;
    };

    if (!focusHeading()) {
      const cancel = () => {
        focusObserver.current?.disconnect();
        focusObserver.current = null;
        document.removeEventListener('focusin', cancel, true);
        cancelPendingFocus.current = null;
      };
      cancelPendingFocus.current = cancel;
      document.addEventListener('focusin', cancel, true);
      const observer = new MutationObserver(() => focusHeading());
      focusObserver.current = observer;
      observer.observe(main, { childList: true, subtree: true });
    }
  }, [location.key, navigationType]);

  useEffect(
    () => () => {
      focusObserver.current?.disconnect();
      cancelPendingFocus.current?.();
    },
    [],
  );

  return (
    <>
      <DocumentTitleManager />
      <Outlet />
    </>
  );
}
