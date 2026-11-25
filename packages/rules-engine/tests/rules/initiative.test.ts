import { describe, expect, it } from 'vitest';
import {
  calculateInitiative,
  getAbilityScores,
  InitiativeCalculationError,
} from '../../src/index.js';
import type { InitiativeInput } from '../../src/index.js';

function createInput(dexterity: number): InitiativeInput {
  return {
    abilities: getAbilityScores({
      str: 10,
      dex: dexterity,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    }),
  };
}

describe('calculateInitiative', () => {
  it('uses the Dexterity modifier as the initiative modifier', () => {
    expect(calculateInitiative(createInput(16))).toEqual({
      value: 3,
      parts: [{ source: { kind: 'ability', ref: 'dex' }, value: 3 }],
    });
  });

  it('preserves a negative Dexterity modifier', () => {
    expect(calculateInitiative(createInput(8))).toEqual({
      value: -1,
      parts: [{ source: { kind: 'ability', ref: 'dex' }, value: -1 }],
    });
  });

  it('returns zero for a neutral Dexterity modifier', () => {
    expect(calculateInitiative(createInput(10)).value).toBe(0);
  });

  it('rejects an invalid Dexterity modifier', () => {
    const input = createInput(10);
    input.abilities.dex.modifier = Number.NaN;

    expect(() => calculateInitiative(input)).toThrowError(
      expect.objectContaining<Partial<InitiativeCalculationError>>({ code: 'invalid_input' }),
    );
  });
});
