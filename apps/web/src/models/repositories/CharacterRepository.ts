import type {
  CharacterOwnerView,
  CharacterStatus,
  CharacterSummaryPage,
  CharacterView,
  CreateCharacterInput,
  ParameterCharacterId,
  ParameterCursor,
  ParameterLimit,
  UpdateCharacterInput,
} from '../api/schema';

export interface CharacterRepository {
  list(params?: {
    status?: CharacterStatus;
    cursor?: ParameterCursor;
    limit?: ParameterLimit;
  }): Promise<CharacterSummaryPage>;
  create(input: CreateCharacterInput): Promise<CharacterOwnerView>;
  get(characterId: ParameterCharacterId): Promise<CharacterView>;
  update(
    characterId: ParameterCharacterId,
    input: UpdateCharacterInput,
  ): Promise<CharacterOwnerView>;
  delete(characterId: ParameterCharacterId): Promise<void>;
}
