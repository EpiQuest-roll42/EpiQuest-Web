import type { AbilityCode, ArmorClassInput, ValueBreakdown, ValueBreakdownPart } from './types.js';

export type ArmorClassErrorCode =
  'invalid_input' | 'invalid_formula' | 'unknown_formula_variable' | 'unsupported_formula_term';

export class ArmorClassError extends Error {
  constructor(
    readonly code: ArmorClassErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ArmorClassError';
  }
}

const ABILITY_CODES: readonly AbilityCode[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function isAbilityCode(value: string): value is AbilityCode {
  return ABILITY_CODES.some((ability) => ability === value);
}

function getAbilityModifier(input: ArmorClassInput, ability: AbilityCode): number {
  const modifier = input.abilities[ability].modifier;
  if (!Number.isSafeInteger(modifier)) {
    throw new ArmorClassError('invalid_input', `The ${ability} modifier must be an integer.`);
  }
  return modifier;
}

function addFormulaParts(
  input: ArmorClassInput,
  formula: NonNullable<ArmorClassInput['unarmoredDefense']>,
): ValueBreakdownPart[] {
  if (formula.formula.length === 0 || formula.formula.length > 100) {
    throw new ArmorClassError(
      'invalid_formula',
      'The unarmored defense formula must contain 1 to 100 characters.',
    );
  }

  const compactFormula = formula.formula.replace(/\s/gu, '');

  const parts: ValueBreakdownPart[] = [];
  let position = 0;
  let sign = 1;

  if (compactFormula[position] === '+' || compactFormula[position] === '-') {
    sign = compactFormula[position] === '+' ? 1 : -1;
    position += 1;
  }

  while (position < compactFormula.length) {
    const tokenStart = position;
    let value: number;
    let source: ValueBreakdownPart['source'];

    if (compactFormula[position] === '@') {
      position += 1;
      const variableStart = position;
      while (/[a-z0-9]/u.test(compactFormula[position] ?? '')) {
        position += 1;
      }

      const variable = compactFormula.slice(variableStart, position);
      if (!isAbilityCode(variable)) {
        throw new ArmorClassError(
          'unknown_formula_variable',
          `Unknown unarmored defense formula variable "@${variable}".`,
        );
      }

      value = getAbilityModifier(input, variable);
      source = { kind: 'ability', ref: variable };
    } else {
      while (/[0-9]/u.test(compactFormula[position] ?? '')) {
        position += 1;
      }

      const number = compactFormula.slice(tokenStart, position);
      value = Number(number);
      if (
        number.length === 0 ||
        (number.length > 1 && number.startsWith('0')) ||
        !Number.isSafeInteger(value) ||
        value > 1000
      ) {
        throw new ArmorClassError(
          'invalid_formula',
          'The unarmored defense formula contains an invalid constant.',
        );
      }
      source = { kind: 'feature', ref: formula.id };
    }

    parts.push({ source, value: sign * value });

    if (position === compactFormula.length) {
      break;
    }

    const operator = compactFormula[position];
    if (operator !== '+' && operator !== '-') {
      throw new ArmorClassError(
        'unsupported_formula_term',
        'Unarmored defense formulas may contain only integer constants and ability modifiers joined by + or -.',
      );
    }

    sign = operator === '+' ? 1 : -1;
    position += 1;
    if (position === compactFormula.length) {
      throw new ArmorClassError(
        'invalid_formula',
        'The unarmored defense formula cannot end with an operator.',
      );
    }
  }

  if (parts.length === 0) {
    throw new ArmorClassError(
      'invalid_formula',
      'The unarmored defense formula must contain at least one term.',
    );
  }

  return parts;
}

function getArmorDexterityBonus(input: ArmorClassInput): number {
  const armor = input.armor;
  if (!armor || armor.dexterityCap === 0) {
    return 0;
  }

  const dexterityModifier = getAbilityModifier(input, 'dex');
  if (armor.dexterityCap === null) {
    return dexterityModifier;
  }

  return Math.min(dexterityModifier, armor.dexterityCap);
}

function validateInput(input: ArmorClassInput): void {
  if (
    input.armor &&
    (!Number.isSafeInteger(input.armor.baseArmorClass) ||
      input.armor.baseArmorClass < 0 ||
      (input.armor.dexterityCap !== null &&
        (!Number.isSafeInteger(input.armor.dexterityCap) || input.armor.dexterityCap < 0)))
  ) {
    throw new ArmorClassError(
      'invalid_input',
      'Armor class and Dexterity cap must be non-negative integers.',
    );
  }

  if (input.shield && (!Number.isSafeInteger(input.shield.bonus) || input.shield.bonus < 0)) {
    throw new ArmorClassError('invalid_input', 'Shield bonus must be a non-negative integer.');
  }
}

export function calculateArmorClass(input: ArmorClassInput): ValueBreakdown {
  validateInput(input);

  let parts: ValueBreakdownPart[];

  if (input.armor) {
    parts = [{ source: { kind: 'item', ref: input.armor.id }, value: input.armor.baseArmorClass }];

    if (input.armor.dexterityCap !== 0) {
      parts.push({
        source: { kind: 'ability', ref: 'dex' },
        value: getArmorDexterityBonus(input),
      });
    }
  } else if (input.unarmoredDefense && (!input.shield || input.unarmoredDefense.allowsShield)) {
    parts = addFormulaParts(input, input.unarmoredDefense);
  } else {
    parts = [
      { source: { kind: 'base', ref: 'unarmored' }, value: 10 },
      { source: { kind: 'ability', ref: 'dex' }, value: getAbilityModifier(input, 'dex') },
    ];
  }

  if (input.shield) {
    parts.push({ source: { kind: 'item', ref: input.shield.id }, value: input.shield.bonus });
  }

  const value = parts.reduce((total, part) => total + part.value, 0);
  if (!Number.isSafeInteger(value)) {
    throw new ArmorClassError(
      'invalid_input',
      'Calculated armor class exceeds the supported integer range.',
    );
  }

  return { value, parts };
}
