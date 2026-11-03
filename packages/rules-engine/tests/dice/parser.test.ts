import { describe, expect, it } from 'vitest';
import { parse } from '../../src/index.js';

describe('parse', () => {
  it('parses dice, constants, and signed terms', () => {
    expect(parse('2d6 + d4 - 3')).toEqual({
      ok: true,
      value: {
        type: 'dice-expression',
        terms: [
          { sign: 1, term: { type: 'dice', count: 2, sides: 6, modifiers: [] } },
          { sign: 1, term: { type: 'dice', count: 1, sides: 4, modifiers: [] } },
          { sign: -1, term: { type: 'constant', value: 3 } },
        ],
      },
    });
  });

  it('ignores case and whitespace and parses percent dice', () => {
    expect(parse(' D % + 5 ')).toEqual({
      ok: true,
      value: {
        type: 'dice-expression',
        terms: [
          { sign: 1, term: { type: 'dice', count: 1, sides: 100, modifiers: [] } },
          { sign: 1, term: { type: 'constant', value: 5 } },
        ],
      },
    });
  });

  it('parses modifiers in their canonical order regardless of input order', () => {
    expect(parse('4d6kh3r<2')).toMatchObject({
      ok: true,
      value: {
        terms: [
          {
            term: {
              type: 'dice',
              count: 4,
              sides: 6,
              modifiers: [
                { type: 'reroll', mode: 'atMost', value: 2 },
                { type: 'keep', mode: 'highest', count: 3 },
              ],
            },
          },
        ],
      },
    });
    expect(parse('4d6kh3r<2')).toEqual(parse('4D6 R<2 KH3'));
  });

  it('parses equal and at-most rerolls', () => {
    expect(parse('d20r1')).toMatchObject({
      ok: true,
      value: { terms: [{ term: { modifiers: [{ type: 'reroll', mode: 'equal', value: 1 }] } }] },
    });
    expect(parse('d20r<2')).toMatchObject({
      ok: true,
      value: { terms: [{ term: { modifiers: [{ type: 'reroll', mode: 'atMost', value: 2 }] } }] },
    });
  });

  it('rejects duplicate modifier families', () => {
    expect(parse('4d6kh3kl1')).toEqual({
      ok: false,
      error: {
        code: 'duplicate_modifier',
        position: 6,
        length: 3,
        params: {},
      },
    });
  });

  it('rejects keep and explosion regardless of their written order', () => {
    expect(parse('4d6!kh3')).toMatchObject({
      ok: false,
      error: { code: 'incompatible_modifiers', position: 4, length: 3 },
    });
    expect(parse('4d6kh3!')).toMatchObject({
      ok: false,
      error: { code: 'incompatible_modifiers', position: 6, length: 1 },
    });
  });

  it('reports the term that exceeds the aggregate dice limit', () => {
    expect(parse('100d6+100d6+100d6')).toEqual({
      ok: false,
      error: {
        code: 'too_many_dice',
        position: 12,
        length: 5,
        params: { max: 200 },
      },
    });
  });

  it.each([
    ['', 'unexpected_end', 0, 0],
    ['2d', 'missing_sides', 2, 0],
    ['04d6', 'leading_zero', 0, 2],
    ['1d06', 'leading_zero', 2, 2],
    ['101d6', 'dice_count_out_of_range', 0, 3],
    ['d1', 'sides_out_of_range', 1, 1],
    ['4d6kh0', 'keep_out_of_range', 3, 3],
    ['d6r<6', 'reroll_out_of_range', 2, 3],
    ['d6x', 'unexpected_character', 2, 1],
    ['1d6 + 😀', 'unexpected_character', 6, 1],
    ['2d6+', 'unexpected_end', 4, 0],
    ['1001', 'constant_out_of_range', 0, 4],
    ['-1001', 'constant_out_of_range', 1, 4],
  ] as const)('returns code and source span for %j', (input, code, position, length) => {
    expect(parse(input)).toMatchObject({
      ok: false,
      error: { code, position, length },
    });
  });

  it('reports UTF-16 positions including the original whitespace', () => {
    expect(parse('\u00a0 + 04d6')).toMatchObject({
      ok: false,
      error: { code: 'leading_zero', position: 4, length: 2 },
    });
  });

  it('rejects expressions longer than 100 UTF-16 code units', () => {
    expect(parse('1'.repeat(101))).toMatchObject({
      ok: false,
      error: {
        code: 'expression_too_long',
        position: 100,
        length: 1,
        params: { max: 100 },
      },
    });
  });

  it('rejects expressions with more than ten terms', () => {
    expect(parse('1+1+1+1+1+1+1+1+1+1+1')).toMatchObject({
      ok: false,
      error: { code: 'too_many_terms', position: 20 },
    });
  });

  it('parses a 100-character expression without pathological work', () => {
    const expression = `${'1d6+'.repeat(9)}1d6${' '.repeat(61)}`;
    const start = performance.now();

    const result = parse(expression);
    const duration = performance.now() - start;

    expect(result.ok).toBe(true);
    expect(duration).toBeLessThan(1);
  });
});
