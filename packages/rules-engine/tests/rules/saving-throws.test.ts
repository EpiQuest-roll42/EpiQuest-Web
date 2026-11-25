import { describe, expect, it } from 'vitest';
import {
  calculateSavingThrows,
  SavingThrowCalculationError,
  getAbilityScores,
} from '../../src/index.js';
import type { SavingThrowInput } from '../../src/index.js';

function createInput(overrides: Partial<SavingThrowInput> = {}): SavingThrowInput {
  return {
    abilities: getAbilityScores({
      str: 10,
      dex: 14,
      con: 12,
      int: 8,
      wis: 16,
      cha: 18,
    }),
    proficiencyBonus: 2,
    proficientAbilities: [],
    ...overrides,
  };
}

describe('calculateSavingThrows', () => {
  it('returns all six ability saving throws in canonical order', () => {
    expect(calculateSavingThrows(createInput())).toEqual([
      { ability: 'str', modifier: 0, proficient: false },
      { ability: 'dex', modifier: 2, proficient: false },
      { ability: 'con', modifier: 1, proficient: false },
      { ability: 'int', modifier: -1, proficient: false },
      { ability: 'wis', modifier: 3, proficient: false },
      { ability: 'cha', modifier: 4, proficient: false },
    ]);
  });

  it('adds proficiency only to proficient saving throws', () => {
    expect(
      calculateSavingThrows(
        createInput({
          proficiencyBonus: 3,
          proficientAbilities: ['str', 'con'],
        }),
      ),
    ).toEqual([
      { ability: 'str', modifier: 3, proficient: true },
      { ability: 'dex', modifier: 2, proficient: false },
      { ability: 'con', modifier: 4, proficient: true },
      { ability: 'int', modifier: -1, proficient: false },
      { ability: 'wis', modifier: 3, proficient: false },
      { ability: 'cha', modifier: 4, proficient: false },
    ]);
  });

  it('preserves negative modifiers on proficient saving throws', () => {
    const input = createInput({
      abilities: getAbilityScores({
        str: 10,
        dex: 10,
        con: 1,
        int: 10,
        wis: 10,
        cha: 10,
      }),
      proficiencyBonus: 2,
      proficientAbilities: ['con'],
    });

    expect(calculateSavingThrows(input)[2]).toEqual({
      ability: 'con',
      modifier: -3,
      proficient: true,
    });
  });

  it('does not double proficiency when an ability appears more than once', () => {
    const result = calculateSavingThrows(
      createInput({ proficiencyBonus: 4, proficientAbilities: ['wis', 'wis'] }),
    );

    expect(result[4]).toEqual({ ability: 'wis', modifier: 7, proficient: true });
  });

  it('rejects invalid proficiency bonus values', () => {
    expect(() =>
      calculateSavingThrows(
        createInput({ proficiencyBonus: 1 as SavingThrowInput['proficiencyBonus'] }),
      ),
    ).toThrowError(
      expect.objectContaining<Partial<SavingThrowCalculationError>>({ code: 'invalid_input' }),
    );
  });

  it('rejects unknown proficient ability codes', () => {
    expect(() =>
      calculateSavingThrows(
        createInput({
          proficientAbilities: ['luck' as SavingThrowInput['proficientAbilities'][number]],
        }),
      ),
    ).toThrowError(SavingThrowCalculationError);
  });

  it('rejects invalid ability modifiers', () => {
    const input = createInput();
    input.abilities.str.modifier = Number.NaN;

    expect(() => calculateSavingThrows(input)).toThrowError(
      expect.objectContaining<Partial<SavingThrowCalculationError>>({ code: 'invalid_input' }),
    );
  });
});
