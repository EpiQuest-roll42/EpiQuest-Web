import { describe, expect, it } from 'vitest';
import { queryClient } from '../app/queryClient';
import { ApiError } from '../models/repositories/ApiError';

describe('queryClient retry policy', () => {
  it('does not retry client errors and retries transient failures twice', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe('function');
    if (typeof retry !== 'function') {
      return;
    }

    const clientError = new ApiError({
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
