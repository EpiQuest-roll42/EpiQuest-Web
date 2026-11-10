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
