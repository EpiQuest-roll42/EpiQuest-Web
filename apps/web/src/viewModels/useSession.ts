import { useQuery } from '@tanstack/react-query';
import type { CurrentUser } from '../models/api/schema';
import { useRepositories } from '../app/repositoriesContext';

export const currentUserQueryKey = ['session', 'current-user'] as const;

export interface SessionScreenState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CurrentUser | null;
  error: string | null;
}

export function useSession(): SessionScreenState {
  const { session } = useRepositories();
  const query = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: () => session.getCurrentUser(),
  });
  const user = query.data ?? null;

  return {
    isAuthenticated: user !== null,
    isLoading: query.isPending,
    user,
    error: query.isError ? 'Impossible de vérifier la session. Veuillez réessayer.' : null,
  };
}
