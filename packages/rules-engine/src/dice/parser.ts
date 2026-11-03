import type {
  DiceExpression,
  DiceModifier,
  DiceTerm,
  ParseError,
  ParseErrorCode,
  ParseErrorParams,
  ParseResult,
  RerollModifier,
} from './types.js';

export type {
  DiceExpression,
  DiceModifier,
  DiceTerm,
  ParseError,
  ParseErrorCode,
  ParseErrorParams,
  ParseResult,
  RerollModifier,
} from './types.js';

const MAX_EXPRESSION_LENGTH = 100;
const MAX_TERMS = 10;
const MAX_DICE_PER_TERM = 100;
const MAX_TOTAL_DICE = 200;
const MIN_SIDES = 2;
const MAX_SIDES = 100;
const MIN_CONSTANT = -1000;
const MAX_CONSTANT = 1000;

interface ParsedInteger {
  value: number;
  start: number;
  end: number;
}

interface ParsedModifier {
  modifier: DiceModifier;
  start: number;
  end: number;
  family: 'keep' | 'explode' | 'reroll';
}

class DiceExpressionParser {
  private position = 0;
  private totalDice = 0;

  constructor(private readonly input: string) {}

  parse(): ParseResult {
    if (this.input.length > MAX_EXPRESSION_LENGTH) {
      return this.fail(
        'expression_too_long',
        MAX_EXPRESSION_LENGTH,
        this.input.length - MAX_EXPRESSION_LENGTH,
        {
          max: MAX_EXPRESSION_LENGTH,
        },
      );
    }

    this.skipWhitespace();

    if (this.position === this.input.length) {
      return this.fail('unexpected_end', this.input.length, 0);
    }

    const terms: DiceExpression['terms'] = [];
    let sign: 1 | -1 = 1;

    if (this.peek() === '+' || this.peek() === '-') {
      sign = this.consume() === '+' ? 1 : -1;
      this.skipWhitespace();
    }

    while (true) {
      if (terms.length >= MAX_TERMS) {
        return this.fail('too_many_terms', this.position, this.currentTermLength(), {
          max: MAX_TERMS,
        });
      }

      const termStart = this.position;
      const term = this.parseTerm();

      if (!term.ok) {
        return term;
      }

      if (
        term.value.type === 'constant' &&
        (sign === -1 ? -term.value.value : term.value.value) < MIN_CONSTANT
      ) {
        return this.fail('constant_out_of_range', termStart, this.position - termStart, {
          min: MIN_CONSTANT,
          max: MAX_CONSTANT,
        });
      }

      terms.push({ sign, term: term.value });
      const termEnd = this.position;

      if (term.value.type === 'dice') {
        this.totalDice += term.value.count;
        if (this.totalDice > MAX_TOTAL_DICE) {
          return this.fail('too_many_dice', termStart, termEnd - termStart, {
            max: MAX_TOTAL_DICE,
          });
        }
      }

      this.skipWhitespace();

      if (this.position === this.input.length) {
        return { ok: true, value: { type: 'dice-expression', terms } };
      }

      const operatorPosition = this.position;
      const operator = this.peek();

      if (operator !== '+' && operator !== '-') {
        return this.fail('unexpected_character', operatorPosition, 1);
      }

      sign = this.consume() === '+' ? 1 : -1;
      this.skipWhitespace();

      if (this.position === this.input.length) {
        return this.fail('unexpected_end', this.input.length, 0);
      }
    }
  }

  private parseTerm(): { ok: true; value: DiceTerm } | { ok: false; error: ParseError } {
    const first = this.peek();

    if (first === 'd' || first === 'D') {
      this.consume();
      return this.parseDice(1);
    }

    const number = this.readInteger();

    if (!number.ok) {
      return number;
    }

    const next = this.peekNonWhitespace();

    if (next === 'd' || next === 'D') {
      this.skipWhitespace();
      this.consume();

      if (number.value.value < 1 || number.value.value > MAX_DICE_PER_TERM) {
        return this.fail(
          'dice_count_out_of_range',
          number.value.start,
          number.value.end - number.value.start,
          {
            min: 1,
            max: MAX_DICE_PER_TERM,
          },
        );
      }

      return this.parseDice(number.value.value);
    }

    if (number.value.value > MAX_CONSTANT) {
      return this.fail(
        'constant_out_of_range',
        number.value.start,
        number.value.end - number.value.start,
        { min: MIN_CONSTANT, max: MAX_CONSTANT },
      );
    }

    return { ok: true, value: { type: 'constant', value: number.value.value } };
  }

  private parseDice(
    count: number,
  ): { ok: true; value: DiceTerm } | { ok: false; error: ParseError } {
    this.skipWhitespace();
    const sidesStart = this.position;
    let sides: number;

    if (this.peek() === '%') {
      this.consume();
      sides = 100;
    } else {
      const parsedSides = this.readInteger();

      if (!parsedSides.ok) {
        if (parsedSides.error.code === 'unexpected_end') {
          return this.fail('missing_sides', this.input.length, 0);
        }
        return parsedSides;
      }

      sides = parsedSides.value.value;
      if (sides < MIN_SIDES || sides > MAX_SIDES) {
        return this.fail(
          'sides_out_of_range',
          parsedSides.value.start,
          parsedSides.value.end - parsedSides.value.start,
          { min: MIN_SIDES, max: MAX_SIDES },
        );
      }
    }

    const modifiers: ParsedModifier[] = [];

    while (true) {
      this.skipWhitespace();

      const modifierStart = this.position;
      const character = this.peek()?.toLowerCase();
      let parsedModifier: ParsedModifier | undefined;

      if (character === 'k') {
        this.consume();
        const mode = this.peek()?.toLowerCase();

        if (mode !== 'h' && mode !== 'l') {
          return this.fail(
            this.position < this.input.length ? 'unexpected_character' : 'unexpected_end',
            this.position,
            this.position < this.input.length ? 1 : 0,
          );
        }
        this.consume();
        const countResult = this.readInteger();

        if (!countResult.ok) {
          if (countResult.error.code === 'unexpected_end') {
            return countResult;
          }
          return countResult;
        }

        const keepCount = countResult.value.value;

        if (keepCount < 1 || keepCount > count) {
          return this.fail('keep_out_of_range', modifierStart, this.position - modifierStart, {
            min: 1,
            max: count,
          });
        }

        parsedModifier = {
          modifier: {
            type: 'keep',
            mode: mode === 'h' ? 'highest' : 'lowest',
            count: keepCount,
          },
          start: modifierStart,
          end: this.position,
          family: 'keep',
        };
      } else if (character === '!') {
        this.consume();
        parsedModifier = {
          modifier: { type: 'explode' },
          start: modifierStart,
          end: this.position,
          family: 'explode',
        };
      } else if (character === 'r') {
        this.consume();
        const modeCharacter = this.peek();
        let mode: RerollModifier['mode'] = 'equal';

        if (modeCharacter === '<') {
          this.consume();
          mode = 'atMost';
        }

        const valueResult = this.readInteger();

        if (!valueResult.ok) {
          return valueResult;
        }

        const value = valueResult.value.value;
        const maximum = mode === 'equal' ? sides : sides - 1;

        if (value < 1 || value > maximum) {
          return this.fail('reroll_out_of_range', modifierStart, this.position - modifierStart, {
            min: 1,
            max: maximum,
          });
        }

        parsedModifier = {
          modifier: { type: 'reroll', mode, value },
          start: modifierStart,
          end: this.position,
          family: 'reroll',
        };
      } else {
        break;
      }

      const duplicate = modifiers.find((modifier) => modifier.family === parsedModifier.family);

      if (duplicate) {
        return this.fail(
          'duplicate_modifier',
          parsedModifier.start,
          parsedModifier.end - parsedModifier.start,
        );
      }

      const incompatible = modifiers.find(
        (modifier) =>
          (modifier.family === 'explode' && parsedModifier.family === 'keep') ||
          (modifier.family === 'keep' && parsedModifier.family === 'explode'),
      );

      if (incompatible) {
        return this.fail(
          'incompatible_modifiers',
          parsedModifier.start,
          parsedModifier.end - parsedModifier.start,
        );
      }

      modifiers.push(parsedModifier);
    }

    modifiers.sort((left, right) => {
      const order = { reroll: 0, explode: 1, keep: 2 };
      return order[left.family] - order[right.family];
    });

    if (this.position === sidesStart) {
      return this.fail('missing_sides', this.position, 0);
    }

    return {
      ok: true,
      value: {
        type: 'dice',
        count,
        sides,
        modifiers: modifiers.map(({ modifier }) => modifier),
      },
    };
  }

  private readInteger(): { ok: true; value: ParsedInteger } | { ok: false; error: ParseError } {
    this.skipWhitespace();
    const start = this.position;

    if (!this.isDigit(this.peek())) {
      return this.position === this.input.length
        ? this.fail('unexpected_end', this.input.length, 0)
        : this.fail('unexpected_character', this.position, 1);
    }

    const first = this.consume();

    if (first === '0') {
      const nextDigitPosition = this.nextNonWhitespacePosition();

      if (this.isDigit(this.input[nextDigitPosition])) {
        return this.fail('leading_zero', start, nextDigitPosition - start + 1);
      }

      return { ok: true, value: { value: 0, start, end: this.position } };
    }

    while (this.isDigit(this.input[this.nextNonWhitespacePosition()])) {
      this.skipWhitespace();
      this.consume();
    }

    const value = Number(this.input.slice(start, this.position));

    return {
      ok: true,
      value: { value, start, end: this.position },
    };
  }

  private currentTermLength(): number {
    let cursor = this.position;

    while (cursor < this.input.length && this.input[cursor] !== '+' && this.input[cursor] !== '-') {
      cursor += 1;
    }

    return cursor - this.position;
  }

  private peekNonWhitespace(): string | undefined {
    return this.input[this.nextNonWhitespacePosition()];
  }

  private nextNonWhitespacePosition(): number {
    let cursor = this.position;

    while (cursor < this.input.length && this.isWhitespace(this.input[cursor])) {
      cursor += 1;
    }

    return cursor;
  }

  private skipWhitespace(): void {
    while (this.isWhitespace(this.peek())) {
      this.consume();
    }
  }

  private peek(): string | undefined {
    return this.input[this.position];
  }

  private consume(): string {
    return this.input[this.position++]!;
  }

  private isDigit(character: string | undefined): boolean {
    return character !== undefined && character >= '0' && character <= '9';
  }

  private isWhitespace(character: string | undefined): boolean {
    return (
      character !== undefined &&
      (character === ' ' ||
        character === '\t' ||
        character === '\n' ||
        character === '\r' ||
        character === '\f' ||
        character === '\v' ||
        character === '\u00a0' ||
        character === '\u1680' ||
        (character >= '\u2000' && character <= '\u200a') ||
        character === '\u2028' ||
        character === '\u2029' ||
        character === '\u202f' ||
        character === '\u205f' ||
        character === '\u3000' ||
        character === '\ufeff')
    );
  }

  private fail(
    code: ParseErrorCode,
    position: number,
    length: number,
    params: ParseErrorParams = {},
  ): { ok: false; error: ParseError } {
    return { ok: false, error: { code, position, length, params } };
  }
}

export function parse(expression: string): ParseResult {
  return new DiceExpressionParser(expression).parse();
}

export const diceNotationLimits = {
  expressionLength: MAX_EXPRESSION_LENGTH,
  terms: MAX_TERMS,
  dicePerTerm: MAX_DICE_PER_TERM,
  totalDice: MAX_TOTAL_DICE,
  sides: { min: MIN_SIDES, max: MAX_SIDES },
  constant: { min: MIN_CONSTANT, max: MAX_CONSTANT },
} as const;
