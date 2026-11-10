import { expect, it } from 'vitest';
import type { Background } from '../../src/index.js';

const acolyte = {
  id: 'acolyte',
  name: 'Acolyte',
  proficiencies: [
    { type: 'proficiency', kind: 'skill', ref: 'insight' },
    { type: 'proficiency', kind: 'skill', ref: 'religion' },
  ],
  choiceGroups: [
    {
      id: 'acolyte-languages',
      choose: 2,
      options: [
        {
          id: 'elvish',
          grants: [{ kind: 'ref', ref: { id: 'elvish', name: 'Elfique' }, quantity: 1 }],
        },
        {
          id: 'dwarvish',
          grants: [{ kind: 'ref', ref: { id: 'dwarvish', name: 'Nain' }, quantity: 1 }],
        },
      ],
      chosen: [],
    },
  ],
  equipment: [{ item: { id: 'prayer-book', name: 'Livre de prières' }, quantity: 1 }],
  feature: {
    id: 'shelter-of-the-faithful',
    name: 'Abri des fidèles',
    description: ['Votre communauté religieuse peut vous offrir un soutien ponctuel.'],
    actions: [],
    passive: [],
    automation: 'manual',
  },
  description: ['Vous avez consacré votre vie au service d’un temple.'],
} satisfies Background;

it('represents a background with proficiencies, choices, equipment, and a feature', () => {
  expect(acolyte).toMatchObject({
    id: 'acolyte',
    proficiencies: [
      { kind: 'skill', ref: 'insight' },
      { kind: 'skill', ref: 'religion' },
    ],
    choiceGroups: [{ id: 'acolyte-languages', choose: 2, chosen: [] }],
    equipment: [{ item: { id: 'prayer-book' }, quantity: 1 }],
    feature: { id: 'shelter-of-the-faithful', automation: 'manual' },
  });
});
