export type RuleId = string;

export interface RuleRef {
  id: RuleId;
  name: string;
}

export type SrdDescription = string[];

export type AbilityCode = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
