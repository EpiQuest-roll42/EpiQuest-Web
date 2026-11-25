import { describe, expect, it } from 'vitest';
import {
  calculateArmorClass,
  calculateInitiative,
  calculateMaxHitPoints,
  calculatePassivePerception,
  calculateSavingThrows,
  getProficiencyBonus,
} from '../../src/index.js';
import { referenceCharacters } from './reference-characters.js';

const expectedStatistics = {
  aveline: {
    armorClass: {
      value: 15,
      parts: [
        { source: { kind: 'item', ref: 'studded-leather-armor' }, value: 12 },
        { source: { kind: 'ability', ref: 'dex' }, value: 3 },
      ],
    },
    hitPoints: 25,
    initiative: {
      value: 3,
      parts: [{ source: { kind: 'ability', ref: 'dex' }, value: 3 }],
    },
    savingThrows: [
      { ability: 'str', modifier: 2, proficient: true },
      { ability: 'dex', modifier: 5, proficient: true },
      { ability: 'con', modifier: 1, proficient: false },
      { ability: 'int', modifier: -1, proficient: false },
      { ability: 'wis', modifier: 2, proficient: false },
      { ability: 'cha', modifier: 1, proficient: false },
    ],
    passivePerception: {
      value: 14,
      parts: [
        { source: { kind: 'base', ref: 'passive-perception' }, value: 10 },
        { source: { kind: 'ability', ref: 'wis' }, value: 2 },
        { source: { kind: 'proficiency', ref: 'perception' }, value: 2 },
      ],
    },
  },
  doran: {
    armorClass: {
      value: 18,
      parts: [
        { source: { kind: 'item', ref: 'chain-mail' }, value: 16 },
        { source: { kind: 'item', ref: 'shield' }, value: 2 },
      ],
    },
    hitPoints: 30,
    initiative: {
      value: -1,
      parts: [{ source: { kind: 'ability', ref: 'dex' }, value: -1 }],
    },
    savingThrows: [
      { ability: 'str', modifier: 1, proficient: false },
      { ability: 'dex', modifier: -1, proficient: false },
      { ability: 'con', modifier: 3, proficient: false },
      { ability: 'int', modifier: 1, proficient: false },
      { ability: 'wis', modifier: 5, proficient: true },
      { ability: 'cha', modifier: 2, proficient: true },
    ],
    passivePerception: {
      value: 13,
      parts: [
        { source: { kind: 'base', ref: 'passive-perception' }, value: 10 },
        { source: { kind: 'ability', ref: 'wis' }, value: 3 },
      ],
    },
  },
} as const;

for (const character of referenceCharacters) {
  const expected = expectedStatistics[character.id];
  const proficiencyBonus = getProficiencyBonus(character.characterClass, character.level);

  describe(`${character.name}, niveau ${character.level}`, () => {
    it('matches its reference armor class', () => {
      expect(
        calculateArmorClass({
          abilities: character.abilities,
          armor: character.armor,
          shield: character.shield,
          unarmoredDefense: null,
        }),
      ).toEqual(expected.armorClass);
    });

    it('matches its reference maximum hit points', () => {
      expect(
        calculateMaxHitPoints({
          level: character.level,
          hitDie: character.characterClass.hitDie,
          constitutionModifier: character.abilities.con.modifier,
          method: 'average',
          hitPointMaximumEffects: character.hitPointMaximumEffects,
        }),
      ).toBe(expected.hitPoints);
    });

    it('matches its reference initiative modifier', () => {
      expect(calculateInitiative({ abilities: character.abilities })).toEqual(expected.initiative);
    });

    it('matches its reference saving throws', () => {
      expect(
        calculateSavingThrows({
          abilities: character.abilities,
          proficiencyBonus,
          proficientAbilities: character.characterClass.savingThrows,
        }),
      ).toEqual(expected.savingThrows);
    });

    it('matches its reference passive Perception', () => {
      expect(
        calculatePassivePerception({
          abilities: character.abilities,
          proficiencyBonus,
          proficiency: character.perceptionProficiency,
        }),
      ).toEqual(expected.passivePerception);
    });
  });
}
