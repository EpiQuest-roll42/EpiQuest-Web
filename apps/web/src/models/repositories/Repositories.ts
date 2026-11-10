import type { CampaignRepository } from './CampaignRepository';
import type { SessionRepository } from './SessionRepository';

export interface Repositories {
  campaigns: CampaignRepository;
  session: SessionRepository;
}
