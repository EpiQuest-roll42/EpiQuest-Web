import type {
  Background,
  CharacterClass,
  ClassSummaryPage,
  Condition,
  Item,
  ItemSummaryPage,
  ParameterSrdId,
  RuleRefPage,
  Species,
  SpeciesSummaryPage,
  Spell,
  SpellSummaryPage,
  SrdAttribution,
  operations,
} from '../api/schema';

type QueryParams<Operation extends keyof operations> = NonNullable<
  operations[Operation]['parameters']['query']
>;

export interface SrdRepository {
  listSpecies(params?: QueryParams<'listSpecies'>): Promise<SpeciesSummaryPage>;
  getSpecies(ruleId: ParameterSrdId): Promise<Species>;
  listClasses(params?: QueryParams<'listClasses'>): Promise<ClassSummaryPage>;
  getClass(ruleId: ParameterSrdId): Promise<CharacterClass>;
  listBackgrounds(params?: QueryParams<'listBackgrounds'>): Promise<RuleRefPage>;
  getBackground(ruleId: ParameterSrdId): Promise<Background>;
  listSpells(params?: QueryParams<'listSpells'>): Promise<SpellSummaryPage>;
  getSpell(ruleId: ParameterSrdId): Promise<Spell>;
  listItems(params?: QueryParams<'listItems'>): Promise<ItemSummaryPage>;
  getItem(ruleId: ParameterSrdId): Promise<Item>;
  listConditions(params?: QueryParams<'listConditions'>): Promise<RuleRefPage>;
  getCondition(ruleId: ParameterSrdId): Promise<Condition>;
  getAttribution(): Promise<SrdAttribution>;
}
