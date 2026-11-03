import { describe, expect, it } from 'vitest';
import { DiceRollError, parse, roll, type DiceExpression, type Rng } from '../../src/index.js';

function parseValid(expression: string): DiceExpression {
  const result = parse(expression);

  if (!result.ok) {
    throw new Error(`Test expression did not parse: ${expression}`);
  }

  return result.value;
}

function createSequenceRng(values: number[]) {
  const calls: Array<{ min: number; max: number; value: number }> = [];
  const rng: Rng = {
    nextInt(min, max) {
      const value = values[calls.length];

      if (value === undefined) {
        throw new Error('The deterministic RNG sequence is exhausted.');
      }

      calls.push({ min, max, value });

      return value;
    },
  };

  return { rng, calls };
}

describe('roll', () => {
  it('rolls multiple dice and applies signed constants', () => {
    const { rng, calls } = createSequenceRng([2, 6, 4]);
    const result = roll(parseValid('2d6 + d4 - 3'), rng);

    expect(result.total).toBe(9);
    expect(result.rollCount).toBe(3);
    expect(result.expression).toBe('2d6+1d4-3');
    expect(calls).toEqual([
      { min: 1, max: 6, value: 2 },
      { min: 1, max: 6, value: 6 },
      { min: 1, max: 4, value: 4 },
    ]);
  });

  it('normalizes percent dice and modifier order', () => {
    const result = roll(parseValid('D%kh1r<2'), { nextInt: () => 50 });

    expect(result.expression).toBe('1d100r<2kh1');
  });

  it('rerolls each starting die at most once', () => {
    const { rng } = createSequenceRng([1, 2]);
    const result = roll(parseValid('d6r<3'), rng);

    expect(result.total).toBe(2);
    expect(result.terms[0]).toMatchObject({
      dice: [{ value: 2, kept: true, rerolledFrom: 1, fromExplosion: false }],
    });
  });

  it('continues explosions and marks each generated die', () => {
    const { rng } = createSequenceRng([6, 6, 2]);
    const result = roll(parseValid('d6!'), rng);

    expect(result.total).toBe(14);
    expect(result.terms[0]).toMatchObject({
      dice: [
        { value: 6, kept: true, fromExplosion: false },
        { value: 6, kept: true, fromExplosion: true },
        { value: 2, kept: true, fromExplosion: true },
      ],
    });
  });

  it('explodes a rerolled base die, but does not reroll explosion dice', () => {
    const { rng } = createSequenceRng([1, 6, 6, 1]);
    const result = roll(parseValid('d6r<2!'), rng);

    expect(result.total).toBe(13);
    expect(result.rollCount).toBe(4);
    expect(result.terms[0]).toMatchObject({
      dice: [
        { value: 6, kept: true, rerolledFrom: 1, fromExplosion: false },
        { value: 6, kept: true, fromExplosion: true },
        { value: 1, kept: true, fromExplosion: true },
      ],
    });
  });

  it('keeps the selected base dice and preserves original order', () => {
    const { rng } = createSequenceRng([6, 2, 5, 1]);
    const result = roll(parseValid('4d6kh2'), rng);

    expect(result.total).toBe(11);
    expect(result.terms[0]).toMatchObject({
      dice: [
        { value: 6, kept: true },
        { value: 2, kept: false },
        { value: 5, kept: true },
        { value: 1, kept: false },
      ],
      subtotal: 11,
    });
  });

  it('applies rerolls, then keeps dice, regardless of modifier order', () => {
    const { rng } = createSequenceRng([1, 4, 5, 2]);
    const result = roll(parseValid('3d6kh1r1'), rng);

    expect(result.expression).toBe('3d6r1kh1');
    expect(result.total).toBe(5);
    expect(result.terms[0]).toMatchObject({
      dice: [
        { value: 4, kept: false, rerolledFrom: 1 },
        { value: 5, kept: true },
        { value: 2, kept: false },
      ],
    });
  });

  it.each([
    ['advantage', [3, 18], 18, [false, true], '2d20kh1+5'],
    ['disadvantage', [3, 18], 3, [true, false], '2d20kl1+5'],
  ] as const)(
    'normalizes %s into a two-die keep term',
    (mode, values, keptValue, kept, normalized) => {
      const { rng } = createSequenceRng([...values]);
      const result = roll(parseValid('D20 + 5'), rng, mode);

      expect(result.total).toBe(keptValue + 5);
      expect(result.expression).toBe(normalized);
      expect(result.terms[0]).toMatchObject({
        dice: [
          { value: values[0], kept: kept[0] },
          { value: values[1], kept: kept[1] },
        ],
      });
    },
  );

  it('allows rerolls with advantage and normalizes their order', () => {
    const { rng } = createSequenceRng([1, 2, 18]);
    const result = roll(parseValid('d20r1'), rng, 'advantage');

    expect(result.expression).toBe('2d20r1kh1');
    expect(result.total).toBe(18);
    expect(result.terms[0]).toMatchObject({
      dice: [
        { value: 2, kept: false, rerolledFrom: 1 },
        { value: 18, kept: true },
      ],
    });
  });

  it('requires exactly one eligible d20 when advantage is requested', () => {
    expect(() => roll(parseValid('d20kh1'), { nextInt: () => 1 }, 'advantage')).toThrow(
      expect.objectContaining({ code: 'advantage_requires_single_d20' }),
    );
    expect(() => roll(parseValid('d20+d20'), { nextInt: () => 1 }, 'advantage')).toThrow(
      expect.objectContaining({ code: 'advantage_requires_single_d20' }),
    );
  });

  it.each([0, 1.5, 7])('rejects invalid RNG result %s', (value) => {
    expect(() => roll(parseValid('d6'), { nextInt: () => value })).toThrow(
      expect.objectContaining({ code: 'invalid_rng_result', params: { min: 1, max: 6 } }),
    );
  });

  it('caps an endlessly exploding d2 without throwing', () => {
    const result = roll(parseValid('d2!'), { nextInt: (_min, max) => max });

    expect(result.capped).toBe(true);
    expect(result.rollCount).toBe(11);
    expect(result.terms[0]).toMatchObject({
      dice: Array.from({ length: 11 }, (_, index) => ({ fromExplosion: index > 0 })),
    });
  });

  it('caps the entire expression at 400 launched dice', () => {
    const expression: DiceExpression = {
      type: 'dice-expression',
      terms: Array.from({ length: 2 }, () => ({
        sign: 1 as const,
        term: {
          type: 'dice' as const,
          count: 100,
          sides: 2,
          modifiers: [
            { type: 'reroll' as const, mode: 'equal' as const, value: 1 },
            { type: 'explode' as const },
          ],
        },
      })),
    };
    let rngCalls = 0;
    const result = roll(expression, {
      nextInt: () => {
        const values = [1, 2, 1];
        const value = values[rngCalls % values.length]!;

        rngCalls += 1;

        return value;
      },
    });

    expect(result.capped).toBe(true);
    expect(result.rollCount).toBe(400);
  });

  it('rejects an expression with more than 200 base dice', () => {
    const expression: DiceExpression = {
      type: 'dice-expression',
      terms: Array.from({ length: 3 }, () => ({
        sign: 1 as const,
        term: { type: 'dice' as const, count: 100, sides: 6, modifiers: [] },
      })),
    };

    expect(() => roll(expression, { nextInt: (_min, max) => max })).toThrow(
      expect.objectContaining({ code: 'too_many_dice', params: { max: 200 } }),
    );
  });

  it('returns a total without consuming randomness for constants', () => {
    const result = roll(parseValid('5 - 2'), { nextInt: () => 1 });

    expect(result).toMatchObject({
      expression: '5-2',
      total: 3,
      rollCount: 0,
      capped: false,
      terms: [
        { type: 'constant', value: 5, subtotal: 5 },
        { type: 'constant', value: 2, subtotal: -2 },
      ],
    });
  });

  it('throws an explicit domain error for an invalid AST', () => {
    const expression: DiceExpression = {
      type: 'dice-expression',
      terms: [{ sign: 1, term: { type: 'dice', count: 0, sides: 6, modifiers: [] } }],
    };

    expect(() => roll(expression, { nextInt: (_min, max) => max })).toThrow(
      expect.objectContaining({ code: 'invalid_expression' }),
    );
    expect(DiceRollError).toBeDefined();
  });
});
