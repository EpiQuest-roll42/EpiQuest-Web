import type {
  Id,
  ParameterCampaignId,
  ParameterCursor,
  ParameterLimit,
  ParameterSessionFilter,
  ParameterSessionIdFilter,
  RollInput,
  RollResult,
  RollResultPage,
} from '../api/schema';

export interface DiceRepository {
  roll(input: RollInput): Promise<RollResult>;
  get(rollId: Id): Promise<RollResult>;
  listCampaignRolls(
    campaignId: ParameterCampaignId,
    params?: {
      characterId?: Id;
      sessionId?: ParameterSessionIdFilter;
      session?: ParameterSessionFilter;
      cursor?: ParameterCursor;
      limit?: ParameterLimit;
    },
  ): Promise<RollResultPage>;
}
