import type { CurrentUser } from '../api/schema';

export interface SessionRepository {
  getCurrentUser(): Promise<CurrentUser | null>;
}
