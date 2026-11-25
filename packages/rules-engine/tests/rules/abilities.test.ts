import { describe, expect, it } from 'vitest';
import {
  getAbilityModifier,
  getAbilityModifiers,
  getAbilityScores,
  getProficiencyBonus,
} from '../../src/index.js';
import type { CharacterClass } from '../../src/index.js';

describe('getAbilityModifier', () => {
  it.each([
    [1, -5],
    [8, -1],
    [10, 0],
    [15, 2],
    [20, 5],
    [30, 10],
  ])('calculates the modifier for score %i as %i', (score, expectedModifier) => {
    expect(getAbilityModifier(score)).toBe(expectedModifier);
  });

  it.each([0, 31, 10.5])('rejects invalid ability scores (%s)', (score) => {
    expect(() => getAbilityModifier(score)).toThrow(RangeError);
  });
});

it('calculates the modifiers for all six ability scores', () => {
  expect(getAbilityModifiers({ str: 8, dex: 14, con: 12, int: 10, wis: 16, cha: 18 })).toEqual({
    str: -1,
    dex: 2,
    con: 1,
    int: 0,
    wis: 3,
    cha: 4,
  });
});

it('returns ability scores with their calculated modifiers in the API shape', () => {
  expect(getAbilityScores({ str: 8, dex: 14, con: 12, int: 10, wis: 16, cha: 18 })).toEqual({
    str: { score: 8, modifier: -1 },
    dex: { score: 14, modifier: 2 },
    con: { score: 12, modifier: 1 },
    int: { score: 10, modifier: 0 },
    wis: { score: 16, modifier: 3 },
    cha: { score: 18, modifier: 4 },
  });
});

describe('getProficiencyBonus', () => {
  const characterClass = {
    levels: [
      { level: 1, proficiencyBonus: 2, features: [], subclassFeature: false },
      { level: 4, proficiencyBonus: 2, features: [], subclassFeature: false },
      { level: 5, proficiencyBonus: 3, features: [], subclassFeature: false },
      { level: 8, proficiencyBonus: 3, features: [], subclassFeature: false },
      { level: 9, proficiencyBonus: 4, features: [], subclassFeature: false },
      { level: 12, proficiencyBonus: 4, features: [], subclassFeature: false },
      { level: 13, proficiencyBonus: 5, features: [], subclassFeature: false },
      { level: 16, proficiencyBonus: 5, features: [], subclassFeature: false },
      { level: 17, proficiencyBonus: 6, features: [], subclassFeature: false },
      { level: 20, proficiencyBonus: 6, features: [], subclassFeature: false },
    ],
  } satisfies Pick<CharacterClass, 'levels'>;

  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])('at level %i returns proficiency bonus +%i', (level, expectedBonus) => {
    expect(getProficiencyBonus(characterClass, level)).toBe(expectedBonus);
  });

  it('rejects levels outside the supported character progression', () => {
    expect(() => getProficiencyBonus(characterClass, 0)).toThrow(RangeError);
    expect(() => getProficiencyBonus(characterClass, 21)).toThrow(RangeError);
    expect(() => getProficiencyBonus(characterClass, 1.5)).toThrow(RangeError);
  });

  it('reports a missing class level instead of guessing its bonus', () => {
    expect(() => getProficiencyBonus(characterClass, 2)).toThrow(
      'No class progression exists for level 2.',
    );
  });
});
