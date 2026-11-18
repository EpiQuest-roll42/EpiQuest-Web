import type { HitDie, HitPointCalculationInput } from './types.js';

export type HitPointCalculationErrorCode =
  | 'invalid_level'
  | 'invalid_hit_die'
  | 'invalid_method'
  | 'invalid_constitution_modifier'
  | 'invalid_hit_die_rolls'
  | 'invalid_hit_point_maximum_effect';

export class HitPointCalculationError extends Error {
  constructor(
    readonly code: HitPointCalculationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'HitPointCalculationError';
  }
}

const HIT_DIE_SIDES: Record<HitDie, number> = {
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
};

function getAverageHitDieValue(hitDie: HitDie): number {
  return Math.floor(HIT_DIE_SIDES[hitDie] / 2) + 1;
}

function validateInput(input: HitPointCalculationInput): void {
  if (!Number.isSafeInteger(input.level) || input.level < 1 || input.level > 20) {
    throw new HitPointCalculationError(
      'invalid_level',
      'Character level must be an integer between 1 and 20.',
    );
  }

  if (!Object.hasOwn(HIT_DIE_SIDES, input.hitDie)) {
    throw new HitPointCalculationError('invalid_hit_die', 'Hit die must be d6, d8, d10, or d12.');
  }

  if (input.method !== 'average' && input.method !== 'roll') {
    throw new HitPointCalculationError(
      'invalid_method',
      'Hit point method must be average or roll.',
    );
  }

  if (!Number.isSafeInteger(input.constitutionModifier)) {
    throw new HitPointCalculationError(
      'invalid_constitution_modifier',
      'Constitution modifier must be a safe integer.',
    );
  }

  if (!Array.isArray(input.hitPointMaximumEffects)) {
    throw new HitPointCalculationError(
      'invalid_hit_point_maximum_effect',
      'Hit point maximum effects must be provided as an array.',
    );
  }

  for (const effect of input.hitPointMaximumEffects) {
    if (!effect || !Number.isSafeInteger(effect.perLevel)) {
      throw new HitPointCalculationError(
        'invalid_hit_point_maximum_effect',
        'Hit point maximum effects must use an integer per-level value.',
      );
    }
  }

  if (input.method === 'average') {
    if (input.rolls !== undefined) {
      throw new HitPointCalculationError(
        'invalid_hit_die_rolls',
        'Hit die rolls must be omitted when using the average method.',
      );
    }
    return;
  }

  if (
    !Array.isArray(input.rolls) ||
    input.rolls.length !== input.level - 1 ||
    input.rolls.some(
      (roll) => !Number.isSafeInteger(roll) || roll < 1 || roll > HIT_DIE_SIDES[input.hitDie],
    )
  ) {
    throw new HitPointCalculationError(
      'invalid_hit_die_rolls',
      `The roll method requires one valid ${input.hitDie} result for each level after level 1.`,
    );
  }
}

export function calculateMaxHitPoints(input: HitPointCalculationInput): number {
  validateInput(input);

  const hitDieSides = HIT_DIE_SIDES[input.hitDie];
  const firstLevel = Math.max(1, hitDieSides + input.constitutionModifier);

  let total = firstLevel;
  for (let level = 2; level <= input.level; level += 1) {
    const hitDieValue =
      input.method === 'average' ? getAverageHitDieValue(input.hitDie) : input.rolls[level - 2]!;
    total += Math.max(1, hitDieValue + input.constitutionModifier);
  }

  for (const effect of input.hitPointMaximumEffects) {
    total += effect.perLevel * input.level;
  }

  if (!Number.isSafeInteger(total)) {
    throw new HitPointCalculationError(
      'invalid_hit_point_maximum_effect',
      'Calculated maximum hit points exceed the supported integer range.',
    );
  }

  return Math.max(0, total);
}
