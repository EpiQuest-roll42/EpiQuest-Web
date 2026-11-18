import { describe, expect, it } from 'vitest';
import { calculateMaxHitPoints, HitPointCalculationError } from '../../src/index.js';
import type { HitPointCalculationInput, HitPointMaximumEffect } from '../../src/index.js';

const emptyEffects: HitPointMaximumEffect[] = [];

describe('calculateMaxHitPoints', () => {
  it('uses the maximum hit die plus Constitution at level 1', () => {
    expect(
      calculateMaxHitPoints({
        level: 1,
        hitDie: 'd8',
        constitutionModifier: 2,
        method: 'average',
        hitPointMaximumEffects: emptyEffects,
      }),
    ).toBe(10);
  });

  it.each([
    ['d6', 10],
    ['d8', 13],
    ['d10', 16],
    ['d12', 19],
  ] as const)('uses the SRD average for %s on level-up', (hitDie, expected) => {
    expect(
      calculateMaxHitPoints({
        level: 2,
        hitDie,
        constitutionModifier: 0,
        method: 'average',
        hitPointMaximumEffects: [],
      }),
    ).toBe(expected);
  });

  it('uses rounded-up average hit dice for levels after the first', () => {
    expect(
      calculateMaxHitPoints({
        level: 3,
        hitDie: 'd8',
        constitutionModifier: 2,
        method: 'average',
        hitPointMaximumEffects: emptyEffects,
      }),
    ).toBe(24);
  });

  it('uses the provided roll for each gained level without generating randomness', () => {
    expect(
      calculateMaxHitPoints({
        level: 3,
        hitDie: 'd10',
        constitutionModifier: 2,
        method: 'roll',
        rolls: [8, 2],
        hitPointMaximumEffects: emptyEffects,
      }),
    ).toBe(26);
  });

  it('applies the minimum of 1 hit point per level when Constitution is negative', () => {
    expect(
      calculateMaxHitPoints({
        level: 3,
        hitDie: 'd6',
        constitutionModifier: -5,
        method: 'average',
        hitPointMaximumEffects: emptyEffects,
      }),
    ).toBe(3);
  });

  it('adds each per-level maximum hit point effect across all character levels', () => {
    expect(
      calculateMaxHitPoints({
        level: 3,
        hitDie: 'd8',
        constitutionModifier: 0,
        method: 'average',
        hitPointMaximumEffects: [{ type: 'hitPointMaximum', perLevel: 1 }],
      }),
    ).toBe(21);
  });

  it('clamps a reduced maximum to zero', () => {
    expect(
      calculateMaxHitPoints({
        level: 1,
        hitDie: 'd6',
        constitutionModifier: 0,
        method: 'average',
        hitPointMaximumEffects: [{ type: 'hitPointMaximum', perLevel: -10 }],
      }),
    ).toBe(0);
  });

  it('rejects invalid levels', () => {
    const input = {
      level: 0,
      hitDie: 'd8',
      constitutionModifier: 0,
      method: 'average',
      hitPointMaximumEffects: [],
    } satisfies HitPointCalculationInput;

    expect(() => calculateMaxHitPoints(input)).toThrowError(
      expect.objectContaining<Partial<HitPointCalculationError>>({ code: 'invalid_level' }),
    );
  });

  it('rejects a non-integer Constitution modifier', () => {
    expect(() =>
      calculateMaxHitPoints({
        level: 1,
        hitDie: 'd8',
        constitutionModifier: 1.5,
        method: 'average',
        hitPointMaximumEffects: [],
      }),
    ).toThrowError(
      expect.objectContaining<Partial<HitPointCalculationError>>({
        code: 'invalid_constitution_modifier',
      }),
    );
  });

  it.each([
    { level: 3, rolls: [4] },
    { level: 2, rolls: [0] },
    { level: 2, rolls: [9] },
    { level: 2, rolls: [4.5] },
  ])('rejects invalid hit die results: $rolls', ({ level, rolls }) => {
    expect(() =>
      calculateMaxHitPoints({
        level,
        hitDie: 'd8',
        constitutionModifier: 0,
        method: 'roll',
        rolls,
        hitPointMaximumEffects: [],
      }),
    ).toThrowError(HitPointCalculationError);
  });
});
