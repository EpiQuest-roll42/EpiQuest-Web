import type { AbilityCode, SavingThrowInput, SavingThrowModifier } from './types.js';

export type SavingThrowCalculationErrorCode = 'invalid_input';

export class SavingThrowCalculationError extends Error {
  constructor(
    readonly code: SavingThrowCalculationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SavingThrowCalculationError';
  }
}

const ABILITY_CODES: readonly AbilityCode[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const PROFICIENCY_BONUSES = [2, 3, 4, 5, 6];

function isAbilityCode(value: unknown): value is AbilityCode {
  return typeof value === 'string' && ABILITY_CODES.some((ability) => ability === value);
}

function validateInput(input: SavingThrowInput): void {
  if (
    !Number.isSafeInteger(input.proficiencyBonus) ||
    !PROFICIENCY_BONUSES.includes(input.proficiencyBonus)
  ) {
    throw new SavingThrowCalculationError(
      'invalid_input',
      'Proficiency bonus must be an integer from 2 to 6.',
    );
  }

  if (
    !Array.isArray(input.proficientAbilities) ||
    !input.proficientAbilities.every(isAbilityCode)
  ) {
    throw new SavingThrowCalculationError(
      'invalid_input',
      'Proficient saving throws must contain valid ability codes.',
    );
  }

  for (const ability of ABILITY_CODES) {
    if (!input.abilities || !Number.isSafeInteger(input.abilities[ability]?.modifier)) {
      throw new SavingThrowCalculationError(
        'invalid_input',
        `The ${ability} modifier must be a safe integer.`,
      );
    }
  }
}

export function calculateSavingThrows(input: SavingThrowInput): SavingThrowModifier[] {
  validateInput(input);

  const proficientAbilities = new Set(input.proficientAbilities);
  return ABILITY_CODES.map((ability) => {
    const proficient = proficientAbilities.has(ability);
    return {
      ability,
      modifier: input.abilities[ability].modifier + (proficient ? input.proficiencyBonus : 0),
      proficient,
    };
  });
}
