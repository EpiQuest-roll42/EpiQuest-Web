import { describe, expect, it } from 'vitest';
import { CampaignRepositoryError } from '../models/repositories/CampaignRepositoryError';
import { createMockCampaignRepository } from '../models/repositories/mockCampaignRepository';

describe('createMockCampaignRepository', () => {
  it('returns independent data copies', async () => {
    const repository = createMockCampaignRepository();
    const campaign = await repository.get('00000000-0000-4000-8000-000000000011');
    campaign.name = 'Edited by a consumer';

    const freshCampaign = await repository.get('00000000-0000-4000-8000-000000000011');
    expect(freshCampaign.name).toBe('La Mine perdue');
  });

  it('keeps state isolated between repository instances', async () => {
    const firstRepository = createMockCampaignRepository();
    const secondRepository = createMockCampaignRepository();

    const created = await firstRepository.create({ name: 'Nouvelle campagne' });
    expect(created.invitation.code).not.toBe(
      (await firstRepository.create({ name: 'Autre campagne' })).invitation.code,
    );
    expect(await firstRepository.get(created.id)).toHaveProperty('name', 'Nouvelle campagne');
    await expect(secondRepository.get(created.id)).rejects.toMatchObject({
      problem: {
        type: '/problems/not-found',
        title: 'Not Found',
        status: 404,
        detail: expect.any(String),
      },
    });
  });

  it('returns contract-shaped errors for invalid pagination', async () => {
    const repository = createMockCampaignRepository();

    await expect(repository.list({ limit: 101 })).rejects.toBeInstanceOf(CampaignRepositoryError);
    await expect(repository.list({ limit: 101 })).rejects.toMatchObject({
      problem: {
        type: '/problems/validation-error',
        title: 'Bad Request',
        status: 400,
      },
    });
  });
});
