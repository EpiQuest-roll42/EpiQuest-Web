import { useCallback, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { RouteStatusContext } from './routeStatusContext';
import type { RouteStatusContextValue } from './routeStatusContext';

export function RouteStatusProvider({ children }: PropsWithChildren) {
  const [statuses, setStatuses] = useState<Map<symbol, string>>(() => new Map());
  const setMessage = useCallback((owner: symbol, message: string) => {
    setStatuses((current) => new Map(current).set(owner, message));
  }, []);
  const clearMessage = useCallback((owner: symbol) => {
    setStatuses((current) => {
      if (!current.has(owner)) {
        return current;
      }
      const next = new Map(current);
      next.delete(owner);
      return next;
    });
  }, []);

  const value = useMemo<RouteStatusContextValue>(
    () => ({
      message: Array.from(statuses.values()).at(-1) ?? '',
      setMessage,
      clearMessage,
    }),
    [clearMessage, setMessage, statuses],
  );

  return <RouteStatusContext.Provider value={value}>{children}</RouteStatusContext.Provider>;
}
