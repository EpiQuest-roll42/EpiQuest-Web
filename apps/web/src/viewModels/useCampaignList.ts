import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../app/repositoriesContext';
import type { CampaignSummary } from '../models/api/schema';

const campaignListQueryKey = ['campaigns'] as const;
const LOAD_ERROR_MESSAGE = 'Impossible de charger les campagnes. Veuillez réessayer.';

export interface CampaignListScreenState {
  campaigns: CampaignSummary[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCampaignList(): CampaignListScreenState {
  const { campaigns: campaignRepository } = useRepositories();
  const queryClient = useQueryClient();
  const [isRefreshRequested, setIsRefreshRequested] = useState(false);
  const query = useQuery({
    queryKey: campaignListQueryKey,
    queryFn: () => campaignRepository.list(),
  });

  const refresh = useCallback(async () => {
    setIsRefreshRequested(true);
    try {
      await queryClient.invalidateQueries({ queryKey: campaignListQueryKey });
    } finally {
      setIsRefreshRequested(false);
    }
  }, [queryClient]);

  return {
    campaigns: query.data?.items ?? [],
    isLoading: query.isPending,
    isRefreshing: isRefreshRequested,
    error: query.isError ? LOAD_ERROR_MESSAGE : null,
    refresh,
  };
}
