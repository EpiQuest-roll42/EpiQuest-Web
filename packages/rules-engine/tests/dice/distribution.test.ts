import { describe, expect, it } from 'vitest';
import { parse, roll, type DiceExpression, type Rng } from '../../src/index.js';

const SAMPLE_COUNT = 36_000;

function parseValid(expression: string): DiceExpression {
  const result = parse(expression);

  if (!result.ok) {
    throw new Error(`Test expression did not parse: ${expression}`);
  }

  return result.value;
}

function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;

  const nextUint32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;

    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return (value ^ (value >>> 14)) >>> 0;
  };

  return {
    nextInt(min, max) {
      const range = max - min + 1;
      const sampleSpace = 0x1_0000_0000;
      const acceptedLimit = Math.floor(sampleSpace / range) * range;
      let value = nextUint32();

      while (value >= acceptedLimit) {
        value = nextUint32();
      }

      return min + (value % range);
    },
  };
}

describe('dice roll distribution', () => {
  it('matches the exact 2d6 distribution within statistical tolerance', () => {
    const expression = parseValid('2d6');
    const rng = createSeededRng(0x1a2b3c4d);
    const observed = new Map<number, number>();
    let sum = 0;

    for (let sample = 0; sample < SAMPLE_COUNT; sample += 1) {
      const result = roll(expression, rng);

      sum += result.total;
      observed.set(result.total, (observed.get(result.total) ?? 0) + 1);
    }

    const expectedWays = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];

    for (const [index, ways] of expectedWays.entries()) {
      const total = index + 2;
      const probability = ways / 36;
      const expectedCount = SAMPLE_COUNT * probability;
      const standardDeviation = Math.sqrt(SAMPLE_COUNT * probability * (1 - probability));
      const observedCount = observed.get(total) ?? 0;

      expect(Math.abs(observedCount - expectedCount)).toBeLessThan(6 * standardDeviation);
    }

    expect(sum / SAMPLE_COUNT).toBeCloseTo(7, 1);
  });
});
