import { describe, expect, it } from 'vitest';
import {
  getDiceProbabilities,
  getDiceStatistics,
  parse,
  type DiceExpression,
} from '../../src/index.js';

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

  describe('dice probabilities', () => {
    it('returns the exact distribution of 4d6kh3', () => {
      const expectedWays = [1, 4, 10, 21, 38, 62, 91, 122, 148, 167, 172, 160, 131, 94, 54, 21];
      const result = getDiceProbabilities(parseValid('4d6kh3'));

      expect(result.min).toBe(3);
      expect(result.max).toBe(18);
      expect(result.mean).toBeCloseTo(12.2445987654, 8);
      expect(result.distribution.map(({ total }) => total)).toEqual(
        expectedWays.map((_, index) => index + 3),
      );
      result.distribution.forEach(({ probability }, index) => {
        expect(probability).toBeCloseTo(expectedWays[index]! / 1296, 14);
      });
      expect(result.distribution.reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(
        1,
        12,
      );
      expect(
        result.distribution.reduce((sum, entry) => sum + entry.total * entry.probability, 0),
      ).toBeCloseTo(result.mean, 12);
    });

    it('returns the exact distribution of 2d6+3', () => {
      const expectedWays = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
      const result = getDiceProbabilities(parseValid('2d6+3'));

      expect(result.min).toBe(5);
      expect(result.max).toBe(15);
      expect(result.mean).toBe(10);
      expect(result.distribution.map(({ total }) => total)).toEqual(
        expectedWays.map((_, index) => index + 5),
      );
      result.distribution.forEach(({ probability }, index) => {
        expect(probability).toBeCloseTo(expectedWays[index]! / 36, 14);
      });
      expect(result.distribution.reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(
        1,
        12,
      );
      expect(
        result.distribution.reduce((sum, entry) => sum + entry.total * entry.probability, 0),
      ).toBeCloseTo(result.mean, 12);
    });

    it('combines signed terms into one ordered distribution', () => {
      const result = getDiceProbabilities(parseValid('1d2-1'));

      expect(result.distribution).toEqual([
        { total: 0, probability: 0.5 },
        { total: 1, probability: 0.5 },
      ]);
    });

    it('applies rerolls to base dice, not explosion dice', () => {
      const result = getDiceProbabilities(parseValid('1d2r1!'));

      expect(result.min).toBe(1);
      expect(result.max).toBe(22);
      expect(result.distribution[0]!.probability).toBeCloseTo(0.25, 14);
      expect(result.distribution[1]!.probability).toBe(0);
      expect(result.distribution[2]!.probability).toBeCloseTo(0.375, 14);
      expect(result.distribution.reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(
        1,
        12,
      );
      expect(
        result.distribution.reduce((sum, entry) => sum + entry.total * entry.probability, 0),
      ).toBeCloseTo(result.mean, 12);
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
