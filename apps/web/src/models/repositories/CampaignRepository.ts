import type {
  CampaignGmView,
  CampaignRole,
  CampaignSummaryPage,
  CampaignView,
  CreateCampaignInput,
  ParameterCampaignId,
  ParameterCursor,
  ParameterLimit,
} from '../api/schema';

export interface CampaignRepository {
  list(params?: {
    role?: CampaignRole;
    cursor?: ParameterCursor;
    limit?: ParameterLimit;
  }): Promise<CampaignSummaryPage>;
  get(campaignId: ParameterCampaignId): Promise<CampaignView>;
  create(input: CreateCampaignInput): Promise<CampaignGmView>;
}
