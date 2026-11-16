export type RuleId = string;

export interface RuleRef {
  id: RuleId;
  name: string;
}

export type SrdDescription = string[];

export type AbilityCode = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type AbilityScore = number;

export interface AbilityScoreValue {
  score: AbilityScore;
  modifier: number;
}

export interface AbilityScores {
  str: AbilityScoreValue;
  dex: AbilityScoreValue;
  con: AbilityScoreValue;
  int: AbilityScoreValue;
  wis: AbilityScoreValue;
  cha: AbilityScoreValue;
}

export type AbilityScoreValues = Record<AbilityCode, AbilityScore>;

export type AbilityModifiers = Record<AbilityCode, number>;

export type ProficiencyBonus = 2 | 3 | 4 | 5 | 6;

export interface CharacterStatContext {
  level: number;
  abilities: AbilityScores;
  proficiencyBonus: ProficiencyBonus;
}

export interface ArmorClassArmor {
  id: RuleId;
  baseArmorClass: number;
  dexterityCap: number | null;
}

export interface ArmorClassShield {
  id: RuleId;
  bonus: number;
}

export interface UnarmoredDefense {
  id: RuleId;
  formula: string;
  allowsShield: boolean;
}

export interface ArmorClassInput {
  abilities: AbilityScores;
  armor: ArmorClassArmor | null;
  shield: ArmorClassShield | null;
  unarmoredDefense: UnarmoredDefense | null;
}

export type ValueSourceKind = 'base' | 'ability' | 'item' | 'feature' | 'proficiency' | 'species';

export interface ValueSource {
  kind: ValueSourceKind;
  ref: RuleId;
}

export interface ValueBreakdownPart {
  source: ValueSource;
  value: number;
}

export interface ValueBreakdown {
  value: number;
  parts: ValueBreakdownPart[];
}

export interface SavingThrowModifier {
  ability: AbilityCode;
  modifier: number;
  proficient: boolean;
}

export type SavingThrowInput = Pick<CharacterStatContext, 'abilities' | 'proficiencyBonus'> & {
  proficientAbilities: AbilityCode[];
};

export type SkillProficiency = 'none' | 'proficient' | 'expertise';

export type PassivePerceptionInput = Pick<
  CharacterStatContext,
  'abilities' | 'proficiencyBonus'
> & {
  proficiency: SkillProficiency;
};

export interface HitPoints {
  current: number;
  max: number;
  temporary: number;
}

export type HitDie = 'd6' | 'd8' | 'd10' | 'd12';

export type HitPointMethod = 'average' | 'roll';

export interface HitPointMaximumEffect {
  type: 'hitPointMaximum';
  perLevel: number;
}

interface HitPointCalculationBase {
  level: number;
  hitDie: HitDie;
  constitutionModifier: number;
  hitPointMaximumEffects: HitPointMaximumEffect[];
}

export type HitPointCalculationInput =
  | (HitPointCalculationBase & { method: 'average'; rolls?: never })
  | (HitPointCalculationBase & { method: 'roll'; rolls: number[] });

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
  proficiencyBonus: ProficiencyBonus;
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
  hitDie: HitDie;
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
