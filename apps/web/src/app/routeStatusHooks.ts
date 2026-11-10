import { useContext, useEffect, useRef } from 'react';
import { RouteStatusContext } from './routeStatusContext';

function useRouteStatusContext() {
  const context = useContext(RouteStatusContext);
  if (context === null) {
    throw new Error('Le statut de navigation doit être utilisé dans RouteStatusProvider.');
  }
  return context;
}

export function useRouteStatusMessage(): string {
  return useRouteStatusContext().message;
}

export function useRouteStatus(message: string) {
  const { setMessage, clearMessage } = useRouteStatusContext();
  const owner = useRef(Symbol());

  useEffect(() => {
    const currentOwner = owner.current;
    if (message === '') {
      clearMessage(currentOwner);
      return;
    }

    setMessage(currentOwner, message);
    return () => clearMessage(currentOwner);
  }, [clearMessage, message, setMessage]);
}
