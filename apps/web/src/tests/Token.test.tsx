import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { HealthState } from '../models/api/schema';
import { Token } from '../components/Token';
import {
  tokenAccessibleName,
  tokenInitials,
  type TokenHealthState,
} from '../components/tokenLabels';
import { expectNoAxeViolationsInBothPalettes } from './axeHelpers';

const thorin = {
  kind: 'character',
  name: 'Thorin',
  side: 'ally',
  hitPoints: { current: 20, max: 34 },
} as const;

const ogre = { kind: 'creature', name: 'Ogre', side: 'enemy', healthState: 'wounded' } as const;

function SelectableToken() {
  const [selected, setSelected] = useState(false);
  return <Token {...thorin} selected={selected} onSelect={() => setSelected((value) => !value)} />;
}

describe('tokenInitials', () => {
  it('takes the first two letters of a single word', () => {
    expect(tokenInitials('Ogre')).toBe('OG');
    expect(tokenInitials('arwen')).toBe('AR');
  });

  it('takes the first letter of the first and last words', () => {
    expect(tokenInitials('Arwen du Nord')).toBe('AN');
    expect(tokenInitials('  Thorin   écu-de-chêne ')).toBe('TÉ');
  });

  it('handles a one-letter or empty name', () => {
    expect(tokenInitials('X')).toBe('X');
    expect(tokenInitials('')).toBe('');
  });
});

describe('Token', () => {
  it('names a character with its side and exact hit points', () => {
    render(<Token {...thorin} />);

    expect(screen.getByRole('img', { name: 'Thorin, allié, 20 PV sur 34' })).toHaveTextContent(
      'TH',
    );
  });

  it('names a creature with its approximate state, never hit points', () => {
    const { container } = render(<Token {...ogre} />);

    const token = screen.getByRole('img', { name: 'Ogre, ennemi, blessé' });
    expect(token).toBeInTheDocument();
    for (const healthState of ['unharmed', 'wounded', 'down'] as const) {
      const name = tokenAccessibleName({ ...ogre, healthState });
      expect(name).not.toMatch(/\d|PV/);
    }
    expect(container.textContent).not.toMatch(/\d|PV/);
  });

  it('translates every health state', () => {
    expect(tokenAccessibleName({ ...ogre, healthState: 'unharmed' })).toBe('Ogre, ennemi, indemne');
    expect(tokenAccessibleName({ ...ogre, healthState: 'down' })).toBe('Ogre, ennemi, à terre');
  });

  it('cannot give hit points to a creature', () => {
    // @ts-expect-error A creature only has a health state: the player display never receives its hit points.
    const withHitPoints = <Token {...ogre} hitPoints={{ current: 3, max: 59 }} />;

    expect(withHitPoints).toBeDefined();
  });

  it('keeps the health states of the API contract', () => {
    expectTypeOf<TokenHealthState>().toEqualTypeOf<HealthState>();
  });

  it('shows the side by its shape class, round for an ally and square for an enemy', () => {
    render(
      <>
        <Token {...thorin} />
        <Token {...ogre} />
      </>,
    );

    expect(screen.getByRole('img', { name: /Thorin/ })).toHaveClass('token--ally');
    expect(screen.getByRole('img', { name: /Ogre/ })).toHaveClass('token--enemy');
  });

  it('is not focusable when it cannot be selected', async () => {
    const user = userEvent.setup();
    render(<Token {...thorin} />);

    await user.tab();

    expect(document.body).toHaveFocus();
  });

  it('can be selected with the keyboard, and announces its state', async () => {
    const user = userEvent.setup();
    render(<SelectableToken />);
    const token = screen.getByRole('button', { name: 'Thorin, allié, 20 PV sur 34' });

    await user.tab();
    expect(token).toHaveFocus();
    expect(token).toHaveAttribute('aria-pressed', 'false');

    await user.keyboard('{Enter}');
    expect(token).toHaveAttribute('aria-pressed', 'true');
    expect(token).toHaveClass('token--selected');

    await user.keyboard(' ');
    expect(token).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onSelect on a click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Token {...ogre} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Ogre, ennemi, blessé' }));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('says a token is selected even when it is not a button', () => {
    render(<Token {...ogre} selected />);

    expect(
      screen.getByRole('img', { name: 'Ogre, ennemi, blessé, sélectionné' }),
    ).toBeInTheDocument();
  });

  it('has no axe violations in any state, in both palettes', async () => {
    const { container } = render(
      <>
        <Token {...thorin} />
        <Token {...ogre} selected />
        <Token {...thorin} onSelect={() => {}} />
        <Token {...ogre} selected onSelect={() => {}} />
      </>,
    );

    await expectNoAxeViolationsInBothPalettes(container);
  });
});
