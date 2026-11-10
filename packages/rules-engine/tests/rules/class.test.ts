import { expect, it } from 'vitest';
import { getProficiencyBonus } from '../../src/index.js';
import type { CharacterClass } from '../../src/index.js';

const fighter = {
  id: 'fighter',
  name: 'Guerrier',
  hitDie: 'd10',
  primaryAbilities: ['str', 'dex'],
  savingThrows: ['str', 'con'],
  proficiencies: {
    armor: [{ id: 'all-armor', name: 'Toutes les armures' }],
    weapons: [{ id: 'all-weapons', name: 'Toutes les armes' }],
    tools: [],
  },
  choiceGroups: [],
  spellcasting: null,
  levels: [
    {
      level: 1,
      proficiencyBonus: 2,
      features: [],
      subclassFeature: false,
    },
  ],
  subclasses: [],
} satisfies CharacterClass;

it('represents a non-spellcasting class with level progression data', () => {
  expect(fighter).toMatchObject({
    id: 'fighter',
    hitDie: 'd10',
    primaryAbilities: ['str', 'dex'],
    savingThrows: ['str', 'con'],
    spellcasting: null,
    levels: [{ level: 1, proficiencyBonus: 2, subclassFeature: false }],
  });
});

const wizard = {
  id: 'wizard',
  name: 'Magicien',
  hitDie: 'd6',
  primaryAbilities: ['int'],
  savingThrows: ['int', 'wis'],
  proficiencies: {
    armor: [],
    weapons: [
      { id: 'dagger', name: 'Dague' },
      { id: 'dart', name: 'Fléchette' },
      { id: 'sling', name: 'Fronde' },
      { id: 'quarterstaff', name: 'Bâton' },
      { id: 'light-crossbow', name: 'Arbalète légère' },
    ],
    tools: [],
  },
  choiceGroups: [
    {
      id: 'wizard-skills',
      choose: 2,
      options: [
        {
          id: 'arcana',
          grants: [{ kind: 'ref', ref: { id: 'arcana', name: 'Arcanes' }, quantity: 1 }],
        },
        {
          id: 'history',
          grants: [{ kind: 'ref', ref: { id: 'history', name: 'Histoire' }, quantity: 1 }],
        },
        {
          id: 'insight',
          grants: [{ kind: 'ref', ref: { id: 'insight', name: 'Perspicacité' }, quantity: 1 }],
        },
        {
          id: 'investigation',
          grants: [
            { kind: 'ref', ref: { id: 'investigation', name: 'Investigation' }, quantity: 1 },
          ],
        },
        {
          id: 'medicine',
          grants: [{ kind: 'ref', ref: { id: 'medicine', name: 'Médecine' }, quantity: 1 }],
        },
        {
          id: 'religion',
          grants: [{ kind: 'ref', ref: { id: 'religion', name: 'Religion' }, quantity: 1 }],
        },
      ],
      chosen: [],
    },
  ],
  spellcasting: {
    ability: 'int',
    preparation: 'prepared',
    slotProgression: 'standard',
    slotsByLevel: [
      { level: 1, slots: [{ slotLevel: 1, count: 2 }] },
      { level: 2, slots: [{ slotLevel: 1, count: 3 }] },
      {
        level: 3,
        slots: [
          { slotLevel: 1, count: 4 },
          { slotLevel: 2, count: 2 },
        ],
      },
      {
        level: 4,
        slots: [
          { slotLevel: 1, count: 4 },
          { slotLevel: 2, count: 3 },
        ],
      },
      {
        level: 5,
        slots: [
          { slotLevel: 1, count: 4 },
          { slotLevel: 2, count: 3 },
          { slotLevel: 3, count: 2 },
        ],
      },
    ],
    cantripsKnownByLevel: [
      { level: 1, count: 3 },
      { level: 4, count: 4 },
    ],
  },
  levels: [
    { level: 1, proficiencyBonus: 2, features: [], subclassFeature: false },
    { level: 2, proficiencyBonus: 2, features: [], subclassFeature: true },
    { level: 3, proficiencyBonus: 2, features: [], subclassFeature: false },
    { level: 4, proficiencyBonus: 2, features: [], subclassFeature: false },
    { level: 5, proficiencyBonus: 3, features: [], subclassFeature: false },
  ],
  subclasses: [
    {
      id: 'evocation',
      name: 'Évocation',
      class: { id: 'wizard', name: 'Magicien' },
      levels: [{ level: 2, features: [] }],
    },
  ],
} satisfies CharacterClass;

it('represents a spellcasting class with level progression and subclass', () => {
  expect(wizard.spellcasting).toMatchObject({
    ability: 'int',
    preparation: 'prepared',
    slotProgression: 'standard',
  });
  expect(wizard.spellcasting?.slotsByLevel).toEqual([
    { level: 1, slots: [{ slotLevel: 1, count: 2 }] },
    { level: 2, slots: [{ slotLevel: 1, count: 3 }] },
    {
      level: 3,
      slots: [
        { slotLevel: 1, count: 4 },
        { slotLevel: 2, count: 2 },
      ],
    },
    {
      level: 4,
      slots: [
        { slotLevel: 1, count: 4 },
        { slotLevel: 2, count: 3 },
      ],
    },
    {
      level: 5,
      slots: [
        { slotLevel: 1, count: 4 },
        { slotLevel: 2, count: 3 },
        { slotLevel: 3, count: 2 },
      ],
    },
  ]);
  expect(
    wizard.levels.map(({ level, proficiencyBonus, subclassFeature }) => [
      level,
      proficiencyBonus,
      subclassFeature,
    ]),
  ).toEqual([
    [1, 2, false],
    [2, 2, true],
    [3, 2, false],
    [4, 2, false],
    [5, 3, false],
  ]);
  expect(wizard.subclasses).toEqual([
    {
      id: 'evocation',
      name: 'Évocation',
      class: { id: 'wizard', name: 'Magicien' },
      levels: [{ level: 2, features: [] }],
    },
  ]);
  expect(wizard.levels.map(({ level }) => getProficiencyBonus(wizard, level))).toEqual([
    2, 2, 2, 2, 3,
  ]);
});

const warlock = {
  id: 'warlock',
  name: 'Occultiste',
  hitDie: 'd8',
  primaryAbilities: ['cha'],
  savingThrows: ['wis', 'cha'],
  proficiencies: {
    armor: [{ id: 'light-armor', name: 'Armures légères' }],
    weapons: [{ id: 'simple-weapons', name: 'Armes courantes' }],
    tools: [],
  },
  choiceGroups: [],
  spellcasting: {
    ability: 'cha',
    preparation: 'known',
    slotProgression: 'pact',
    pactSlotsByLevel: [
      { level: 1, count: 1, slotLevel: 1 },
      { level: 2, count: 2, slotLevel: 1 },
      { level: 3, count: 2, slotLevel: 2 },
      { level: 4, count: 2, slotLevel: 2 },
      { level: 5, count: 2, slotLevel: 3 },
    ],
    cantripsKnownByLevel: [
      { level: 1, count: 2 },
      { level: 4, count: 3 },
    ],
    spellsKnownByLevel: [
      { level: 1, count: 2 },
      { level: 2, count: 3 },
      { level: 3, count: 4 },
      { level: 4, count: 5 },
      { level: 5, count: 6 },
    ],
  },
  levels: [
    { level: 1, proficiencyBonus: 2, features: [], subclassFeature: true },
    { level: 2, proficiencyBonus: 2, features: [], subclassFeature: false },
    { level: 3, proficiencyBonus: 2, features: [], subclassFeature: false },
    { level: 4, proficiencyBonus: 2, features: [], subclassFeature: false },
    { level: 5, proficiencyBonus: 3, features: [], subclassFeature: false },
  ],
  subclasses: [
    {
      id: 'archfey',
      name: 'Archifée',
      class: { id: 'warlock', name: 'Occultiste' },
      levels: [{ level: 1, features: [] }],
    },
  ],
} satisfies CharacterClass;

it('represents pact spellcasting and spells-known progression', () => {
  expect(warlock.spellcasting).toMatchObject({
    ability: 'cha',
    preparation: 'known',
    slotProgression: 'pact',
  });
  expect(warlock.spellcasting.pactSlotsByLevel).toEqual([
    { level: 1, count: 1, slotLevel: 1 },
    { level: 2, count: 2, slotLevel: 1 },
    { level: 3, count: 2, slotLevel: 2 },
    { level: 4, count: 2, slotLevel: 2 },
    { level: 5, count: 2, slotLevel: 3 },
  ]);
  expect(warlock.spellcasting.spellsKnownByLevel).toEqual([
    { level: 1, count: 2 },
    { level: 2, count: 3 },
    { level: 3, count: 4 },
    { level: 4, count: 5 },
    { level: 5, count: 6 },
  ]);
  expect(warlock.spellcasting.slotsByLevel).toBeUndefined();
  expect(warlock.subclasses).toEqual([
    {
      id: 'archfey',
      name: 'Archifée',
      class: { id: 'warlock', name: 'Occultiste' },
      levels: [{ level: 1, features: [] }],
    },
  ]);
});
