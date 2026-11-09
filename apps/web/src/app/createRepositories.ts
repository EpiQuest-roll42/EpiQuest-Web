import type { Repositories } from '../models/repositories/Repositories';
import { createHttpCampaignRepository } from '../models/repositories/httpCampaignRepository';

const DEVELOPMENT_API_BASE_URL = 'http://localhost:3000/api/v1';

async function createMockRepositories(): Promise<Repositories> {
  const { createMockCampaignRepository } =
    await import('../models/repositories/mockCampaignRepository');
  return { campaigns: createMockCampaignRepository() };
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

  return {
    campaigns: createHttpCampaignRepository(baseUrl || DEVELOPMENT_API_BASE_URL),
  };
}
