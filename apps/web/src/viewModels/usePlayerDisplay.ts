import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

export interface PlayerDisplayScreenState {
  hasToken: boolean;
}

export function usePlayerDisplay(): PlayerDisplayScreenState {
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => (location.hash.startsWith('#') ? location.hash.slice(1) : ''));

  useEffect(() => {
    if (token !== '') {
      navigate(
        { pathname: location.pathname, search: location.search, hash: '' },
        { replace: true },
      );
    }
  }, [location.pathname, location.search, navigate, token]);

  return { hasToken: token !== '' };
}
