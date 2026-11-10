import type { DiceExpression, DiceModifier, DiceTerm, RerollModifier } from './types.js';
import { MAX_EXPLOSIONS_PER_BASE_DIE } from './roll.js';

export interface DiceStatistics {
  min: number;
  max: number;
  mean: number;
}

export interface DiceProbabilities extends DiceStatistics {
  distribution: Array<{ total: number; probability: number }>;
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

interface ProbabilityDistribution {
  min: number;
  probabilities: number[];
}

function convolve(
  left: ProbabilityDistribution,
  right: ProbabilityDistribution,
): ProbabilityDistribution {
  const probabilities = Array.from(
    { length: left.probabilities.length + right.probabilities.length - 1 },
    () => 0,
  );

  for (const [leftIndex, leftProbability] of left.probabilities.entries()) {
    if (leftProbability === 0) {
      continue;
    }

    for (const [rightIndex, rightProbability] of right.probabilities.entries()) {
      if (rightProbability !== 0) {
        probabilities[leftIndex + rightIndex]! += leftProbability * rightProbability;
      }
    }
  }

  return { min: left.min + right.min, probabilities };
}

function getBinomialProbabilities(count: number, probability: number): number[] {
  if (probability <= 0) {
    return [1, ...Array.from({ length: count }, () => 0)];
  }

  if (probability >= 1) {
    return [...Array.from({ length: count }, () => 0), 1];
  }

  const probabilities = Array.from({ length: count + 1 }, () => 0);
  probabilities[0] = (1 - probability) ** count;

  for (let successes = 1; successes <= count; successes += 1) {
    probabilities[successes] =
      (probabilities[successes - 1]! * (count - successes + 1) * probability) /
      (successes * (1 - probability));
  }

  return probabilities;
}

function getExplosionTailDistribution(
  sides: number,
  remainingDice: number,
): ProbabilityDistribution {
  if (remainingDice === 1) {
    return { min: 1, probabilities: Array.from({ length: sides }, () => 1 / sides) };
  }

  const tail = getExplosionTailDistribution(sides, remainingDice - 1);
  const probabilities = Array.from({ length: sides * remainingDice }, () => 0);

  for (let value = 1; value < sides; value += 1) {
    probabilities[value - 1]! += 1 / sides;
  }

  for (const [index, probability] of tail.probabilities.entries()) {
    probabilities[sides + tail.min + index - 1]! += probability / sides;
  }

  return { min: 1, probabilities };
}

function getExplodingDieDistribution(
  sides: number,
  baseDieProbabilities: number[],
): ProbabilityDistribution {
  const explosionTail = getExplosionTailDistribution(sides, MAX_EXPLOSIONS_PER_BASE_DIE);
  const probabilities = Array.from({ length: sides * (MAX_EXPLOSIONS_PER_BASE_DIE + 1) }, () => 0);

  for (let value = 1; value < sides; value += 1) {
    probabilities[value - 1]! += baseDieProbabilities[value - 1]!;
  }

  const maximumFaceProbability = baseDieProbabilities[sides - 1]!;
  for (const [index, probability] of explosionTail.probabilities.entries()) {
    probabilities[sides + explosionTail.min + index - 1]! += maximumFaceProbability * probability;
  }

  return { min: 1, probabilities };
}

function getKeptDiceDistribution(
  dieProbabilities: number[],
  count: number,
  keepCount: number,
  mode: 'highest' | 'lowest',
): ProbabilityDistribution {
  let states = Array.from({ length: count + 1 }, () => new Map<number, number>());
  states[0]!.set(0, 1);

  const faceIndices = Array.from({ length: dieProbabilities.length }, (_, index) =>
    mode === 'highest' ? dieProbabilities.length - index - 1 : index,
  );

  for (const [facePosition, faceIndex] of faceIndices.entries()) {
    const remainingFaceProbability = faceIndices
      .slice(facePosition)
      .reduce((sum, index) => sum + dieProbabilities[index]!, 0);
    const faceProbability = dieProbabilities[faceIndex]!;
    const probabilityOfThisFace =
      facePosition === faceIndices.length - 1 ? 1 : faceProbability / remainingFaceProbability;
    const binomialByDiceRemaining = Array.from({ length: count + 1 }, (_, diceRemaining) =>
      getBinomialProbabilities(diceRemaining, probabilityOfThisFace),
    );
    const nextStates = Array.from({ length: count + 1 }, () => new Map<number, number>());
    const value = faceIndex + 1;

    for (let diceProcessed = 0; diceProcessed <= count; diceProcessed += 1) {
      const diceRemaining = count - diceProcessed;
      const binomial = binomialByDiceRemaining[diceRemaining]!;

      for (const [sum, stateProbability] of states[diceProcessed]!) {
        if (stateProbability === 0) {
          continue;
        }

        for (let diceAtFace = 0; diceAtFace <= diceRemaining; diceAtFace += 1) {
          const nextDiceProcessed = diceProcessed + diceAtFace;
          const keepsRemaining = keepCount - Math.min(diceProcessed, keepCount);
          const nextSum = sum + Math.min(diceAtFace, keepsRemaining) * value;
          const nextProbability = stateProbability * binomial[diceAtFace]!;

          if (nextProbability !== 0) {
            const nextState = nextStates[nextDiceProcessed]!;
            nextState.set(nextSum, (nextState.get(nextSum) ?? 0) + nextProbability);
          }
        }
      }
    }

    states = nextStates;
  }

  const minimum = keepCount;
  const probabilities = Array.from(
    { length: keepCount * dieProbabilities.length - minimum + 1 },
    () => 0,
  );

  for (const [sum, probability] of states[count]!) {
    probabilities[sum - minimum]! += probability;
  }

  return { min: minimum, probabilities };
}

function getTermDistribution(term: DiceTerm): ProbabilityDistribution {
  if (term.type === 'constant') {
    return { min: term.value, probabilities: [1] };
  }

  const keepModifier = term.modifiers.find(
    (modifier): modifier is Extract<DiceModifier, { type: 'keep' }> => modifier.type === 'keep',
  );
  const rerollModifier = term.modifiers.find(isRerollModifier);
  const explodes = term.modifiers.some((modifier) => modifier.type === 'explode');
  const dieProbabilities = getDieProbabilities(term.sides, rerollModifier);

  if (keepModifier) {
    return getKeptDiceDistribution(
      dieProbabilities,
      term.count,
      keepModifier.count,
      keepModifier.mode,
    );
  }

  const oneDieDistribution = explodes
    ? getExplodingDieDistribution(term.sides, dieProbabilities)
    : { min: 1, probabilities: dieProbabilities };
  let distribution: ProbabilityDistribution = { min: 0, probabilities: [1] };

  for (let die = 0; die < term.count; die += 1) {
    distribution = convolve(distribution, oneDieDistribution);
  }

  return distribution;
}

function getExpressionDistribution(expression: DiceExpression): ProbabilityDistribution {
  let distribution: ProbabilityDistribution = { min: 0, probabilities: [1] };

  for (const { sign, term } of expression.terms) {
    const termDistribution = getTermDistribution(term);
    const signedDistribution =
      sign === 1
        ? termDistribution
        : {
            min: -(termDistribution.min + termDistribution.probabilities.length - 1),
            probabilities: [...termDistribution.probabilities].reverse(),
          };

    distribution = convolve(distribution, signedDistribution);
  }

  return distribution;
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

export function getDiceProbabilities(expression: DiceExpression): DiceProbabilities {
  const statistics = getDiceStatistics(expression);
  const distribution = getExpressionDistribution(expression);
  const totalProbability = distribution.probabilities.reduce(
    (total, probability) => total + probability,
    0,
  );

  return {
    ...statistics,
    distribution: distribution.probabilities.map((probability, index) => ({
      total: distribution.min + index,
      probability: probability / totalProbability,
    })),
  };
}
