import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier/flat';

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/.turbo/**',
    '**/coverage/**',
    'apps/web/src/models/api/schema.d.ts',
  ]),
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['apps/web/src/views/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/models',
                '**/models/**',
                'openapi-fetch',
                '**/mockCampaignRepository',
                '**/mockCampaignRepository.*',
                '**/repositoriesContext',
                '**/repositoriesContext.*',
                '**/createRepositories',
                '**/createRepositories.*',
              ],
              message: 'Les Views dépendent uniquement des ViewModels.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/viewModels/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/views', '**/views/**', '**/components', '**/components/**'],
              message: 'Les ViewModels ne dépendent pas des composants de View.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },

  prettierConfig,
]);
