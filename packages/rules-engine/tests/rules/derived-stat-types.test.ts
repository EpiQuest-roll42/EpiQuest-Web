import { expect, it } from 'vitest';
import type {
  CharacterStatContext,
  HitPoints,
  SavingThrowModifier,
  ValueBreakdown,
} from '../../src/index.js';

const context = {
  level: 3,
  abilities: {
    str: { score: 10, modifier: 0 },
    dex: { score: 14, modifier: 2 },
    con: { score: 15, modifier: 2 },
    int: { score: 12, modifier: 1 },
    wis: { score: 16, modifier: 3 },
    cha: { score: 8, modifier: -1 },
  },
  proficiencyBonus: 2,
} satisfies CharacterStatContext;

const armorClass = {
  value: 14,
  parts: [
    { source: { kind: 'item', ref: 'leather-armor' }, value: 11 },
    { source: { kind: 'ability', ref: 'dex' }, value: 3 },
  ],
} satisfies ValueBreakdown;

const savingThrow = {
  ability: 'wis',
  modifier: 5,
  proficient: true,
} satisfies SavingThrowModifier;

const hitPoints = {
  current: 24,
  max: 24,
  temporary: 0,
} satisfies HitPoints;

it('models a shared character context and derived-stat outputs', () => {
  expect({
    context,
    armorClass,
    savingThrow,
    hitPoints,
  }).toEqual({
    context: {
      level: 3,
      abilities: {
        str: { score: 10, modifier: 0 },
        dex: { score: 14, modifier: 2 },
        con: { score: 15, modifier: 2 },
        int: { score: 12, modifier: 1 },
        wis: { score: 16, modifier: 3 },
        cha: { score: 8, modifier: -1 },
      },
      proficiencyBonus: 2,
    },
    armorClass: {
      value: 14,
      parts: [
        { source: { kind: 'item', ref: 'leather-armor' }, value: 11 },
        { source: { kind: 'ability', ref: 'dex' }, value: 3 },
      ],
    },
    savingThrow: { ability: 'wis', modifier: 5, proficient: true },
    hitPoints: { current: 24, max: 24, temporary: 0 },
  });
});
