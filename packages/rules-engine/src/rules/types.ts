export type RuleId = string;

export interface RuleRef {
  id: RuleId;
  name: string;
}

export type SrdDescription = string[];

export type AbilityCode = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type Size = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

export interface AbilityBonus {
  ability: AbilityCode;
  value: number;
}

export type Automation = 'full' | 'partial' | 'manual';

export interface Feature {
  id: RuleId;
  name: string;
  description: SrdDescription;
  level?: number;
  uses?: Record<string, unknown> | null;
  actions: Record<string, unknown>[];
  passive: Record<string, unknown>[];
  automation: Automation;
}

export type ChoiceGrant =
  | { kind: 'ref'; ref: RuleRef; quantity: number }
  | { kind: 'abilityBonus'; ability: AbilityCode; value: number };

export interface ChoiceOption {
  id: string;
  grants: ChoiceGrant[];
}

export interface ChoiceGroup {
  id: string;
  choose: number;
  options: ChoiceOption[];
  chosen: string[];
}

export interface Species {
  id: RuleId;
  name: string;
  family: RuleId;
  size: Size;
  speedMeters: number;
  abilityBonuses: AbilityBonus[];
  traits: Feature[];
  languages: RuleRef[];
  choiceGroups: ChoiceGroup[];
}

export interface ClassProficiencies {
  armor: RuleRef[];
  weapons: RuleRef[];
  tools: RuleRef[];
}

export interface SpellSlotAllowance {
  slotLevel: number;
  count: number;
}

export interface SpellSlotsAtLevel {
  level: number;
  slots: SpellSlotAllowance[];
}

export interface PactSlotsAtLevel {
  level: number;
  count: number;
  slotLevel: number;
}

export interface LevelCount {
  level: number;
  count: number;
}

export interface ClassSpellcasting {
  ability: AbilityCode;
  preparation: 'prepared' | 'known';
  slotProgression: 'standard' | 'pact';
  slotsByLevel?: SpellSlotsAtLevel[];
  pactSlotsByLevel?: PactSlotsAtLevel[];
  cantripsKnownByLevel: LevelCount[];
  spellsKnownByLevel?: LevelCount[];
}

export interface ClassLevel {
  level: number;
  proficiencyBonus: number;
  features: Feature[];
  subclassFeature: boolean;
}

export interface SubclassLevel {
  level: number;
  features: Feature[];
}

export interface Subclass {
  id: RuleId;
  name: string;
  class: RuleRef;
  levels: SubclassLevel[];
}

export interface CharacterClass {
  id: RuleId;
  name: string;
  hitDie: 'd6' | 'd8' | 'd10' | 'd12';
  primaryAbilities: AbilityCode[];
  savingThrows: AbilityCode[];
  proficiencies: ClassProficiencies;
  choiceGroups: ChoiceGroup[];
  spellcasting: ClassSpellcasting | null;
  levels: ClassLevel[];
  subclasses: Subclass[];
}

export type ProficiencyKind = 'skill' | 'savingThrow' | 'armor' | 'weapon' | 'tool' | 'language';

export interface ProficiencyEffect {
  type: 'proficiency';
  kind: ProficiencyKind;
  ref: RuleId;
  expertise?: boolean;
}

export interface ItemQuantity {
  item: RuleRef;
  quantity: number;
}

export interface Background {
  id: RuleId;
  name: string;
  proficiencies: ProficiencyEffect[];
  choiceGroups: ChoiceGroup[];
  equipment: ItemQuantity[];
  feature: Feature;
  description: SrdDescription;
}
