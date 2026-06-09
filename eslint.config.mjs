import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const jsxFiles = ['**/*.{jsx,tsx}'];
const webFiles = ['apps/web/**/*.{js,jsx,ts,tsx}'];

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.turbo/**', '**/coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...jsxA11y.flatConfigs.recommended,
    files: jsxFiles,
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: jsxFiles,
  },
  {
    ...nextPlugin.configs['core-web-vitals'],
    files: webFiles,
    settings: {
      next: {
        rootDir: 'apps/web/',
      },
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
);
