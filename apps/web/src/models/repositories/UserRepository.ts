import type {
  ChangePasswordInput,
  CurrentUser,
  DeleteAccountInput,
  UpdateUserInput,
} from '../api/schema';

export interface UserRepository {
  updateCurrentUser(input: UpdateUserInput): Promise<CurrentUser>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  deleteAccount(input: DeleteAccountInput): Promise<void>;
}
