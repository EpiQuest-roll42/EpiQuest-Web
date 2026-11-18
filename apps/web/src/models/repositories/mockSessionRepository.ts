import type { CurrentUser } from '../api/schema';
import type { SessionRepository } from './SessionRepository';

const MOCK_USER: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'RolePlayMaster',
  email: 'roleplaymaster@example.test',
  createdAt: '2026-11-02T18:15:00Z',
};

export function createMockSessionRepository(
  currentUser: CurrentUser | null = MOCK_USER,
): SessionRepository {
  const user = currentUser === null ? null : structuredClone(currentUser);

  return {
    async getCurrentUser(): Promise<CurrentUser | null> {
      return user === null ? null : structuredClone(user);
    },
  };
}
