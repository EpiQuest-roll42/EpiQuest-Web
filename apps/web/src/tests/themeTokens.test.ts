import { describe, expect, it } from 'vitest';

type Declarations = Record<string, string>;
type PaletteName = 'clair' | 'table';
type Use = 'texte' | 'graphique' | 'non';

/*
 * Vitest returns an empty string for CSS imports, even with `?raw`: the files are read from disk.
 * The web package has no Node types (browser code), so `node:fs` is reached through
 * `process.getBuiltinModule` (Node ≥ 22.3) with the one signature the test needs.
 */
interface NodeFileSystem {
  readFileSync(path: URL, encoding: 'utf8'): string;
}
const { readFileSync } = (
  globalThis as unknown as {
    process: { getBuiltinModule(id: 'node:fs'): NodeFileSystem };
  }
).process.getBuiltinModule('node:fs');

function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

const tokensCss = readSource('../theme/tokens.css');
const baseCss = readSource('../theme/base.css');
const componentsCss = readSource('../theme/components.css');
const fontsCss = readSource('../theme/fonts.css');
const indexCss = readSource('../index.css');
const css = stripComments(tokensCss);

function value(declarations: Declarations, name: string): string {
  const declared = declarations[name];
  if (declared === undefined) {
    throw new Error(`Déclaration absente : ${name}`);
  }
  return declared;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readBlock(source: string, selector: string, occurrence = 0): Declarations {
  let start = -1;
  for (let index = 0; index <= occurrence; index += 1) {
    start = source.indexOf(`${selector} {`, start + 1);
    if (start === -1) {
      throw new Error(`Bloc introuvable : ${selector} (n° ${occurrence + 1})`);
    }
  }
  const body = source.slice(source.indexOf('{', start) + 1, source.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, name, declared]) => [
      name,
      declared?.trim(),
    ]),
  );
}

function readCssDeclarations(source: string, selector: string): Declarations {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) {
    throw new Error(`Bloc introuvable : ${selector}`);
  }
  const body = source.slice(source.indexOf('{', start) + 1, source.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, name, declared]) => [
      name,
      declared?.trim(),
    ]),
  );
}

function readMediaBlock(source: string, media: string, selector: string): Declarations {
  const mediaStart = source.indexOf(`@media ${media} {`);
  if (mediaStart === -1) {
    throw new Error(`Media introuvable : ${media}`);
  }
  return readBlock(source.slice(mediaStart), selector);
}

function resolve(declarations: Declarations, name: string): string {
  const declared = value(declarations, name);
  const alias = /^var\(--([\w-]+)\)$/.exec(declared);
  return alias?.[1] === undefined ? declared : resolve(declarations, alias[1]);
}

function relativeLuminance(hex: string): number {
  const linear = (offset: number) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(1) + 0.7152 * linear(3) + 0.0722 * linear(5);
}

function contrastRatio(first: string, second: string): number {
  const luminances = [relativeLuminance(first), relativeLuminance(second)];
  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05);
}

const palettes: Record<PaletteName, Declarations> = {
  clair: readBlock(css, ':root'),
  table: readBlock(css, ":root[data-theme='table']"),
};

const CHARTER_COLORS = [
  'bg-app',
  'bg-surface',
  'bg-raised',
  'bg-fog',
  'border-default',
  'text-primary',
  'text-muted',
  'text-on-accent',
  'accent-default',
  'focus-ring',
  'state-success',
  'state-warning',
  'state-danger',
  'team-ally',
  'team-enemy',
  'brand-flame',
];

const BACKGROUNDS = ['bg-app', 'bg-surface', 'bg-raised', 'bg-fog'] as const;

const CHARTER_PAIRS: Record<
  PaletteName,
  Record<string, { onBackgrounds: [Use, number][]; onFill?: number }>
> = {
  clair: {
    'text-primary': {
      onBackgrounds: [
        ['texte', 13.88],
        ['texte', 15.24],
        ['texte', 12.34],
        ['non', 1.3],
      ],
    },
    'text-muted': {
      onBackgrounds: [
        ['texte', 5.62],
        ['texte', 6.17],
        ['texte', 5.0],
        ['non', 1.9],
      ],
    },
    'accent-default': {
      onBackgrounds: [
        ['texte', 6.94],
        ['texte', 7.62],
        ['texte', 6.17],
        ['non', 1.54],
      ],
      onFill: 8.15,
    },
    'state-success': {
      onBackgrounds: [
        ['texte', 5.49],
        ['texte', 6.02],
        ['texte', 4.88],
        ['non', 1.95],
      ],
      onFill: 6.44,
    },
    'state-warning': {
      onBackgrounds: [
        ['texte', 5.22],
        ['texte', 5.73],
        ['texte', 4.64],
        ['non', 2.05],
      ],
      onFill: 6.13,
    },
    'state-danger': {
      onBackgrounds: [
        ['texte', 5.57],
        ['texte', 6.11],
        ['texte', 4.95],
        ['non', 1.92],
      ],
      onFill: 6.54,
    },
    'team-ally': {
      onBackgrounds: [
        ['texte', 5.21],
        ['texte', 5.72],
        ['texte', 4.63],
        ['non', 2.05],
      ],
      onFill: 6.12,
    },
    'focus-ring': {
      onBackgrounds: [
        ['graphique', 5.2],
        ['graphique', 5.71],
        ['graphique', 4.62],
        ['non', 2.06],
      ],
    },
    'border-default': {
      onBackgrounds: [
        ['graphique', 3.49],
        ['graphique', 3.83],
        ['graphique', 3.1],
        ['graphique', 3.07],
      ],
    },
    'brand-flame': {
      onBackgrounds: [
        ['non', 2.21],
        ['non', 2.42],
        ['non', 1.96],
        ['graphique', 4.84],
      ],
    },
  },
  table: {
    'text-primary': {
      onBackgrounds: [
        ['texte', 15.26],
        ['texte', 13.32],
        ['texte', 10.96],
        ['texte', 10.69],
      ],
    },
    'text-muted': {
      onBackgrounds: [
        ['texte', 9.89],
        ['texte', 8.64],
        ['texte', 7.11],
        ['texte', 6.93],
      ],
    },
    'accent-default': {
      onBackgrounds: [
        ['texte', 7.95],
        ['texte', 6.94],
        ['texte', 5.71],
        ['texte', 5.57],
      ],
      onFill: 7.95,
    },
    'state-success': {
      onBackgrounds: [
        ['texte', 9.84],
        ['texte', 8.58],
        ['texte', 7.07],
        ['texte', 6.89],
      ],
      onFill: 9.84,
    },
    'state-warning': {
      onBackgrounds: [
        ['texte', 10.43],
        ['texte', 9.11],
        ['texte', 7.5],
        ['texte', 7.31],
      ],
      onFill: 10.43,
    },
    'state-danger': {
      onBackgrounds: [
        ['texte', 7.95],
        ['texte', 6.94],
        ['texte', 5.71],
        ['texte', 5.57],
      ],
      onFill: 7.95,
    },
    'team-ally': {
      onBackgrounds: [
        ['texte', 8.76],
        ['texte', 7.65],
        ['texte', 6.29],
        ['texte', 6.14],
      ],
      onFill: 8.76,
    },
    'focus-ring': {
      onBackgrounds: [
        ['graphique', 10.81],
        ['graphique', 9.44],
        ['graphique', 7.77],
        ['graphique', 7.58],
      ],
    },
    'border-default': {
      onBackgrounds: [
        ['graphique', 5.34],
        ['graphique', 4.66],
        ['graphique', 3.83],
        ['graphique', 3.74],
      ],
    },
    'brand-flame': {
      onBackgrounds: [
        ['graphique', 6.91],
        ['graphique', 6.03],
        ['graphique', 4.96],
        ['graphique', 4.84],
      ],
    },
  },
};

const MINIMUM_RATIO: Record<Exclude<Use, 'non'>, number> = {
  texte: 4.5,
  graphique: 3,
};

const pairCases = (Object.keys(CHARTER_PAIRS) as PaletteName[]).flatMap((palette) =>
  Object.entries(CHARTER_PAIRS[palette]).flatMap(([color, { onBackgrounds, onFill }]) => [
    ...onBackgrounds.map(([use, ratio], index) => ({
      palette,
      foreground: color,
      background: BACKGROUNDS[index] ?? 'fond-absent-de-la-charte',
      use,
      ratio,
    })),
    ...(onFill === undefined
      ? []
      : [
          {
            palette,
            foreground: 'text-on-accent',
            background: color,
            use: 'texte' as const,
            ratio: onFill,
          },
        ]),
  ]),
);

describe('charter color tokens', () => {
  it.each(Object.keys(palettes) as PaletteName[])(
    'defines exactly the charter colors in the %s palette',
    (palette) => {
      expect(Object.keys(palettes[palette]).sort()).toEqual([...CHARTER_COLORS].sort());
    },
  );

  it.each(Object.keys(palettes) as PaletteName[])(
    'uses state/danger for team/enemy in the %s palette',
    (palette) => {
      expect(palettes[palette]['team-enemy']).toBe('var(--state-danger)');
    },
  );

  it('applies the same game-table palette when the system prefers a dark scheme', () => {
    const systemDark = readMediaBlock(
      css,
      '(prefers-color-scheme: dark)',
      ":root:not([data-theme='clair'])",
    );

    expect(systemDark).toEqual(palettes.table);
  });

  it.each(pairCases)(
    '$palette: --$foreground on --$background matches the charter ratio ($ratio, $use)',
    ({ palette, foreground, background, use, ratio }) => {
      const actual = contrastRatio(
        resolve(palettes[palette], foreground),
        resolve(palettes[palette], background),
      );

      expect(actual).toBeCloseTo(ratio, 1);
      expect(Math.abs(actual - ratio)).toBeLessThanOrEqual(0.011);
      if (use !== 'non') {
        expect(actual).toBeGreaterThanOrEqual(MINIMUM_RATIO[use]);
      }
    },
  );
});

describe('charter scales', () => {
  const scales = readBlock(css, ':root', 1);
  const tableScale = readBlock(css, "[data-text-scale='table']");

  it('expresses every font size and spacing in rem, so text follows zoom (WCAG 1.4.4)', () => {
    const sizes = Object.entries({ ...scales, ...tableScale }).filter(
      ([name]) => name.startsWith('font-size-') || name.startsWith('space-'),
    );

    expect(sizes.length).toBeGreaterThan(0);
    for (const [name, value] of sizes) {
      expect(`${name}: ${value}`).toMatch(/: \d+(\.\d+)?rem$/);
    }
  });

  it('follows the charter type scale', () => {
    expect(scales).toMatchObject({
      'font-size-h1': '2rem',
      'font-size-h2': '1.5rem',
      'font-size-body': '1rem',
      'font-size-caption': '0.8125rem',
      'line-height-body': '1.5',
    });
  });

  it('keeps game-table text at least 20 px, names at 24 px and roll results at 64 px', () => {
    const toPixels = (value: string) => parseFloat(value) * 16;

    for (const name of ['font-size-body', 'font-size-caption', 'font-size-name']) {
      expect(toPixels(value(tableScale, name))).toBeGreaterThanOrEqual(20);
    }
    expect(toPixels(value(tableScale, 'font-size-name'))).toBe(24);
    expect(toPixels(value(tableScale, 'font-size-roll-result'))).toBe(64);
  });
});

describe('charter components', () => {
  it('gives every button the minimum target size, and the charter variants', () => {
    expect(readCssDeclarations(componentsCss, '.button')).toMatchObject({
      'min-width': 'var(--target-min-size)',
      'min-height': 'var(--target-min-size)',
    });
    expect(readCssDeclarations(componentsCss, '.button--primary')).toMatchObject({
      color: 'var(--text-on-accent)',
      background: 'var(--accent-default)',
    });
    expect(readCssDeclarations(componentsCss, '.button--secondary')).toMatchObject({
      'border-color': 'var(--border-default)',
      color: 'var(--text-primary)',
      background: 'var(--bg-raised)',
    });
    expect(readCssDeclarations(componentsCss, ".button[aria-pressed='true']")).toMatchObject({
      color: 'var(--text-on-accent)',
      background: 'var(--accent-default)',
    });
    expect(value(readBlock(css, ':root', 1), 'target-min-size')).toBe('2.75rem');
  });

  it('draws a field with a visible border, thicker and in danger color when invalid', () => {
    expect(readCssDeclarations(componentsCss, '.field__input')).toMatchObject({
      'min-height': 'var(--target-min-size)',
      border: '1px solid var(--border-default)',
      color: 'var(--text-primary)',
      background: 'var(--bg-surface)',
    });
    expect(readCssDeclarations(componentsCss, '.field--invalid .field__input')).toMatchObject({
      'border-color': 'var(--state-danger)',
      'border-width': '2px',
    });
    expect(readCssDeclarations(componentsCss, '.field__error')).toMatchObject({
      color: 'var(--state-danger)',
    });
  });

  it('shows the side of a token by its shape, not only its color (WCAG 1.4.1)', () => {
    expect(readCssDeclarations(componentsCss, '.token')).toMatchObject({
      width: 'var(--target-min-size)',
      height: 'var(--target-min-size)',
      color: 'var(--text-on-accent)',
    });
    expect(readCssDeclarations(componentsCss, '.token--ally')).toMatchObject({
      'border-radius': 'var(--radius-round)',
      background: 'var(--team-ally)',
    });
    expect(readCssDeclarations(componentsCss, '.token--enemy')).toMatchObject({
      'border-radius': 'var(--radius-small)',
      background: 'var(--team-enemy)',
    });
  });
});

describe('focus', () => {
  const styleSources = { 'base.css': baseCss, 'components.css': componentsCss };

  it('draws the charter ring on every focused element: a 2 px gap, then a 3 px ring', () => {
    expect(readCssDeclarations(baseCss, ':focus-visible')).toMatchObject({
      outline: 'var(--focus-ring-width) solid var(--focus-ring)',
      'outline-offset': 'var(--focus-gap)',
      'box-shadow': '0 0 0 var(--focus-gap) var(--bg-app)',
    });
    const scales = readBlock(css, ':root', 1);
    expect(value(scales, 'focus-gap')).toBe('2px');
    expect(value(scales, 'focus-ring-width')).toBe('3px');
  });

  it('only removes the ring from an element focused by code and clicked with the mouse', () => {
    for (const [file, source] of Object.entries(styleSources)) {
      const rules = [...stripComments(source).matchAll(/([^{}]+)\{([^}]*)\}/g)];
      const hidingRules = rules
        .filter(([, , body]) => /outline\s*:\s*(none|0)\b/.test(body ?? ''))
        .map(([, selector]) => selector?.trim());
      expect(hidingRules, file).toEqual(
        file === 'base.css' ? ["[tabindex='-1']:focus:not(:focus-visible)"] : [],
      );
    }
  });

  it('has no sticky or fixed element that could hide the focused one (WCAG 2.4.11)', () => {
    for (const [file, source] of Object.entries(styleSources)) {
      expect(stripComments(source), file).not.toMatch(/position\s*:\s*(sticky|fixed)/);
    }
  });
});

describe('reduced motion', () => {
  it('animates by default and sets the animation duration to 0 on prefers-reduced-motion', () => {
    const scales = readBlock(css, ':root', 1);
    const reduced = readMediaBlock(css, '(prefers-reduced-motion: reduce)', ':root');

    expect(parseFloat(value(scales, 'duration-animation'))).toBeGreaterThan(0);
    expect(value(reduced, 'duration-animation')).toBe('0s');
  });
});

describe('global styles', () => {
  it('takes every color from the charter variables', () => {
    for (const source of [baseCss, componentsCss, indexCss, fontsCss]) {
      expect(stripComments(source)).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    }
  });

  it('loads fonts from the application, never from a third party', () => {
    for (const source of [fontsCss, indexCss, baseCss, componentsCss, tokensCss]) {
      expect(stripComments(source)).not.toMatch(/https?:|fonts\.googleapis|fonts\.gstatic/);
    }
  });
});
