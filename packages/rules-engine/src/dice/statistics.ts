import type { DiceExpression, DiceModifier, DiceTerm, RerollModifier } from './types.js';
import { MAX_EXPLOSIONS_PER_BASE_DIE } from './roll.js';

export interface DiceStatistics {
  min: number;
  max: number;
  mean: number;
}

export type DiceStatisticsErrorCode = 'invalid_expression' | 'too_complex_for_probabilities';

export class DiceStatisticsError extends Error {
  constructor(
    public readonly code: DiceStatisticsErrorCode,
    public readonly params: Record<string, number> = {},
  ) {
    super(code);
    this.name = 'DiceStatisticsError';
  }
}

const MAX_POSSIBLE_TOTALS = 2_000;
const MAX_MODIFIED_DICE = 20;

function isRerollModifier(modifier: DiceModifier): modifier is RerollModifier {
  return modifier.type === 'reroll';
}

function validateTerm(term: DiceTerm): void {
  if (term.type === 'constant') {
    if (!Number.isInteger(term.value) || term.value < 0 || term.value > 1_000) {
      throw new DiceStatisticsError('invalid_expression');
    }

    return;
  }

  if (
    term.type !== 'dice' ||
    !Number.isInteger(term.count) ||
    term.count < 1 ||
    term.count > 100 ||
    !Number.isInteger(term.sides) ||
    term.sides < 2 ||
    term.sides > 100 ||
    !Array.isArray(term.modifiers)
  ) {
    throw new DiceStatisticsError('invalid_expression');
  }

  const families = new Set<string>();

  for (const modifier of term.modifiers) {
    if (!modifier || !['keep', 'explode', 'reroll'].includes(modifier.type)) {
      throw new DiceStatisticsError('invalid_expression');
    }

    if (families.has(modifier.type)) {
      throw new DiceStatisticsError('invalid_expression');
    }
    families.add(modifier.type);

    if (
      modifier.type === 'keep' &&
      (!Number.isInteger(modifier.count) ||
        modifier.count < 1 ||
        modifier.count > term.count ||
        (modifier.mode !== 'highest' && modifier.mode !== 'lowest'))
    ) {
      throw new DiceStatisticsError('invalid_expression');
    }

    if (
      modifier.type === 'reroll' &&
      (!Number.isInteger(modifier.value) ||
        modifier.value < 1 ||
        modifier.value > (modifier.mode === 'equal' ? term.sides : term.sides - 1) ||
        (modifier.mode !== 'equal' && modifier.mode !== 'atMost'))
    ) {
      throw new DiceStatisticsError('invalid_expression');
    }
  }

  if (
    term.modifiers.some((modifier) => modifier.type === 'explode') &&
    term.modifiers.some((modifier) => modifier.type === 'keep')
  ) {
    throw new DiceStatisticsError('invalid_expression');
  }
}

function validateExpression(expression: DiceExpression): void {
  if (
    !expression ||
    expression.type !== 'dice-expression' ||
    !Array.isArray(expression.terms) ||
    expression.terms.length > 10
  ) {
    throw new DiceStatisticsError('invalid_expression');
  }

  let totalDice = 0;
  let modifiedDice = 0;

  for (const expressionTerm of expression.terms) {
    if (
      !expressionTerm ||
      (expressionTerm.sign !== 1 && expressionTerm.sign !== -1) ||
      !expressionTerm.term
    ) {
      throw new DiceStatisticsError('invalid_expression');
    }

    validateTerm(expressionTerm.term);

    if (expressionTerm.term.type === 'dice') {
      totalDice += expressionTerm.term.count;
      if (totalDice > 200) {
        throw new DiceStatisticsError('invalid_expression');
      }

      if (expressionTerm.term.modifiers.length > 0) {
        modifiedDice += expressionTerm.term.count;
      }
    }
  }

  if (modifiedDice > MAX_MODIFIED_DICE) {
    throw new DiceStatisticsError('too_complex_for_probabilities', {
      maxModifiedDice: MAX_MODIFIED_DICE,
    });
  }
}

function getDieProbabilities(sides: number, reroll?: RerollModifier): number[] {
  const rerolledCount = reroll ? (reroll.mode === 'equal' ? 1 : reroll.value) : 0;
  const rerollProbability = rerolledCount / sides;

  return Array.from({ length: sides }, (_, index) => {
    const value = index + 1;
    const initialProbability =
      reroll && (reroll.mode === 'equal' ? value === reroll.value : value <= reroll.value)
        ? 0
        : 1 / sides;

    return initialProbability + rerollProbability / sides;
  });
}

function binomialCoefficient(n: number, k: number): number {
  let result = 1;

  for (let index = 1; index <= k; index += 1) {
    result = (result * (n - index + 1)) / index;
  }

  return result;
}

function binomialProbabilityAtLeast(n: number, p: number, minimum: number): number {
  let probability = 0;

  for (let count = minimum; count <= n; count += 1) {
    probability += binomialCoefficient(n, count) * p ** count * (1 - p) ** (n - count);
  }

  return probability;
}

function binomialProbabilityAtMost(n: number, p: number, maximum: number): number {
  let probability = 0;

  for (let count = 0; count <= maximum; count += 1) {
    probability += binomialCoefficient(n, count) * p ** count * (1 - p) ** (n - count);
  }

  return probability;
}

function meanOfKeptDice(
  probabilities: number[],
  count: number,
  keepCount: number,
  mode: 'highest' | 'lowest',
): number {
  let mean = 0;

  for (let threshold = 1; threshold <= probabilities.length; threshold += 1) {
    const probabilityAtLeastThreshold = probabilities
      .slice(threshold - 1)
      .reduce((sum, probability) => sum + probability, 0);
    const probabilityBelowThreshold = 1 - probabilityAtLeastThreshold;

    for (let rank = 1; rank <= keepCount; rank += 1) {
      mean +=
        mode === 'highest'
          ? binomialProbabilityAtLeast(count, probabilityAtLeastThreshold, rank)
          : binomialProbabilityAtMost(count, probabilityBelowThreshold, rank - 1);
    }
  }

  return mean;
}

function getTermBounds(term: DiceTerm): Pick<DiceStatistics, 'min' | 'max'> {
  if (term.type === 'constant') {
    return { min: term.value, max: term.value };
  }

  const keepModifier = term.modifiers.find(
    (modifier): modifier is Extract<DiceModifier, { type: 'keep' }> => modifier.type === 'keep',
  );
  const explodes = term.modifiers.some((modifier) => modifier.type === 'explode');
  const min = keepModifier ? keepModifier.count : term.count;
  const max = keepModifier
    ? keepModifier.count * term.sides
    : term.count * term.sides * (explodes ? MAX_EXPLOSIONS_PER_BASE_DIE + 1 : 1);

  return { min, max };
}

function getTermMean(term: DiceTerm): number {
  if (term.type === 'constant') {
    return term.value;
  }

  const keepModifier = term.modifiers.find(
    (modifier): modifier is Extract<DiceModifier, { type: 'keep' }> => modifier.type === 'keep',
  );
  const rerollModifier = term.modifiers.find(isRerollModifier);
  const explodes = term.modifiers.some((modifier) => modifier.type === 'explode');
  const probabilities = getDieProbabilities(term.sides, rerollModifier);
  const meanOfOneDie = probabilities.reduce(
    (sum, probability, index) => sum + probability * (index + 1),
    0,
  );

  let mean: number;

  if (keepModifier) {
    mean = meanOfKeptDice(probabilities, term.count, keepModifier.count, keepModifier.mode);
  } else if (explodes) {
    let meanOfExplosions = 0;

    for (let explosion = 0; explosion < MAX_EXPLOSIONS_PER_BASE_DIE; explosion += 1) {
      meanOfExplosions = (term.sides + 1) / 2 + meanOfExplosions / term.sides;
    }

    mean = term.count * (meanOfOneDie + probabilities[term.sides - 1]! * meanOfExplosions);
  } else {
    mean = term.count * meanOfOneDie;
  }

  return mean;
}

export function getDiceStatistics(expression: DiceExpression): DiceStatistics {
  validateExpression(expression);

  const bounds = expression.terms.map(({ sign, term }) => ({
    sign,
    bounds: getTermBounds(term),
  }));
  const min = bounds.reduce(
    (total, { sign, bounds: term }) => total + (sign === 1 ? term.min : -term.max),
    0,
  );
  const max = bounds.reduce(
    (total, { sign, bounds: term }) => total + (sign === 1 ? term.max : -term.min),
    0,
  );
  const range = max - min + 1;

  if (range > MAX_POSSIBLE_TOTALS) {
    throw new DiceStatisticsError('too_complex_for_probabilities', {
      maxPossibleTotals: MAX_POSSIBLE_TOTALS,
    });
  }

  const mean = expression.terms.reduce(
    (total, { sign, term }) => total + sign * getTermMean(term),
    0,
  );

  return { min, max, mean };
}
