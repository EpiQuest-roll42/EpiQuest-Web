import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from '../models/repositories/apiClient';
import { createHttpSessionRepository } from '../models/repositories/httpSessionRepository';
import { createMockSessionRepository } from '../models/repositories/mockSessionRepository';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('session repositories', () => {
  it('returns the current user from the mock repository', async () => {
    const repository = createMockSessionRepository();

    await expect(repository.getCurrentUser()).resolves.toMatchObject({
      username: 'RolePlayMaster',
    });
  });

  it('can simulate an unauthenticated mock session', async () => {
    const repository = createMockSessionRepository(null);

    await expect(repository.getCurrentUser()).resolves.toBeNull();
  });

  it('treats an API 401 as an unauthenticated session', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            type: '/problems/unauthorized',
            title: 'Unauthorized',
            status: 401,
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const repository = createHttpSessionRepository(createApiClient('https://api.example.test'));

    await expect(repository.getCurrentUser()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
