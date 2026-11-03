import type { DiceExpression, DiceModifier, DiceTerm, RerollModifier } from './types.js';

export interface Rng {
  nextInt(min: number, max: number): number;
}

export type AdvantageMode = 'none' | 'advantage' | 'disadvantage';

export interface IndividualDieResult {
  value: number;
  kept: boolean;
  fromExplosion: boolean;
  rerolledFrom?: number;
}

export interface DiceRollTermResult {
  type: 'dice';
  sign: 1 | -1;
  count: number;
  sides: number;
  dice: IndividualDieResult[];
  subtotal: number;
}

export interface ConstantRollTermResult {
  type: 'constant';
  sign: 1 | -1;
  value: number;
  subtotal: number;
}

export type RollTermResult = DiceRollTermResult | ConstantRollTermResult;

export interface RollResult {
  expression: string;
  terms: RollTermResult[];
  total: number;
  rollCount: number;
  capped: boolean;
}

export type DiceRollErrorCode =
  | 'invalid_expression'
  | 'invalid_rng_result'
  | 'total_out_of_range'
  | 'too_many_dice'
  | 'advantage_requires_single_d20';

export class DiceRollError extends Error {
  constructor(
    public readonly code: DiceRollErrorCode,
    public readonly params: Record<string, number> = {},
  ) {
    super(code);
    this.name = 'DiceRollError';
  }
}

export const MAX_EXPLOSIONS_PER_BASE_DIE = 10;
export const MAX_ROLLS_PER_EXPRESSION = 400;

function isRerollModifier(modifier: DiceModifier): modifier is RerollModifier {
  return modifier.type === 'reroll';
}

function formatModifier(modifier: DiceModifier): string {
  switch (modifier.type) {
    case 'reroll':
      return `r${modifier.mode === 'atMost' ? '<' : ''}${modifier.value}`;
    case 'explode':
      return '!';
    case 'keep':
      return `k${modifier.mode === 'highest' ? 'h' : 'l'}${modifier.count}`;
  }
}

function normalizeExpression(expression: DiceExpression): string {
  return expression.terms
    .map(({ sign, term }, index) => {
      const prefix = index === 0 && sign === 1 ? '' : sign === 1 ? '+' : '-';

      if (term.type === 'constant') {
        return `${prefix}${term.value}`;
      }

      const order: Record<DiceModifier['type'], number> = {
        reroll: 0,
        explode: 1,
        keep: 2,
      };
      const modifiers = [...term.modifiers].sort(
        (left, right) => order[left.type] - order[right.type],
      );

      return `${prefix}${term.count}d${term.sides}${modifiers.map(formatModifier).join('')}`;
    })
    .join('');
}

function matchesReroll(value: number, modifier: RerollModifier): boolean {
  return modifier.mode === 'equal' ? value === modifier.value : value <= modifier.value;
}

function validateTerm(term: DiceTerm): void {
  if (term.type === 'constant') {
    if (!Number.isInteger(term.value) || term.value < 0 || term.value > 1000) {
      throw new DiceRollError('invalid_expression');
    }

    return;
  }

  if (
    !Number.isInteger(term.count) ||
    term.count < 1 ||
    term.count > 100 ||
    !Number.isInteger(term.sides) ||
    term.sides < 2 ||
    term.sides > 100 ||
    !Array.isArray(term.modifiers)
  ) {
    throw new DiceRollError('invalid_expression');
  }

  const families = new Set<string>();

  for (const modifier of term.modifiers) {
    if (!modifier || !['keep', 'explode', 'reroll'].includes(modifier.type)) {
      throw new DiceRollError('invalid_expression');
    }

    const family = modifier.type;

    if (families.has(family)) {
      throw new DiceRollError('invalid_expression');
    }
    families.add(family);

    if (
      modifier.type === 'keep' &&
      (!Number.isInteger(modifier.count) ||
        modifier.count < 1 ||
        modifier.count > term.count ||
        (modifier.mode !== 'highest' && modifier.mode !== 'lowest'))
    ) {
      throw new DiceRollError('invalid_expression');
    }

    if (
      modifier.type === 'reroll' &&
      (!Number.isInteger(modifier.value) ||
        modifier.value < 1 ||
        modifier.value > (modifier.mode === 'equal' ? term.sides : term.sides - 1) ||
        (modifier.mode !== 'equal' && modifier.mode !== 'atMost'))
    ) {
      throw new DiceRollError('invalid_expression');
    }
  }

  if (
    term.modifiers.some((modifier) => modifier.type === 'explode') &&
    term.modifiers.some((modifier) => modifier.type === 'keep')
  ) {
    throw new DiceRollError('invalid_expression');
  }
}

export function roll(
  expression: DiceExpression,
  rng: Rng,
  advantage: AdvantageMode = 'none',
): RollResult {
  if (
    !expression ||
    expression.type !== 'dice-expression' ||
    !Array.isArray(expression.terms) ||
    expression.terms.length > 10 ||
    !rng ||
    typeof rng.nextInt !== 'function' ||
    !['none', 'advantage', 'disadvantage'].includes(advantage)
  ) {
    throw new DiceRollError('invalid_expression');
  }

  let baseDiceCount = 0;
  let advantageTargetIndex = -1;

  for (const [index, expressionTerm] of expression.terms.entries()) {
    if (
      !expressionTerm ||
      (expressionTerm.sign !== 1 && expressionTerm.sign !== -1) ||
      !expressionTerm.term
    ) {
      throw new DiceRollError('invalid_expression');
    }

    validateTerm(expressionTerm.term);

    if (expressionTerm.term.type === 'dice') {
      baseDiceCount += expressionTerm.term.count;

      if (
        expressionTerm.term.count === 1 &&
        expressionTerm.term.sides === 20 &&
        !expressionTerm.term.modifiers.some(
          (modifier) => modifier.type === 'keep' || modifier.type === 'explode',
        )
      ) {
        if (advantageTargetIndex !== -1) {
          throw new DiceRollError('advantage_requires_single_d20');
        }
        advantageTargetIndex = index;
      }
    }
  }

  if (baseDiceCount > 200) {
    throw new DiceRollError('too_many_dice', { max: 200 });
  }

  if (advantage !== 'none' && advantageTargetIndex === -1) {
    throw new DiceRollError('advantage_requires_single_d20');
  }

  const resolvedExpression: DiceExpression =
    advantage === 'none'
      ? expression
      : {
          ...expression,
          terms: expression.terms.map((expressionTerm, index) => {
            if (index !== advantageTargetIndex || expressionTerm.term.type !== 'dice') {
              return expressionTerm;
            }

            return {
              ...expressionTerm,
              term: {
                ...expressionTerm.term,
                count: 2,
                modifiers: [
                  ...expressionTerm.term.modifiers,
                  {
                    type: 'keep',
                    mode: advantage === 'advantage' ? 'highest' : 'lowest',
                    count: 1,
                  },
                ],
              },
            };
          }),
        };

  const normalizedExpression = normalizeExpression(resolvedExpression);
  const terms: RollTermResult[] = [];
  let total = 0;
  let rollCount = 0;
  let capped = false;

  const rollDie = (sides: number): number | undefined => {
    if (rollCount >= MAX_ROLLS_PER_EXPRESSION) {
      capped = true;
      return undefined;
    }

    const value = rng.nextInt(1, sides);
    rollCount += 1;

    if (!Number.isInteger(value) || value < 1 || value > sides) {
      throw new DiceRollError('invalid_rng_result', { min: 1, max: sides });
    }

    return value;
  };

  for (const { sign, term } of resolvedExpression.terms) {
    if (term.type === 'constant') {
      const subtotal = sign * term.value;
      total += subtotal;

      if (!Number.isSafeInteger(total)) {
        throw new DiceRollError('total_out_of_range');
      }

      terms.push({ type: 'constant', sign, value: term.value, subtotal });
      continue;
    }

    const keepModifier = term.modifiers.find(
      (modifier): modifier is Extract<DiceModifier, { type: 'keep' }> => modifier.type === 'keep',
    );
    const rerollModifier = term.modifiers.find(isRerollModifier);
    const explodeModifier = term.modifiers.some((modifier) => modifier.type === 'explode');
    const dice: IndividualDieResult[] = [];

    for (let baseDieIndex = 0; baseDieIndex < term.count; baseDieIndex += 1) {
      const initialValue = rollDie(term.sides);

      if (initialValue === undefined) {
        break;
      }

      let value = initialValue;
      let rerolledFrom: number | undefined;

      if (rerollModifier && matchesReroll(value, rerollModifier)) {
        const rerollValue = rollDie(term.sides);

        if (rerollValue === undefined) {
          dice.push({ value, kept: true, fromExplosion: false });
          break;
        }

        rerolledFrom = value;
        value = rerollValue;
      }

      const baseDie: IndividualDieResult = {
        value,
        kept: true,
        fromExplosion: false,
        ...(rerolledFrom === undefined ? {} : { rerolledFrom }),
      };
      dice.push(baseDie);

      if (!explodeModifier) {
        continue;
      }

      let currentValue = value;
      let explosionCount = 0;

      while (currentValue === term.sides) {
        if (explosionCount >= MAX_EXPLOSIONS_PER_BASE_DIE) {
          capped = true;
          break;
        }

        const explosionValue = rollDie(term.sides);

        if (explosionValue === undefined) {
          break;
        }

        dice.push({ value: explosionValue, kept: true, fromExplosion: true });
        currentValue = explosionValue;
        explosionCount += 1;
      }

      if (capped) {
        break;
      }
    }

    if (keepModifier) {
      const rankedDice = dice
        .map((die, index) => ({ die, index }))
        .sort((left, right) => {
          const difference = left.die.value - right.die.value;

          if (difference === 0) {
            return left.index - right.index;
          }

          return keepModifier.mode === 'highest' ? -difference : difference;
        });

      for (const { die } of rankedDice.slice(keepModifier.count)) {
        die.kept = false;
      }
    }

    const subtotal = dice.reduce((sum, die) => sum + (die.kept ? die.value : 0), 0);
    total += sign * subtotal;

    if (!Number.isSafeInteger(total)) {
      throw new DiceRollError('total_out_of_range');
    }

    terms.push({
      type: 'dice',
      sign,
      count: term.count,
      sides: term.sides,
      dice,
      subtotal: sign * subtotal,
    });

    if (capped) {
      break;
    }
  }

  return { expression: normalizedExpression, terms, total, rollCount, capped };
}
