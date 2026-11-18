import { expect } from 'vitest';
import { axe } from 'vitest-axe';

const PALETTES = ['clair', 'table'] as const;

export async function expectNoAxeViolationsInBothPalettes(container: Element): Promise<void> {
  try {
    for (const palette of PALETTES) {
      document.documentElement.setAttribute('data-theme', palette);
      const results = await axe(container, { rules: { region: { enabled: false } } });
      expect(results.violations, `axe, palette ${palette}`).toEqual([]);
    }
  } finally {
    document.documentElement.removeAttribute('data-theme');
  }
}
