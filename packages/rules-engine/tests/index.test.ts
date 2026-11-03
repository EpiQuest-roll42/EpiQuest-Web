import { describe, expect, it } from 'vitest';
import { parse } from '../src/index.js';

describe('parse', () => {
  it('parses dice, constants, and signed terms', () => {
    expect(parse('2d6 + d4 - 3')).toEqual({
      ok: true,
      value: {
        type: 'dice-expression',
        terms: [
          {
            sign: 1,
            term: { type: 'dice', count: 2, sides: 6, modifiers: [] },
          },
          {
            sign: 1,
            term: { type: 'dice', count: 1, sides: 4, modifiers: [] },
          },
          { sign: -1, term: { type: 'constant', value: 3 } },
        ],
      },
    });
  });

  it('parses keep, explosion, and reroll modifiers', () => {
    expect(parse('4d6kh3!r<2')).toMatchObject({
      ok: true,
      value: {
        terms: [
          {
            term: {
              type: 'dice',
              count: 4,
              sides: 6,
              modifiers: [
                { type: 'keep', mode: 'highest', count: 3 },
                { type: 'explode' },
                { type: 'reroll', operator: '<', threshold: 2 },
              ],
            },
          },
        ],
      },
    });
  });

  it('parses keeping the lowest dice', () => {
    expect(parse('4d6kl2')).toMatchObject({
      ok: true,
      value: {
        terms: [
          {
            term: {
              type: 'dice',
              modifiers: [{ type: 'keep', mode: 'lowest', count: 2 }],
            },
          },
        ],
      },
    });
  });

  it.each(['<', '<=', '=', '>', '>='] as const)('parses reroll operator %s', (operator) => {
    expect(parse(`d20r${operator}2`)).toMatchObject({
      ok: true,
      value: {
        terms: [
          {
            term: {
              modifiers: [{ type: 'reroll', operator, threshold: 2 }],
            },
          },
        ],
      },
    });
  });

  it.each([
    ['d20 adv', 'advantage'],
    ['D20 ADVANTAGE', 'advantage'],
    ['d20 dis', 'disadvantage'],
    ['d20 disadvantage', 'disadvantage'],
  ] as const)('parses %s', (expression, modifier) => {
    expect(parse(expression)).toMatchObject({
      ok: true,
      value: {
        terms: [{ term: { modifiers: [{ type: modifier }] } }],
      },
    });
  });

  it.each([
    ['', 'EMPTY_EXPRESSION', 0],
    ['2d', 'EXPECTED_DIE_SIDES', 2],
    ['101d6', 'DICE_COUNT_OUT_OF_RANGE', 0],
    ['4d6kh5', 'KEEP_COUNT_OUT_OF_RANGE', 5],
    ['d20 adv kl1', 'ADVANTAGE_CONFLICTS_WITH_MODIFIERS', 8],
    ['d6 r<7', 'REROLL_THRESHOLD_OUT_OF_RANGE', 5],
    ['d6!!', 'DUPLICATE_MODIFIER', 3],
    ['2d6 +', 'EXPECTED_TERM', 5],
    ['d6foo', 'UNEXPECTED_CHARACTER', 2],
  ] as const)('explains invalid expression %j', (expression, code, position) => {
    expect(parse(expression)).toMatchObject({
      ok: false,
      error: { code, position },
    });
  });

  it('rejects advantage on anything other than one d20', () => {
    expect(parse('2d20 adv')).toMatchObject({
      ok: false,
      error: { code: 'ADVANTAGE_REQUIRES_SINGLE_D20', position: 5 },
    });
  });
});
