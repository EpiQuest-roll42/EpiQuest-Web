import { describe, expect, it } from 'vitest';
import { getDiceStatistics, parse, type DiceExpression } from '../../src/index.js';

function parseValid(expression: string): DiceExpression {
  const result = parse(expression);

  if (!result.ok) {
    throw new Error(`Test expression did not parse: ${expression}`);
  }

  return result.value;
}

describe('dice statistics', () => {
  it('calculates the minimum, maximum, and mean of 4d6kh3', () => {
    expect(getDiceStatistics(parseValid('4d6kh3'))).toEqual({
      min: 3,
      max: 18,
      mean: expect.closeTo(12.2445987654, 8),
    });
  });

  it('calculates the minimum, maximum, and mean of 2d6+3', () => {
    expect(getDiceStatistics(parseValid('2d6+3'))).toEqual({
      min: 5,
      max: 15,
      mean: 10,
    });
  });

  it('accounts for signed terms', () => {
    expect(getDiceStatistics(parseValid('2d6-1d4-2'))).toEqual({
      min: -4,
      max: 9,
      mean: 2.5,
    });
  });

  it('rejects expressions with too many possible totals', () => {
    expect(() => getDiceStatistics(parseValid('21d100'))).toThrowError(
      expect.objectContaining({
        code: 'too_complex_for_probabilities',
        params: { maxPossibleTotals: 2_000 },
      }),
    );
  });

  it('rejects modified terms with more than 20 dice', () => {
    expect(() => getDiceStatistics(parseValid('21d6kh1'))).toThrowError(
      expect.objectContaining({
        code: 'too_complex_for_probabilities',
        params: { maxModifiedDice: 20 },
      }),
    );

    expect(() => getDiceStatistics(parseValid('11d6kh1+10d6kh1'))).toThrowError(
      expect.objectContaining({
        code: 'too_complex_for_probabilities',
        params: { maxModifiedDice: 20 },
      }),
    );
  });

  it('calculates the exact mean for a keep-lowest term', () => {
    expect(getDiceStatistics(parseValid('4d6kl3'))).toEqual({
      min: 3,
      max: 18,
      mean: expect.closeTo(8.7554012346, 8),
    });
  });
});
