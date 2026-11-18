import { createContext } from 'react';

export interface RouteStatusContextValue {
  message: string;
  setMessage(owner: symbol, message: string): void;
  clearMessage(owner: symbol): void;
}

export const RouteStatusContext = createContext<RouteStatusContextValue | null>(null);
