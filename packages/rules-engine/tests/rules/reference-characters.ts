import { getAbilityScores } from '../../src/index.js';
import type {
  AbilityScores,
  ArmorClassArmor,
  ArmorClassShield,
  CharacterClass,
  HitPointMaximumEffect,
  RuleRef,
  SkillProficiency,
} from '../../src/index.js';

type ReferenceClass = Pick<CharacterClass, 'id' | 'name' | 'hitDie' | 'savingThrows' | 'levels'>;

export interface ReferenceCharacter {
  id: 'aveline' | 'doran';
  name: string;
  level: number;
  species: RuleRef;
  characterClass: ReferenceClass;
  background: RuleRef;
  abilities: AbilityScores;
  armor: ArmorClassArmor | null;
  shield: ArmorClassShield | null;
  hitPointMaximumEffects: HitPointMaximumEffect[];
  perceptionProficiency: SkillProficiency;
}

const rangerLevels: CharacterClass['levels'] = [1, 2, 3].map((level) => ({
  level,
  proficiencyBonus: 2,
  features: [],
  subclassFeature: level === 3,
}));

const clericLevels: CharacterClass['levels'] = [1, 2, 3].map((level) => ({
  level,
  proficiencyBonus: 2,
  features: [],
  subclassFeature: level === 1,
}));

export const referenceCharacters = [
  {
    id: 'aveline',
    name: 'Aveline',
    level: 3,
    species: { id: 'high-elf', name: 'Haut-elfe' },
    characterClass: {
      id: 'ranger',
      name: 'Rôdeuse',
      hitDie: 'd10',
      savingThrows: ['str', 'dex'],
      levels: rangerLevels,
    },
    background: { id: 'acolyte', name: 'Acolyte' },
    abilities: getAbilityScores({
      str: 10,
      dex: 17,
      con: 13,
      int: 9,
      wis: 14,
      cha: 12,
    }),
    armor: { id: 'studded-leather-armor', baseArmorClass: 12, dexterityCap: null },
    shield: null,
    hitPointMaximumEffects: [],
    perceptionProficiency: 'proficient',
  },
  {
    id: 'doran',
    name: 'Doran',
    level: 3,
    species: { id: 'hill-dwarf', name: 'Nain des collines' },
    characterClass: {
      id: 'cleric',
      name: 'Clerc',
      hitDie: 'd8',
      savingThrows: ['wis', 'cha'],
      levels: clericLevels,
    },
    background: { id: 'acolyte', name: 'Acolyte' },
    abilities: getAbilityScores({
      str: 13,
      dex: 8,
      con: 16,
      int: 12,
      wis: 16,
      cha: 10,
    }),
    armor: { id: 'chain-mail', baseArmorClass: 16, dexterityCap: 0 },
    shield: { id: 'shield', bonus: 2 },
    hitPointMaximumEffects: [{ type: 'hitPointMaximum', perLevel: 1 }],
    perceptionProficiency: 'none',
  },
] satisfies ReferenceCharacter[];
