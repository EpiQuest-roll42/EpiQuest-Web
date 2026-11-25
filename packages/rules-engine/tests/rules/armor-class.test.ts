import { describe, expect, it } from 'vitest';
import { ArmorClassError, calculateArmorClass, getAbilityScores } from '../../src/index.js';
import type { ArmorClassInput } from '../../src/index.js';

function createInput(
  dexterity: number,
  constitution = 10,
  overrides: Partial<ArmorClassInput> = {},
): ArmorClassInput {
  return {
    abilities: getAbilityScores({
      str: 10,
      dex: dexterity,
      con: constitution,
      int: 10,
      wis: 10,
      cha: 10,
    }),
    armor: null,
    shield: null,
    unarmoredDefense: null,
    ...overrides,
  };
}

describe('calculateArmorClass', () => {
  it('calculates unarmored AC from the base and Dexterity modifier', () => {
    expect(calculateArmorClass(createInput(16))).toEqual({
      value: 13,
      parts: [
        { source: { kind: 'base', ref: 'unarmored' }, value: 10 },
        { source: { kind: 'ability', ref: 'dex' }, value: 3 },
      ],
    });
  });

  it('adds an uncapped Dexterity modifier to light armor', () => {
    expect(
      calculateArmorClass(
        createInput(18, 10, {
          armor: { id: 'leather-armor', baseArmorClass: 11, dexterityCap: null },
        }),
      ),
    ).toEqual({
      value: 15,
      parts: [
        { source: { kind: 'item', ref: 'leather-armor' }, value: 11 },
        { source: { kind: 'ability', ref: 'dex' }, value: 4 },
      ],
    });
  });

  it('caps Dexterity at +2 for medium armor', () => {
    expect(
      calculateArmorClass(
        createInput(18, 10, {
          armor: { id: 'chain-shirt', baseArmorClass: 13, dexterityCap: 2 },
        }),
      ),
    ).toMatchObject({ value: 15, parts: [{ value: 13 }, { value: 2 }] });
  });

  it('keeps negative Dexterity modifiers for armor with a positive cap', () => {
    expect(
      calculateArmorClass(
        createInput(8, 10, {
          armor: { id: 'chain-shirt', baseArmorClass: 13, dexterityCap: 2 },
        }),
      ),
    ).toMatchObject({ value: 12, parts: [{ value: 13 }, { value: -1 }] });
  });

  it('does not apply Dexterity to heavy armor', () => {
    expect(
      calculateArmorClass(
        createInput(8, 10, {
          armor: { id: 'chain-mail', baseArmorClass: 16, dexterityCap: 0 },
        }),
      ),
    ).toEqual({
      value: 16,
      parts: [{ source: { kind: 'item', ref: 'chain-mail' }, value: 16 }],
    });
  });

  it('adds the shield bonus to armor and unarmored AC', () => {
    const shield = { id: 'shield', bonus: 2 };
    expect(
      calculateArmorClass(
        createInput(14, 10, {
          armor: { id: 'leather-armor', baseArmorClass: 11, dexterityCap: null },
          shield,
        }),
      ).value,
    ).toBe(15);
    expect(calculateArmorClass(createInput(14, 10, { shield })).value).toBe(14);
  });

  it('evaluates an unarmored defense formula and includes its feature in the breakdown', () => {
    expect(
      calculateArmorClass(
        createInput(14, 16, {
          shield: { id: 'shield', bonus: 2 },
          unarmoredDefense: {
            id: 'unarmored-defense',
            formula: '10 + @dex + @con',
            allowsShield: true,
          },
        }),
      ),
    ).toEqual({
      value: 17,
      parts: [
        { source: { kind: 'feature', ref: 'unarmored-defense' }, value: 10 },
        { source: { kind: 'ability', ref: 'dex' }, value: 2 },
        { source: { kind: 'ability', ref: 'con' }, value: 3 },
        { source: { kind: 'item', ref: 'shield' }, value: 2 },
      ],
    });
  });

  it('falls back to standard unarmored AC when a defense formula forbids the equipped shield', () => {
    expect(
      calculateArmorClass(
        createInput(14, 16, {
          shield: { id: 'shield', bonus: 2 },
          unarmoredDefense: {
            id: 'unarmored-defense',
            formula: '10 + @dex + @wis',
            allowsShield: false,
          },
        }),
      ).value,
    ).toBe(14);
  });

  it('uses worn armor instead of an unarmored defense formula', () => {
    expect(
      calculateArmorClass(
        createInput(14, 16, {
          armor: { id: 'leather-armor', baseArmorClass: 11, dexterityCap: null },
          unarmoredDefense: {
            id: 'unarmored-defense',
            formula: '10 + @dex + @wis',
            allowsShield: true,
          },
        }),
      ).value,
    ).toBe(13);
  });

  it.each([
    ['10 + @spellMod', 'unknown_formula_variable'],
    ['10 + 1d4', 'unsupported_formula_term'],
    ['10 +', 'invalid_formula'],
  ] as const)('rejects formula %s with %s', (formula, code) => {
    expect(() =>
      calculateArmorClass(
        createInput(14, 10, {
          unarmoredDefense: { id: 'unarmored-defense', formula, allowsShield: true },
        }),
      ),
    ).toThrowError(expect.objectContaining<Partial<ArmorClassError>>({ code }));
  });

  it('rejects invalid armor and shield values', () => {
    expect(() =>
      calculateArmorClass(
        createInput(14, 10, {
          armor: { id: 'leather-armor', baseArmorClass: 11.5, dexterityCap: null },
        }),
      ),
    ).toThrowError(ArmorClassError);

    expect(() =>
      calculateArmorClass(createInput(14, 10, { shield: { id: 'shield', bonus: -1 } })),
    ).toThrowError(ArmorClassError);
  });
});
