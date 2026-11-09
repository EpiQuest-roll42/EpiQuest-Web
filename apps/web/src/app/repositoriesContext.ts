import { createContext, useContext } from 'react';
import type { Repositories } from '../models/repositories/Repositories';

export const RepositoriesContext = createContext<Repositories | undefined>(undefined);

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (repositories === undefined) {
    throw new Error('useRepositories doit être utilisé dans un RepositoriesProvider.');
  }
  return repositories;
}
