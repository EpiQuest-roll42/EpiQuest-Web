import type { Repositories } from '../models/repositories/Repositories';
import { createApiClient } from '../models/repositories/apiClient';
import { createHttpCampaignRepository } from '../models/repositories/httpCampaignRepository';
import { createHttpSessionRepository } from '../models/repositories/httpSessionRepository';

const DEVELOPMENT_API_BASE_URL = 'http://localhost:3000/api/v1';

async function createMockRepositories(): Promise<Repositories> {
  const mockSessionMode = import.meta.env.VITE_MOCK_SESSION;
  if (
    mockSessionMode !== undefined &&
    mockSessionMode !== 'authenticated' &&
    mockSessionMode !== 'anonymous'
  ) {
    throw new Error('VITE_MOCK_SESSION doit valoir "authenticated" ou "anonymous".');
  }

  const [{ createMockCampaignRepository }, { createMockSessionRepository }] = await Promise.all([
    import('../models/repositories/mockCampaignRepository'),
    import('../models/repositories/mockSessionRepository'),
  ]);
  return {
    campaigns: createMockCampaignRepository(),
    session: createMockSessionRepository(mockSessionMode === 'anonymous' ? null : undefined),
  };
}

export async function createRepositories(): Promise<Repositories> {
  const mode = import.meta.env.VITE_API_MODE;

  if (mode === undefined || mode === 'mock') {
    if (!import.meta.env.DEV) {
      if (mode === 'mock') {
        throw new Error('VITE_API_MODE=mock est réservé au développement.');
      }
      throw new Error('VITE_API_MODE est obligatoire en production (valeurs : "http" ou "mock").');
    }
    return createMockRepositories();
  }

  if (mode !== 'http') {
    throw new Error(`VITE_API_MODE doit valoir "mock" ou "http" (valeur reçue : "${mode}").`);
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl && !import.meta.env.DEV) {
    throw new Error('VITE_API_BASE_URL est obligatoire en production lorsque VITE_API_MODE=http.');
  }

  const client = createApiClient(baseUrl || DEVELOPMENT_API_BASE_URL);
  return {
    campaigns: createHttpCampaignRepository(client),
    session: createHttpSessionRepository(client),
  };
}
