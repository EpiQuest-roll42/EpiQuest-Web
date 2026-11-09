import { describe, expect, it } from 'vitest';
import { queryClient } from '../app/queryClient';
import { CampaignRepositoryError } from '../models/repositories/CampaignRepositoryError';

describe('queryClient retry policy', () => {
  it('does not retry client errors and retries transient failures twice', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe('function');
    if (typeof retry !== 'function') {
      return;
    }

    const clientError = new CampaignRepositoryError({
      type: '/problems/not-found',
      title: 'Not Found',
      status: 404,
    });

    expect(retry(0, clientError)).toBe(false);
    expect(retry(0, new Error('Network unavailable'))).toBe(true);
    expect(retry(1, new Error('Network unavailable'))).toBe(true);
    expect(retry(2, new Error('Network unavailable'))).toBe(false);
  });
});
