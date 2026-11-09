import createClient from 'openapi-fetch';
import type { paths, Problem } from '../api/schema';
import { CampaignRepositoryError } from './CampaignRepositoryError';
import type { CampaignRepository } from './CampaignRepository';

export function createHttpCampaignRepository(baseUrl: string): CampaignRepository {
  // Campaign API calls use the web session cookie. Display-view requests must use credentials: 'omit'.
  const client = createClient<paths>({
    baseUrl,
    credentials: 'include',
  });

  function unwrap<T>(result: { data?: T; error?: Problem; response: Response }): T {
    if (result.error !== undefined) {
      throw new CampaignRepositoryError(result.error);
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
