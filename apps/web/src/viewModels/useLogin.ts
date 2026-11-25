import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useSession } from './useSession';

function getSafeReturnTo(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('returnTo' in state)) {
    return '/campagnes';
  }
  const returnTo = state.returnTo;
  if (typeof returnTo !== 'string') {
    return '/campagnes';
  }

  try {
    const target = new URL(returnTo, window.location.origin);
    if (target.origin !== window.location.origin) {
      return '/campagnes';
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return '/campagnes';
  }
}

export function useLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, error } = useSession();
  const returnTo = getSafeReturnTo(location.state);

  useEffect(() => {
    if (isAuthenticated) {
      void navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, returnTo]);

  return { error };
}
