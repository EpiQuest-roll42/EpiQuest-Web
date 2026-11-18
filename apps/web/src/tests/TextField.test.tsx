import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField, type TextFieldProps } from '../components/TextField';
import { expectNoAxeViolationsInBothPalettes } from './axeHelpers';

function ControlledField(
  props: Omit<TextFieldProps, 'value' | 'onChange'> & { onChange?: (value: string) => void },
) {
  const [value, setValue] = useState('');
  return (
    <TextField
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

describe('TextField', () => {
  it('links a visible label to the field', () => {
    render(<TextField label="Pseudo" value="" onChange={() => {}} />);

    const input = screen.getByLabelText('Pseudo');
    expect(input.tagName).toBe('INPUT');
    expect(screen.getByText('Pseudo')).toBeVisible();
    expect(input).not.toHaveAttribute('placeholder');
  });

  it('announces a required field once, and writes it in the label', () => {
    render(<TextField label="Adresse e-mail" type="email" required value="" onChange={() => {}} />);

    const input = screen.getByRole('textbox', { name: 'Adresse e-mail' });
    expect(input).toBeRequired();
    expect(screen.getByText('(obligatoire)')).toHaveAttribute('aria-hidden', 'true');
  });

  it('puts the help text in the accessible description', () => {
    render(
      <TextField
        label="Mot de passe"
        type="password"
        help="Au moins 12 caractères."
        value=""
        onChange={() => {}}
      />,
    );

    expect(screen.getByLabelText('Mot de passe')).toHaveAccessibleDescription(
      'Au moins 12 caractères.',
    );
  });

  it('exposes an error as invalid, with its message in the description', () => {
    render(
      <TextField
        label="Pseudo"
        help="Visible par les autres joueurs."
        error="Ce pseudo est déjà utilisé."
        value="Arwen_du_Nord"
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Pseudo' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Visible par les autres joueurs. Ce pseudo est déjà utilisé.',
    );
  });

  it('shows the error with an icon and a text, not only a color', () => {
    render(
      <TextField label="Pseudo" error="Ce pseudo est déjà utilisé." value="" onChange={() => {}} />,
    );

    const message = screen.getByText('Ce pseudo est déjà utilisé.');
    expect(message.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is neither invalid nor described when there is nothing to say', () => {
    render(<TextField label="Pseudo" error={null} value="" onChange={() => {}} />);

    const input = screen.getByRole('textbox', { name: 'Pseudo' });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('gives each field its own ids', () => {
    render(
      <>
        <TextField label="Pseudo" help="Aide A" value="" onChange={() => {}} />
        <TextField label="Ville" help="Aide B" value="" onChange={() => {}} />
      </>,
    );

    expect(screen.getByLabelText('Pseudo')).toHaveAccessibleDescription('Aide A');
    expect(screen.getByLabelText('Ville')).toHaveAccessibleDescription('Aide B');
  });

  it('sends the typed value to its owner', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledField label="Pseudo" onChange={onChange} />);

    await user.type(screen.getByLabelText('Pseudo'), 'Arwen');

    expect(onChange).toHaveBeenLastCalledWith('Arwen');
    expect(screen.getByLabelText('Pseudo')).toHaveValue('Arwen');
  });

  it('passes autocomplete through for personal data (WCAG 1.3.5)', () => {
    render(<TextField label="Adresse e-mail" autoComplete="email" value="" onChange={() => {}} />);

    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute('autocomplete', 'email');
  });

  it('does not accept a placeholder', () => {
    const props: TextFieldProps = {
      label: 'Pseudo',
      value: '',
      onChange: () => {},
      // @ts-expect-error
      placeholder: 'Pseudo',
    };

    expect(props).toBeDefined();
  });

  it('has no axe violations in any state, in both palettes', async () => {
    const { container } = render(
      <>
        <TextField label="Simple" value="" onChange={() => {}} />
        <TextField label="Obligatoire" required value="" onChange={() => {}} />
        <TextField label="Avec aide" help="Une aide." value="" onChange={() => {}} />
        <TextField
          label="En erreur"
          error="Ce champ est obligatoire."
          value=""
          onChange={() => {}}
        />
        <TextField label="Désactivé" disabled value="" onChange={() => {}} />
      </>,
    );

    await expectNoAxeViolationsInBothPalettes(container);
  });
});
