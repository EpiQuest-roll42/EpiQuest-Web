export type RerollModifier =
  | { type: 'reroll'; mode: 'equal'; value: number }
  | { type: 'reroll'; mode: 'atMost'; value: number };

export type DiceModifier =
  | { type: 'keep'; mode: 'highest' | 'lowest'; count: number }
  | { type: 'explode' }
  | RerollModifier;

export type DiceTerm =
  | { type: 'dice'; count: number; sides: number; modifiers: DiceModifier[] }
  | { type: 'constant'; value: number };

export interface DiceExpression {
  type: 'dice-expression';
  terms: Array<{ sign: 1 | -1; term: DiceTerm }>;
}

export type ParseErrorCode =
  | 'unexpected_character'
  | 'unexpected_end'
  | 'missing_sides'
  | 'leading_zero'
  | 'expression_too_long'
  | 'too_many_terms'
  | 'dice_count_out_of_range'
  | 'too_many_dice'
  | 'sides_out_of_range'
  | 'constant_out_of_range'
  | 'keep_out_of_range'
  | 'reroll_out_of_range'
  | 'duplicate_modifier'
  | 'incompatible_modifiers';

export type ParseErrorParams = Record<string, number>;

export interface ParseError {
  code: ParseErrorCode;
  position: number;
  length: number;
  params: ParseErrorParams;
}

export type ParseResult = { ok: true; value: DiceExpression } | { ok: false; error: ParseError };
