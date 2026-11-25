import type { CurrentUser, LoginInput, RegisterInput } from '../api/schema';

export interface AuthRepository {
  login(input: LoginInput): Promise<CurrentUser>;
  register(input: RegisterInput): Promise<CurrentUser>;
  logout(): Promise<void>;
}
