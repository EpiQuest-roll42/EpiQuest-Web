import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button, LOADING_MESSAGE } from '../components/Button';
import { expectNoAxeViolationsInBothPalettes } from './axeHelpers';

describe('Button', () => {
  it('renders a native button that does not submit a form by default', () => {
    render(<Button>Enregistrer</Button>);

    const button = screen.getByRole('button', { name: 'Enregistrer' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('can still be a submit button', () => {
    render(<Button type="submit">Se connecter</Button>);

    expect(screen.getByRole('button', { name: 'Se connecter' })).toHaveAttribute('type', 'submit');
  });

  it('applies the charter variant, primary by default', () => {
    render(
      <>
        <Button>Principal</Button>
        <Button variant="secondary">Secondaire</Button>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Principal' })).toHaveClass('button--primary');
    expect(screen.getByRole('button', { name: 'Secondaire' })).toHaveClass('button--secondary');
  });

  it('runs its action with a click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Lancer</Button>);

    await user.click(screen.getByRole('button', { name: 'Lancer' }));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('does nothing and is skipped by Tab when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Button disabled onClick={onClick}>
          Indisponible
        </Button>
        <Button>Suivant</Button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Indisponible' }));
    await user.tab();

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Suivant' })).toHaveFocus();
  });

  describe('while loading', () => {
    it('announces the loading and ignores clicks and keys', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button isLoading onClick={onClick}>
          Enregistrer
        </Button>,
      );
      const button = screen.getByRole('button', { name: 'Enregistrer' });

      await user.click(button);
      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(onClick).not.toHaveBeenCalled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('status')).toHaveTextContent(LOADING_MESSAGE);
    });

    it('keeps the focus when the loading starts and ends', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Button isLoading={false}>Enregistrer</Button>);
      const button = screen.getByRole('button', { name: 'Enregistrer' });
      await user.tab();
      expect(button).toHaveFocus();

      rerender(<Button isLoading>Enregistrer</Button>);
      expect(button).toHaveFocus();

      rerender(<Button isLoading={false}>Enregistrer</Button>);
      expect(button).toHaveFocus();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('does not submit its form', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" isLoading>
            Se connecter
          </Button>
        </form>,
      );

      await user.click(screen.getByRole('button', { name: 'Se connecter' }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('has no status region when the button never loads', () => {
      render(<Button>Annuler</Button>);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('icon only', () => {
    it('takes its accessible name from the label and hides the icon', () => {
      render(<Button icon={Trash2} label="Supprimer le pion" />);

      const button = screen.getByRole('button', { name: 'Supprimer le pion' });
      expect(button).toHaveClass('button--icon-only');
      expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('cannot be written without a label', () => {
      // @ts-expect-error An icon-only button needs a label (its accessible name).
      const withoutLabel = <Button icon={Trash2} />;
      // @ts-expect-error A text button cannot also take a label, which would hide its text.
      const textWithLabel = <Button label="Autre nom">Texte</Button>;

      expect([withoutLabel, textWithLabel]).toHaveLength(2);
    });
  });

  describe('as a toggle', () => {
    it('exposes its state and shows a check mark when pressed', () => {
      const { rerender } = render(<Button pressed={false}>Palette table de jeu</Button>);
      const button = screen.getByRole('button', { name: 'Palette table de jeu' });
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button.querySelector('svg')).not.toBeInTheDocument();

      rerender(<Button pressed>Palette table de jeu</Button>);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('is not a toggle unless asked', () => {
      render(<Button>Valider</Button>);

      expect(screen.getByRole('button', { name: 'Valider' })).not.toHaveAttribute('aria-pressed');
    });
  });

  it('has no axe violations in any variant or state, in both palettes', async () => {
    const { container } = render(
      <>
        <Button>Principal</Button>
        <Button variant="secondary">Secondaire</Button>
        <Button disabled>Désactivé</Button>
        <Button isLoading>En cours</Button>
        <Button pressed>Pressé</Button>
        <Button pressed={false} variant="secondary">
          Non pressé
        </Button>
        <Button icon={Trash2}>Avec icône</Button>
        <Button icon={Trash2} label="Icône seule" />
      </>,
    );

    await expectNoAxeViolationsInBothPalettes(container);
  });
});
