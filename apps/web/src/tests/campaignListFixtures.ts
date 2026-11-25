import type { CampaignRepository } from '../models/repositories/CampaignRepository';
import type { CampaignSummary, CampaignSummaryPage } from '../models/api/schema';
import type { Repositories } from '../models/repositories/Repositories';

export const campaignSummary: CampaignSummary = {
  id: '00000000-0000-4000-8000-000000000011',
  name: 'La Mine perdue',
  myRole: 'gm',
  gm: {
    id: '00000000-0000-4000-8000-000000000001',
    username: 'RolePlayMaster',
  },
  playerCount: 2,
  updatedAt: '2026-11-02T18:15:00Z',
};

export const campaignPage: CampaignSummaryPage = {
  items: [campaignSummary],
  nextCursor: null,
};

export function createRepositoriesWithList(list: CampaignRepository['list']): Repositories {
  return {
    campaigns: {
      list,
      async get() {
        throw new Error('get is not used by the campaign-list ViewModel.');
      },
      async create() {
        throw new Error('create is not used by the campaign-list ViewModel.');
      },
    },
    session: {
      async getCurrentUser() {
        return null;
      },
    },
  };
}
