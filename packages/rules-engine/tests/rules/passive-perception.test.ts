import { describe, expect, it } from 'vitest';
import {
  calculatePassivePerception,
  getAbilityScores,
  PassivePerceptionError,
} from '../../src/index.js';
import type { PassivePerceptionInput, ProficiencyBonus } from '../../src/index.js';

function createInput(
  wisdom: number,
  proficiency: PassivePerceptionInput['proficiency'] = 'none',
  proficiencyBonus: ProficiencyBonus = 2,
): PassivePerceptionInput {
  return {
    abilities: getAbilityScores({
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: wisdom,
      cha: 10,
    }),
    proficiencyBonus,
    proficiency,
  };
}

describe('calculatePassivePerception', () => {
  it('calculates passive Perception without proficiency', () => {
    expect(calculatePassivePerception(createInput(16))).toEqual({
      value: 13,
      parts: [
        { source: { kind: 'base', ref: 'passive-perception' }, value: 10 },
        { source: { kind: 'ability', ref: 'wis' }, value: 3 },
      ],
    });
  });

  it('adds proficiency when trained in Perception', () => {
    expect(calculatePassivePerception(createInput(16, 'proficient', 3))).toEqual({
      value: 16,
      parts: [
        { source: { kind: 'base', ref: 'passive-perception' }, value: 10 },
        { source: { kind: 'ability', ref: 'wis' }, value: 3 },
        { source: { kind: 'proficiency', ref: 'perception' }, value: 3 },
      ],
    });
  });

  it('adds double proficiency for expertise', () => {
    expect(calculatePassivePerception(createInput(14, 'expertise', 2))).toMatchObject({
      value: 16,
      parts: [
        { source: { kind: 'base', ref: 'passive-perception' }, value: 10 },
        { source: { kind: 'ability', ref: 'wis' }, value: 2 },
        { source: { kind: 'proficiency', ref: 'perception' }, value: 4 },
      ],
    });
  });

  it('preserves a negative Wisdom modifier', () => {
    expect(calculatePassivePerception(createInput(8)).value).toBe(9);
  });

  it('rejects invalid proficiency bonus values', () => {
    expect(() =>
      calculatePassivePerception({
        ...createInput(10),
        proficiencyBonus: 1 as PassivePerceptionInput['proficiencyBonus'],
      }),
    ).toThrowError(
      expect.objectContaining<Partial<PassivePerceptionError>>({ code: 'invalid_input' }),
    );
  });

  it('rejects unknown proficiency values', () => {
    expect(() =>
      calculatePassivePerception({
        ...createInput(10),
        proficiency: 'double-proficiency' as PassivePerceptionInput['proficiency'],
      }),
    ).toThrowError(PassivePerceptionError);
  });

  it('rejects an invalid Wisdom modifier', () => {
    const input = createInput(10);
    input.abilities.wis.modifier = Number.NaN;

    expect(() => calculatePassivePerception(input)).toThrowError(
      expect.objectContaining<Partial<PassivePerceptionError>>({ code: 'invalid_input' }),
    );
  });
});
