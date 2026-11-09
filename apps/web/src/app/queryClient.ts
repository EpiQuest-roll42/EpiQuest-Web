import { QueryClient } from '@tanstack/react-query';
import { CampaignRepositoryError } from '../models/repositories/CampaignRepositoryError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (
          error instanceof CampaignRepositoryError &&
          error.problem.status >= 400 &&
          error.problem.status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});
