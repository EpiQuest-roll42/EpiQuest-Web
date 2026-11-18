import { describe, expect, it } from 'vitest';
import { describeFieldError } from '../viewModels/fieldErrorMessages';

describe('describeFieldError', () => {
  it('translates each known code into a French message', () => {
    expect(describeFieldError({ field: 'email', code: 'required' })).toBe(
      'Ce champ est obligatoire.',
    );
    expect(describeFieldError({ field: 'currentPassword', code: 'password_required' })).toBe(
      'Saisissez votre mot de passe actuel.',
    );
  });

  it('uses the parameters sent with the code', () => {
    expect(describeFieldError({ field: 'password', code: 'too_short', params: { min: 12 } })).toBe(
      'Au moins 12 caractères.',
    );
    expect(describeFieldError({ field: 'username', code: 'too_long', params: { max: 1 } })).toBe(
      'Au plus 1 caractère.',
    );
  });

  it('still gives a message when a parameter is missing or not a number', () => {
    expect(describeFieldError({ field: 'password', code: 'too_short' })).toBe(
      'Valeur trop courte.',
    );
    expect(
      describeFieldError({ field: 'password', code: 'too_short', params: { min: '12' } }),
    ).toBe('Valeur trop courte.');
  });

  it('names the field when a value is already taken', () => {
    expect(describeFieldError({ field: 'username', code: 'already_taken' })).toBe(
      'Ce pseudo est déjà utilisé.',
    );
    expect(describeFieldError({ field: 'email', code: 'already_taken' })).toBe(
      'Cette adresse e-mail est déjà utilisée.',
    );
    expect(describeFieldError({ field: 'name', code: 'already_taken' })).toBe(
      'Cette valeur est déjà utilisée.',
    );
  });

  it('never shows an unknown code or anything sent by the API', () => {
    const message = describeFieldError({
      field: 'username',
      code: 'some_new_code',
      params: { message: '<b>Raw server text</b>' },
    });

    expect(message).toBe('Valeur invalide.');
    expect(message).not.toContain('some_new_code');
    expect(message).not.toContain('Raw server text');
  });
});
