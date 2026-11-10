import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../models/repositories/ApiError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (
          error instanceof ApiError &&
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
