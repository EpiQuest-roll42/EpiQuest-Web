import type { InitiativeInput, ValueBreakdown } from './types.js';

export type InitiativeCalculationErrorCode = 'invalid_input';

export class InitiativeCalculationError extends Error {
  constructor(
    readonly code: InitiativeCalculationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'InitiativeCalculationError';
  }
}

export function calculateInitiative(input: InitiativeInput): ValueBreakdown {
  const dexterityModifier = input.abilities?.dex?.modifier;
  if (!Number.isSafeInteger(dexterityModifier)) {
    throw new InitiativeCalculationError(
      'invalid_input',
      'The Dexterity modifier must be a safe integer.',
    );
  }

  return {
    value: dexterityModifier,
    parts: [{ source: { kind: 'ability', ref: 'dex' }, value: dexterityModifier }],
  };
}
