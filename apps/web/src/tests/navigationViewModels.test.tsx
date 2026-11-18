import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import type { PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';
import { useJoinCampaign } from '../viewModels/useJoinCampaign';
import { usePlayerDisplay } from '../viewModels/usePlayerDisplay';

function createRouterWrapper(initialEntry: string) {
  return function RouterWrapper({ children }: PropsWithChildren) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

describe('navigation ViewModels', () => {
  it('exposes an invitation code from the URL fragment', () => {
    const { result } = renderHook(() => useJoinCampaign(), {
      wrapper: createRouterWrapper('/rejoindre#XXXXX-XXXXX'),
    });

    expect(result.current.invitationCode).toBe('XXXXX-XXXXX');
  });

  it('captures the player token in memory and removes it from router location', async () => {
    const { result } = renderHook(
      () => ({
        display: usePlayerDisplay(),
        location: useLocation(),
      }),
      { wrapper: createRouterWrapper('/vue-joueurs#private-token') },
    );

    expect(result.current.display.hasToken).toBe(true);
    await waitFor(() => expect(result.current.location.hash).toBe(''));
    expect(result.current.display.hasToken).toBe(true);
  });

  it('reports a missing player token', () => {
    const { result } = renderHook(() => usePlayerDisplay(), {
      wrapper: createRouterWrapper('/vue-joueurs'),
    });

    expect(result.current.hasToken).toBe(false);
  });
});
