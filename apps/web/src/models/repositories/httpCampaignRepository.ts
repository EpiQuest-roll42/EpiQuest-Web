import type { Problem } from '../api/schema';
import { ApiError } from './ApiError';
import type { ApiClient } from './apiClient';
import type { CampaignRepository } from './CampaignRepository';

export function createHttpCampaignRepository(client: ApiClient): CampaignRepository {
  function unwrap<T>(result: { data?: T; error?: Problem; response: Response }): T {
    if (result.error !== undefined) {
      throw new ApiError(result.error);
    }
    if (result.data === undefined) {
      throw new Error(`L'API n'a renvoyé aucune donnée (HTTP ${result.response.status}).`);
    }
    return result.data;
  }

  return {
    async list(params) {
      const result = await client.GET('/campaigns', {
        params: { query: params ?? {} },
      });
      return unwrap(result);
    },

    async get(campaignId) {
      const result = await client.GET('/campaigns/{campaignId}', {
        params: { path: { campaignId } },
      });
      return unwrap(result);
    },

    async create(input) {
      const result = await client.POST('/campaigns', { body: input });
      return unwrap(result);
    },
  };
}
