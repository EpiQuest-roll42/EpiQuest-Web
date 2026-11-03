export type DiceModifier =
  | { type: 'keep'; mode: 'highest' | 'lowest'; count: number }
  | { type: 'explode' }
  | {
      type: 'reroll';
      operator: '<' | '<=' | '=' | '>' | '>=';
      threshold: number;
    }
  | { type: 'advantage' | 'disadvantage' };

export type DiceTerm =
  | { type: 'dice'; count: number; sides: number; modifiers: DiceModifier[] }
  | { type: 'constant'; value: number };

export interface DiceExpression {
  type: 'dice-expression';
  terms: Array<{ sign: 1 | -1; term: DiceTerm }>;
}

export type ParseErrorCode =
  | 'EMPTY_EXPRESSION'
  | 'EXPECTED_TERM'
  | 'EXPECTED_DIE_SIDES'
  | 'INVALID_NUMBER'
  | 'DICE_COUNT_OUT_OF_RANGE'
  | 'DIE_SIDES_OUT_OF_RANGE'
  | 'INVALID_KEEP_MODIFIER'
  | 'KEEP_COUNT_OUT_OF_RANGE'
  | 'DUPLICATE_MODIFIER'
  | 'INVALID_REROLL_MODIFIER'
  | 'REROLL_THRESHOLD_OUT_OF_RANGE'
  | 'ADVANTAGE_REQUIRES_SINGLE_D20'
  | 'ADVANTAGE_CONFLICTS_WITH_MODIFIERS'
  | 'UNEXPECTED_CHARACTER';

export interface ParseError {
  code: ParseErrorCode;
  message: string;
  position: number;
}

export type ParseResult = { ok: true; value: DiceExpression } | { ok: false; error: ParseError };

const MAX_DICE_COUNT = 100;
const MAX_DIE_SIDES = 1000;

class DiceExpressionParser {
  private position = 0;
  private error: ParseError | undefined;

  constructor(private readonly input: string) {}

  parse(): ParseResult {
    this.skipWhitespace();

    if (this.position === this.input.length) {
      return this.fail('EMPTY_EXPRESSION', "L'expression est vide.", this.position);
    }

    const terms: DiceExpression['terms'] = [];
    let sign: 1 | -1 = 1;

    if (this.peek() === '+' || this.peek() === '-') {
      sign = this.consume() === '+' ? 1 : -1;
      this.skipWhitespace();
    }

    while (true) {
      const term = this.parseTerm();

      if (!term) {
        if (this.error) {
          return { ok: false, error: this.error };
        }
        return this.fail('EXPECTED_TERM', 'Un dé ou un entier est attendu.', this.position);
      }
      terms.push({ sign, term });
      this.skipWhitespace();

      if (this.position === this.input.length) {
        return { ok: true, value: { type: 'dice-expression', terms } };
      }

      const operator = this.peek();

      if (operator !== '+' && operator !== '-') {
        return this.fail(
          'UNEXPECTED_CHARACTER',
          `Caractère inattendu « ${operator} ».`,
          this.position,
        );
      }

      sign = this.consume() === '+' ? 1 : -1;
      this.skipWhitespace();
      if (this.position === this.input.length) {
        return this.fail('EXPECTED_TERM', "Un terme est attendu après l'opérateur.", this.position);
      }
    }
  }

  private parseTerm(): DiceTerm | undefined {
    const first = this.peek();

    if (first === 'd' || first === 'D') {
      this.consume();
      return this.parseDice(1);
    }

    const number = this.readInteger();

    if (!number) {
      if (this.error) {
        return undefined;
      }
      return this.failTerm('EXPECTED_TERM', 'Un dé ou un entier est attendu.', this.position);
    }

    if (this.peek() === 'd' || this.peek() === 'D') {
      this.consume();
      if (number.value < 1 || number.value > MAX_DICE_COUNT) {
        return this.failTerm(
          'DICE_COUNT_OUT_OF_RANGE',
          `Le nombre de dés doit être compris entre 1 et ${MAX_DICE_COUNT}.`,
          number.start,
        );
      }
      return this.parseDice(number.value);
    }

    return { type: 'constant', value: number.value };
  }

  private parseDice(count: number): DiceTerm | undefined {
    const sides = this.readInteger();

    if (!sides) {
      if (this.error) {
        return undefined;
      }
      return this.failTerm(
        'EXPECTED_DIE_SIDES',
        'Le nombre de faces du dé est attendu après « d ».',
        this.position,
      );
    }
    if (sides.value < 1 || sides.value > MAX_DIE_SIDES) {
      return this.failTerm(
        'DIE_SIDES_OUT_OF_RANGE',
        `Le nombre de faces doit être compris entre 1 et ${MAX_DIE_SIDES}.`,
        sides.start,
      );
    }

    const modifiers: DiceModifier[] = [];
    const seen = new Set<DiceModifier['type']>();

    while (true) {
      this.skipWhitespace();
      const modifierStart = this.position;
      const character = this.peek()?.toLowerCase();

      if (character === 'k') {
        if (this.hasAdvantageModifier(modifiers)) {
          return this.failTerm(
            'ADVANTAGE_CONFLICTS_WITH_MODIFIERS',
            "L'avantage ou le désavantage ne peut pas être combiné à un autre modificateur.",
            modifierStart,
          );
        }
        this.consume();
        const modeCharacter = this.peek()?.toLowerCase();

        if (modeCharacter !== 'h' && modeCharacter !== 'l') {
          return this.failTerm(
            'INVALID_KEEP_MODIFIER',
            'Le modificateur de conservation doit être « kh » ou « kl ».',
            modifierStart,
          );
        }
        this.consume();
        const keepCount = this.readInteger();

        if (!keepCount) {
          if (this.error) {
            return undefined;
          }
          return this.failTerm(
            'INVALID_KEEP_MODIFIER',
            'Le nombre de dés à conserver est attendu après « kh » ou « kl ».',
            this.position,
          );
        }
        if (keepCount.value < 1 || keepCount.value > count) {
          return this.failTerm(
            'KEEP_COUNT_OUT_OF_RANGE',
            `Le nombre de dés à conserver doit être compris entre 1 et ${count}.`,
            keepCount.start,
          );
        }
        if (seen.has('keep')) {
          return this.failTerm(
            'DUPLICATE_MODIFIER',
            'Un seul modificateur de conservation est autorisé par groupe de dés.',
            modifierStart,
          );
        }
        seen.add('keep');
        modifiers.push({
          type: 'keep',
          mode: modeCharacter === 'h' ? 'highest' : 'lowest',
          count: keepCount.value,
        });
        continue;
      }

      if (character === '!') {
        if (this.hasAdvantageModifier(modifiers)) {
          return this.failTerm(
            'ADVANTAGE_CONFLICTS_WITH_MODIFIERS',
            "L'avantage ou le désavantage ne peut pas être combiné à un autre modificateur.",
            modifierStart,
          );
        }
        this.consume();
        if (seen.has('explode')) {
          return this.failTerm(
            'DUPLICATE_MODIFIER',
            'Un seul modificateur explosif est autorisé par groupe de dés.',
            modifierStart,
          );
        }
        seen.add('explode');
        modifiers.push({ type: 'explode' });
        continue;
      }

      if (character === 'r') {
        if (this.hasAdvantageModifier(modifiers)) {
          return this.failTerm(
            'ADVANTAGE_CONFLICTS_WITH_MODIFIERS',
            "L'avantage ou le désavantage ne peut pas être combiné à un autre modificateur.",
            modifierStart,
          );
        }
        this.consume();
        const operator = this.readComparisonOperator();
        const threshold = this.readInteger();

        if (!operator || !threshold) {
          if (this.error) {
            return undefined;
          }
          return this.failTerm(
            'INVALID_REROLL_MODIFIER',
            'Une relance doit suivre la forme « r<3 » ou « r=1 ».',
            modifierStart,
          );
        }
        if (threshold.value < 1 || threshold.value > sides.value) {
          return this.failTerm(
            'REROLL_THRESHOLD_OUT_OF_RANGE',
            `Le seuil de relance doit être compris entre 1 et ${sides.value}.`,
            threshold.start,
          );
        }
        if (seen.has('reroll')) {
          return this.failTerm(
            'DUPLICATE_MODIFIER',
            'Un seul modificateur de relance est autorisé par groupe de dés.',
            modifierStart,
          );
        }
        seen.add('reroll');
        modifiers.push({ type: 'reroll', operator, threshold: threshold.value });
        continue;
      }

      const advantage = this.readAdvantage();

      if (advantage) {
        if (count !== 1 || sides.value !== 20) {
          return this.failTerm(
            'ADVANTAGE_REQUIRES_SINGLE_D20',
            "L'avantage et le désavantage s'écrivent sur un seul d20.",
            modifierStart,
          );
        }
        if (modifiers.length > 0) {
          return this.failTerm(
            'ADVANTAGE_CONFLICTS_WITH_MODIFIERS',
            "L'avantage ou le désavantage ne peut pas être combiné à un autre modificateur.",
            modifierStart,
          );
        }
        modifiers.push({ type: advantage });
        continue;
      }

      if (this.error) {
        return undefined;
      }

      return { type: 'dice', count, sides: sides.value, modifiers };
    }
  }

  private hasAdvantageModifier(modifiers: DiceModifier[]): boolean {
    return modifiers.some(
      (modifier) => modifier.type === 'advantage' || modifier.type === 'disadvantage',
    );
  }

  private readAdvantage(): 'advantage' | 'disadvantage' | undefined {
    const remaining = this.input.slice(this.position).toLowerCase();
    const match = /^(advantage|disadvantage|adv|dis)(?![a-z])/.exec(remaining);

    if (!match) {
      return undefined;
    }

    this.position += match[0].length;
    return match[0] === 'adv' || match[0] === 'advantage' ? 'advantage' : 'disadvantage';
  }

  private readComparisonOperator(): '<' | '<=' | '=' | '>' | '>=' | undefined {
    const first = this.peek();

    if (first === '<' || first === '>') {
      this.consume();
      if (this.peek() === '=') {
        this.consume();
        return first === '<' ? '<=' : '>=';
      }
      return first;
    }
    if (first === '=') {
      this.consume();
      return '=';
    }
    return undefined;
  }

  private readInteger(): { value: number; start: number } | undefined {
    const start = this.position;

    while (this.peek() !== undefined && this.peek()! >= '0' && this.peek()! <= '9') {
      this.consume();
    }
    if (start === this.position) {
      return undefined;
    }

    const value = Number(this.input.slice(start, this.position));

    if (!Number.isSafeInteger(value)) {
      this.error = {
        code: 'INVALID_NUMBER',
        message: "L'entier dépasse la plage de valeurs autorisée.",
        position: start,
      };
      return undefined;
    }
    return { value, start };
  }

  private skipWhitespace(): void {
    while (this.peek() !== undefined && /\s/u.test(this.peek()!)) {
      this.consume();
    }
  }

  private peek(): string | undefined {
    return this.input[this.position];
  }

  private consume(): string {
    return this.input[this.position++]!;
  }

  private fail(code: ParseErrorCode, message: string, position: number): ParseResult {
    return { ok: false, error: { code, message, position } };
  }

  private failTerm(code: ParseErrorCode, message: string, position: number): undefined {
    this.error = { code, message, position };
    return undefined;
  }
}

export function parse(expression: string): ParseResult {
  return new DiceExpressionParser(expression).parse();
}
