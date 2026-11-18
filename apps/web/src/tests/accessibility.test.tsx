import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolationsInBothPalettes } from './axeHelpers';
import { renderRoute } from './renderRoute';

/** Every route of #74, with the heading that tells the page is displayed. */
const ROUTES = [
  { path: '/connexion', heading: 'Connexion' },
  { path: '/inscription', heading: 'Inscription' },
  { path: '/campagnes', heading: 'Mes campagnes' },
  { path: '/campagnes/0b6f1c2e-2f7d-4c55-9a0e-6f1d2c3b4a5e', heading: 'Campagne' },
  { path: '/rejoindre#7KQ2M-9XMAT', heading: 'Rejoindre une campagne' },
  { path: '/vue-joueurs', heading: 'Vue joueurs' },
  { path: '/adresse-inconnue', heading: 'Page introuvable' },
] as const;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Shows the page, then waits until no loading message is left. */
async function showPage(path: string, heading: string) {
  const rendered = renderRoute(path);
  await screen.findByRole('heading', { level: 1, name: heading });
  await waitFor(() => expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument());
  return rendered;
}

/** The elements Tab should reach, in the order of the page. */
function focusableElements(): HTMLElement[] {
  return [...document.body.querySelectorAll<HTMLElement>(FOCUSABLE)];
}

function moveFocusOutOfThePage() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

describe.each(ROUTES)('accessibility of $path', ({ path, heading }) => {
  it('has no axe violations, landmarks included, in both palettes', async () => {
    const { router } = await showPage(path, heading);

    await expectNoAxeViolationsInBothPalettes(document.body, { scope: 'page' });
    router.dispose();
  });

  it('follows the order of the page with Tab, and lets the focus leave it (WCAG 2.4.3, 2.1.2)', async () => {
    const user = userEvent.setup();
    const { router } = await showPage(path, heading);
    const expectedOrder = focusableElements();
    moveFocusOutOfThePage();

    for (const element of expectedOrder) {
      await user.tab();
      expect(document.activeElement).toBe(element);
    }
    await user.tab();

    expect([document.body, expectedOrder[0]]).toContain(document.activeElement);
    router.dispose();
  });

  it('follows the reverse order with Shift+Tab', async () => {
    const user = userEvent.setup();
    const { router } = await showPage(path, heading);
    const expectedOrder = focusableElements().reverse();
    moveFocusOutOfThePage();

    for (const element of expectedOrder) {
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(element);
    }
    router.dispose();
  });

  it('never forces the tab order with a positive tabindex', async () => {
    const { router } = await showPage(path, heading);

    const positive = [...document.body.querySelectorAll('[tabindex]')].filter(
      (element) => Number(element.getAttribute('tabindex')) > 0,
    );

    expect(positive).toEqual([]);
    router.dispose();
  });
});
