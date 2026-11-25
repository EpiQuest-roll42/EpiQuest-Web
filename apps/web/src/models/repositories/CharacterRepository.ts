import type {
  AbilityRolls,
  ActiveEffect,
  AddEffectInput,
  AddInventoryItemInput,
  CharacterActionResult,
  CharacterOwnerView,
  CharacterSheetView,
  CharacterStatus,
  CharacterSummaryPage,
  CharacterView,
  CheckInput,
  CreateCharacterInput,
  CreationOptions,
  CreationStep,
  CurrencyInput,
  HitPointsAdjustmentInput,
  Id,
  LevelUpInput,
  LevelUpOptions,
  ParameterCharacterId,
  ParameterCursor,
  ParameterEffectId,
  ParameterLimit,
  RestInput,
  RollResult,
  UpdateCharacterInput,
  UpdateCreationInput,
  UpdateInventoryItemInput,
  UpdateResourcesInput,
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
  addEffect(characterId: ParameterCharacterId, input: AddEffectInput): Promise<ActiveEffect>;
  removeEffect(characterId: ParameterCharacterId, effectId: ParameterEffectId): Promise<void>;
  getCreationOptions(
    characterId: ParameterCharacterId,
    step: CreationStep,
  ): Promise<CreationOptions>;
  updateCreation(
    characterId: ParameterCharacterId,
    input: UpdateCreationInput,
  ): Promise<CharacterOwnerView>;
  finalizeCreation(characterId: ParameterCharacterId): Promise<CharacterOwnerView>;
  rollAbilityScores(characterId: ParameterCharacterId): Promise<AbilityRolls>;
  adjustHitPoints(
    characterId: ParameterCharacterId,
    input: HitPointsAdjustmentInput,
  ): Promise<CharacterActionResult>;
  takeRest(characterId: ParameterCharacterId, input: RestInput): Promise<CharacterActionResult>;
  updateResources(
    characterId: ParameterCharacterId,
    input: UpdateResourcesInput,
  ): Promise<CharacterSheetView>;
  addInventoryItem(
    characterId: ParameterCharacterId,
    input: AddInventoryItemInput,
  ): Promise<CharacterSheetView>;
  updateInventoryItem(
    characterId: ParameterCharacterId,
    entryId: Id,
    input: UpdateInventoryItemInput,
  ): Promise<CharacterSheetView>;
  removeInventoryItem(characterId: ParameterCharacterId, entryId: Id): Promise<void>;
  setCurrency(characterId: ParameterCharacterId, input: CurrencyInput): Promise<CharacterSheetView>;
  rollCheck(characterId: ParameterCharacterId, input: CheckInput): Promise<RollResult>;
  getLevelUpOptions(characterId: ParameterCharacterId): Promise<LevelUpOptions>;
  levelUp(characterId: ParameterCharacterId, input: LevelUpInput): Promise<CharacterActionResult>;
  exportCharacterSheet(characterId: ParameterCharacterId): Promise<Blob>;
}
