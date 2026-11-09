import type { PropsWithChildren } from 'react';
import type { Repositories } from '../models/repositories/Repositories';
import { RepositoriesContext } from './repositoriesContext';

export function RepositoriesProvider({
  children,
  repositories,
}: PropsWithChildren<{ repositories: Repositories }>) {
  return (
    <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
  );
}
