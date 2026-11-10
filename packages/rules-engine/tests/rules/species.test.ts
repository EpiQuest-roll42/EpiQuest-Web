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
