import type { PassivePerceptionInput, ValueBreakdown, ValueBreakdownPart } from './types.js';

export type PassivePerceptionErrorCode = 'invalid_input';

export class PassivePerceptionError extends Error {
  constructor(
    readonly code: PassivePerceptionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PassivePerceptionError';
  }
}

const PROFICIENCY_BONUSES = [2, 3, 4, 5, 6];
const PROFICIENCY_MULTIPLIERS = {
  none: 0,
  proficient: 1,
  expertise: 2,
} as const;

function validateInput(input: PassivePerceptionInput): void {
  if (
    !Number.isSafeInteger(input.proficiencyBonus) ||
    !PROFICIENCY_BONUSES.includes(input.proficiencyBonus)
  ) {
    throw new PassivePerceptionError(
      'invalid_input',
      'Proficiency bonus must be an integer from 2 to 6.',
    );
  }

  if (!Object.hasOwn(PROFICIENCY_MULTIPLIERS, input.proficiency)) {
    throw new PassivePerceptionError(
      'invalid_input',
      'Perception proficiency must be none, proficient, or expertise.',
    );
  }

  if (!Number.isSafeInteger(input.abilities?.wis?.modifier)) {
    throw new PassivePerceptionError(
      'invalid_input',
      'The Wisdom modifier must be a safe integer.',
    );
  }
}

export function calculatePassivePerception(input: PassivePerceptionInput): ValueBreakdown {
  validateInput(input);

  const parts: ValueBreakdownPart[] = [
    { source: { kind: 'base', ref: 'passive-perception' }, value: 10 },
    { source: { kind: 'ability', ref: 'wis' }, value: input.abilities.wis.modifier },
  ];

  const proficiencyMultiplier = PROFICIENCY_MULTIPLIERS[input.proficiency];
  if (proficiencyMultiplier > 0) {
    parts.push({
      source: { kind: 'proficiency', ref: 'perception' },
      value: proficiencyMultiplier * input.proficiencyBonus,
    });
  }

  const value = parts.reduce((total, part) => total + part.value, 0);
  if (!Number.isSafeInteger(value)) {
    throw new PassivePerceptionError(
      'invalid_input',
      'Calculated passive Perception exceeds the supported integer range.',
    );
  }

  return { value, parts };
}
