import type {
  CampaignGmView,
  CampaignPlayerView,
  CampaignSummary,
  CampaignSummaryPage,
  CampaignView,
  Problem,
  UserPublic,
} from '../api/schema';
import { ApiError } from './ApiError';
import type { CampaignRepository } from './CampaignRepository';

const MOCK_DELAY_MS = 150;

const MOCK_GM: UserPublic = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'RolePlayMaster',
};

const initialCampaigns: CampaignView[] = [
  {
    viewerRole: 'gm',
    id: '00000000-0000-4000-8000-000000000011',
    name: 'La Mine perdue',
    description: 'Une campagne pour aventuriers débutants.',
    gm: MOCK_GM,
    playerCount: 2,
    invitation: {
      code: '7KQ2M-9XMAT',
      url: 'http://localhost:5173/rejoindre#7KQ2M-9XMAT',
      createdAt: '2026-11-02T18:15:00Z',
    },
    createdAt: '2026-11-02T18:15:00Z',
  } satisfies CampaignGmView,
  {
    viewerRole: 'player',
    id: '00000000-0000-4000-8000-000000000012',
    name: 'Les Brumes du Nord',
    description: 'Une expédition au-delà des montagnes.',
    gm: MOCK_GM,
    playerCount: 4,
    myCharacter: null,
    createdAt: '2026-11-03T10:00:00Z',
  } satisfies CampaignPlayerView,
];

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
}

function createProblem(
  status: number,
  type: string,
  title: string,
  detail: string,
  instance: string,
): Problem {
  return {
    type,
    title,
    status,
    detail,
    instance,
  };
}

function toSummary(campaign: CampaignView): CampaignSummary {
  return {
    id: campaign.id,
    name: campaign.name,
    myRole: campaign.viewerRole,
    gm: campaign.gm,
    playerCount: campaign.playerCount,
    ...(campaign.viewerRole === 'player' && campaign.myCharacter !== undefined
      ? { myCharacter: campaign.myCharacter }
      : {}),
    updatedAt: campaign.createdAt,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createMockCampaignRepository(): CampaignRepository {
  const campaigns = new Map(initialCampaigns.map((campaign) => [campaign.id, clone(campaign)]));
  let nextCampaignId = 13;

  function createInvitationCode(sequence: number): string {
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let remaining = sequence;
    let code = '';
    for (let index = 0; index < 10; index += 1) {
      code = `${alphabet[remaining % alphabet.length]}${code}`;
      remaining = Math.floor(remaining / alphabet.length);
    }
    return `${code.slice(0, 5)}-${code.slice(5)}`;
  }

  return {
    async list(params): Promise<CampaignSummaryPage> {
      await delay();

      const filtered = [...campaigns.values()]
        .filter((campaign) => params?.role === undefined || campaign.viewerRole === params.role)
        .map(toSummary);

      const start = params?.cursor === undefined ? 0 : Number(params.cursor);
      const limit = params?.limit ?? 20;
      if (
        !Number.isInteger(start) ||
        start < 0 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        throw new ApiError(
          createProblem(
            400,
            '/problems/validation-error',
            'Bad Request',
            'The cursor or limit is invalid.',
            '/campaigns',
          ),
        );
      }

      const items = filtered.slice(start, start + limit);
      const nextOffset = start + items.length;
      return clone({
        items,
        nextCursor: nextOffset < filtered.length ? String(nextOffset) : null,
      });
    },

    async get(campaignId): Promise<CampaignView> {
      await delay();

      const campaign = campaigns.get(campaignId);
      if (campaign === undefined) {
        throw new ApiError(
          createProblem(
            404,
            '/problems/not-found',
            'Not Found',
            'The requested campaign was not found.',
            `/campaigns/${campaignId}`,
          ),
        );
      }
      return clone(campaign);
    },

    async create(input): Promise<CampaignGmView> {
      await delay();

      const sequence = nextCampaignId++;
      const id = `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
      const createdAt = new Date().toISOString();
      const invitationCode = createInvitationCode(sequence);
      const campaign: CampaignGmView = {
        viewerRole: 'gm',
        id,
        name: input.name,
        ...(input.description === undefined ? {} : { description: input.description }),
        gm: MOCK_GM,
        playerCount: 1,
        invitation: {
          code: invitationCode,
          url: `http://localhost:5173/rejoindre#${invitationCode}`,
          createdAt,
        },
        createdAt,
      };
      campaigns.set(campaign.id, campaign);
      return clone(campaign);
    },
  };
}
