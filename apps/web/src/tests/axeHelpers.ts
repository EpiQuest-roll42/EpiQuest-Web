import { expect } from 'vitest';
import { axe } from 'vitest-axe';

const PALETTES = ['clair', 'table'] as const;

type AxeScope = 'component' | 'page';

export async function expectNoAxeViolationsInBothPalettes(
  container: Element,
  { scope = 'component' }: { scope?: AxeScope } = {},
): Promise<void> {
  const root = document.documentElement;
  const previousTheme = root.getAttribute('data-theme');
  try {
    for (const palette of PALETTES) {
      root.setAttribute('data-theme', palette);
      const results = await axe(container, {
        rules: { region: { enabled: scope === 'page' } },
      });
      expect(results.violations, `axe, palette ${palette}`).toEqual([]);
    }
  } finally {
    if (previousTheme === null) {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', previousTheme);
    }
  }
}
