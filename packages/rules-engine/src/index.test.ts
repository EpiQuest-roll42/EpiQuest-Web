import { expect, it } from 'vitest';
import type { AbilityCode, RuleId, RuleRef, SrdDescription } from './index.js';

const ruleId: RuleId = 'high-elf';
const ruleRef: RuleRef = { id: ruleId, name: 'Haut-elfe' };
const description: SrdDescription = ['Premier paragraphe.', 'Second paragraphe.'];
const ability: AbilityCode = 'dex';

it('loads the rules-engine entry point', async () => {
  await expect(import('./index.js')).resolves.toBeDefined();
});

it('exposes shared rule data types through the package entry point', () => {
  expect({ ruleRef, description, ability }).toEqual({
    ruleRef: { id: 'high-elf', name: 'Haut-elfe' },
    description: ['Premier paragraphe.', 'Second paragraphe.'],
    ability: 'dex',
  });
});
