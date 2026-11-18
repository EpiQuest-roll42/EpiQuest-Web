import type { FieldError } from '../models/api/schema';

export type FieldErrorDescription = Pick<FieldError, 'field' | 'code' | 'params'>;

const GENERIC_MESSAGE = 'Valeur invalide.';

const ALREADY_TAKEN_BY_FIELD: Record<string, string> = {
  username: 'Ce pseudo est déjà utilisé.',
  email: 'Cette adresse e-mail est déjà utilisée.',
};

function readNumber(params: FieldError['params'], name: string): number | null {
  const value = params?.[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function characters(count: number): string {
  return count > 1 ? `${count} caractères` : `${count} caractère`;
}

export function describeFieldError({ field, code, params }: FieldErrorDescription): string {
  switch (code) {
    case 'required':
      return 'Ce champ est obligatoire.';
    case 'too_short': {
      const min = readNumber(params, 'min');
      return min === null ? 'Valeur trop courte.' : `Au moins ${characters(min)}.`;
    }
    case 'too_long': {
      const max = readNumber(params, 'max');
      return max === null ? 'Valeur trop longue.' : `Au plus ${characters(max)}.`;
    }
    case 'already_taken':
      return ALREADY_TAKEN_BY_FIELD[field] ?? 'Cette valeur est déjà utilisée.';
    case 'password_required':
      return 'Saisissez votre mot de passe actuel.';
    default:
      return GENERIC_MESSAGE;
  }
}
