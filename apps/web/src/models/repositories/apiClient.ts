import createClient from 'openapi-fetch';
import type { paths } from '../api/schema';

export type ApiClient = ReturnType<typeof createClient<paths>>;

export function createApiClient(baseUrl: string): ApiClient {
  // Authenticated web requests use the session cookie; display-token endpoints must omit credentials.
  return createClient<paths>({
    baseUrl,
    credentials: 'include',
  });
}
