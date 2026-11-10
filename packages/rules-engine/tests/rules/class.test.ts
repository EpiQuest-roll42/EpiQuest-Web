import { expect, it } from 'vitest';
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
