import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RepositoriesProvider } from '../app/RepositoriesProvider';
import { useCampaignList } from '../viewModels/useCampaignList';
import type { CampaignSummaryPage } from '../models/api/schema';
import { campaignPage, createRepositoriesWithList } from './campaignListFixtures';
import type { Repositories } from '../models/repositories/Repositories';

function createWrapper(repositories: Repositories) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider repositories={repositories}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  }
  return {
    client,
    Wrapper,
  };
}

describe('useCampaignList', () => {
  it('exposes loading state while the repository is pending', () => {
    const list = vi.fn<Repositories['campaigns']['list']>(
      () => new Promise<CampaignSummaryPage>(() => {}),
    );
    const { Wrapper } = createWrapper(createRepositoriesWithList(list));
    const { result } = renderHook(() => useCampaignList(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('exposes campaigns after a successful repository request', async () => {
    const list = vi.fn<Repositories['campaigns']['list']>().mockResolvedValue(campaignPage);
    const { Wrapper } = createWrapper(createRepositoriesWithList(list));
    const { result } = renderHook(() => useCampaignList(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.campaigns).toEqual(campaignPage.items));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(list).toHaveBeenCalledOnce();
  });

  it('does not present background refetching as a requested retry', async () => {
    let resolveRefetch: ((page: typeof campaignPage) => void) | undefined;
    const list = vi
      .fn<Repositories['campaigns']['list']>()
      .mockResolvedValueOnce(campaignPage)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefetch = resolve;
          }),
      );
    const { client, Wrapper } = createWrapper(createRepositoriesWithList(list));
    const { result } = renderHook(() => useCampaignList(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.campaigns).toEqual(campaignPage.items));

    let refetchPromise: Promise<void> | undefined;
    act(() => {
      refetchPromise = client.refetchQueries({ queryKey: ['campaigns'] });
    });
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(result.current.isRefreshing).toBe(false);

    await act(async () => {
      resolveRefetch?.(campaignPage);
      await refetchPromise;
    });
    expect(result.current.isRefreshing).toBe(false);
  });

  it('exposes a screen-safe error and a refresh command on failure', async () => {
    let resolveRefresh: ((page: typeof campaignPage) => void) | undefined;
    const list = vi
      .fn<Repositories['campaigns']['list']>()
      .mockRejectedValueOnce(new Error('Internal detail'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
          }),
      );
    const { Wrapper } = createWrapper(createRepositoriesWithList(list));
    const { result } = renderHook(() => useCampaignList(), { wrapper: Wrapper });

    await waitFor(() =>
      expect(result.current.error).toBe('Impossible de charger les campagnes. Veuillez réessayer.'),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.campaigns).toEqual([]);

    act(() => {
      void result.current.refresh();
    });
    await waitFor(() => expect(result.current.isRefreshing).toBe(true));
    await act(async () => {
      resolveRefresh?.(campaignPage);
    });
    await waitFor(() => expect(result.current.campaigns).toEqual(campaignPage.items));
    expect(result.current.isRefreshing).toBe(false);
    expect(list).toHaveBeenCalledTimes(2);
  });
});
