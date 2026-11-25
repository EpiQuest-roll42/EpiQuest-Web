import type { CurrentUser } from '../api/schema';
import { ApiError } from './ApiError';
import type { ApiClient } from './apiClient';
import type { SessionRepository } from './SessionRepository';

export function createHttpSessionRepository(client: ApiClient): SessionRepository {
  return {
    async getCurrentUser(): Promise<CurrentUser | null> {
      const result = await client.GET('/users/me');
      const status = result.response.status;

      if (status === 401) {
        return null;
      }
      if (result.error !== undefined) {
        throw new ApiError(result.error);
      }
      if (result.data === undefined) {
        throw new Error(`L'API n'a renvoyé aucune donnée (HTTP ${status}).`);
      }
      return result.data;
    },
  };
}
