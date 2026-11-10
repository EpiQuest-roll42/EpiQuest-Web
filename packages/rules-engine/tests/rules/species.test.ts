import { expect, it } from 'vitest';
import type { Species } from '../../src/index.js';

const highElf = {
  id: 'high-elf',
  name: 'Haut-elfe',
  family: 'elf',
  size: 'medium',
  speedMeters: 9,
  abilityBonuses: [
    { ability: 'dex', value: 2 },
    { ability: 'int', value: 1 },
  ],
  traits: [
    {
      id: 'keen-senses',
      name: 'Sens aiguisés',
      description: ['Vous maîtrisez la compétence Perception.'],
      actions: [],
      passive: [],
      automation: 'full',
    },
  ],
  languages: [
    { id: 'common', name: 'Commun' },
    { id: 'elvish', name: 'Elfique' },
  ],
  choiceGroups: [
    {
      id: 'high-elf-cantrip',
      choose: 1,
      options: [
        {
          id: 'prestidigitation',
          grants: [
            { kind: 'ref', ref: { id: 'prestidigitation', name: 'Prestidigitation' }, quantity: 1 },
          ],
        },
      ],
      chosen: [],
    },
  ],
} satisfies Species;

it('represents an SRD species using rules data for its traits and choices', () => {
  expect(highElf).toMatchObject({
    id: 'high-elf',
    family: 'elf',
    size: 'medium',
    speedMeters: 9,
    abilityBonuses: [
      { ability: 'dex', value: 2 },
      { ability: 'int', value: 1 },
    ],
    traits: [{ id: 'keen-senses', automation: 'full' }],
    choiceGroups: [{ id: 'high-elf-cantrip', choose: 1, chosen: [] }],
  });
});

const halfElf = {
  id: 'half-elf',
  name: 'Demi-elf',
  family: 'elf',
  size: 'medium',
  speedMeters: 9,
  abilityBonuses: [{ ability: 'cha', value: 2 }],
  traits: [],
  languages: [],
  choiceGroups: [
    {
      id: 'half-elf-ability-bonuses',
      choose: 2,
      options: [
        { id: 'str', grants: [{ kind: 'abilityBonus', ability: 'str', value: 1 }] },
        { id: 'dex', grants: [{ kind: 'abilityBonus', ability: 'dex', value: 1 }] },
        { id: 'con', grants: [{ kind: 'abilityBonus', ability: 'con', value: 1 }] },
        { id: 'int', grants: [{ kind: 'abilityBonus', ability: 'int', value: 1 }] },
        { id: 'wis', grants: [{ kind: 'abilityBonus', ability: 'wis', value: 1 }] },
      ],
      chosen: [],
    },
  ],
} satisfies Species;

it('represents a species choice that grants ability bonuses', () => {
  expect(halfElf.choiceGroups[0]).toEqual({
    id: 'half-elf-ability-bonuses',
    choose: 2,
    options: [
      { id: 'str', grants: [{ kind: 'abilityBonus', ability: 'str', value: 1 }] },
      { id: 'dex', grants: [{ kind: 'abilityBonus', ability: 'dex', value: 1 }] },
      { id: 'con', grants: [{ kind: 'abilityBonus', ability: 'con', value: 1 }] },
      { id: 'int', grants: [{ kind: 'abilityBonus', ability: 'int', value: 1 }] },
      { id: 'wis', grants: [{ kind: 'abilityBonus', ability: 'wis', value: 1 }] },
    ],
    chosen: [],
  });
});
