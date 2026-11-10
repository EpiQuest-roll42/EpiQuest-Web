import type {
  AbilityModifiers,
  AbilityScore,
  AbilityScoreValues,
  AbilityScores,
  CharacterClass,
  ProficiencyBonus,
} from './types.js';

export function getAbilityModifier(score: AbilityScore): number {
  if (!Number.isInteger(score) || score < 1 || score > 30) {
    throw new RangeError('Ability score must be an integer between 1 and 30.');
  }

  return Math.floor((score - 10) / 2);
}

export function getAbilityModifiers(scores: AbilityScoreValues): AbilityModifiers {
  return {
    str: getAbilityModifier(scores.str),
    dex: getAbilityModifier(scores.dex),
    con: getAbilityModifier(scores.con),
    int: getAbilityModifier(scores.int),
    wis: getAbilityModifier(scores.wis),
    cha: getAbilityModifier(scores.cha),
  };
}

export function getAbilityScores(values: AbilityScoreValues): AbilityScores {
  const modifiers = getAbilityModifiers(values);

  return {
    str: { score: values.str, modifier: modifiers.str },
    dex: { score: values.dex, modifier: modifiers.dex },
    con: { score: values.con, modifier: modifiers.con },
    int: { score: values.int, modifier: modifiers.int },
    wis: { score: values.wis, modifier: modifiers.wis },
    cha: { score: values.cha, modifier: modifiers.cha },
  };
}

export function getProficiencyBonus(
  characterClass: Pick<CharacterClass, 'levels'>,
  level: number,
): ProficiencyBonus {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new RangeError('Character level must be an integer between 1 and 20.');
  }

  const classLevel = characterClass.levels.find((entry) => entry.level === level);
  if (!classLevel) {
    throw new RangeError(`No class progression exists for level ${level}.`);
  }

  return classLevel.proficiencyBonus;
}
