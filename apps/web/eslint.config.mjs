// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['coverage/**', '.output/**', 'dist/**'],
  },
  {
    rules: {
      // No debug output left in the code: console.warn / console.error stay allowed.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      // Formatting belongs to Prettier, which writes <img />.
      'vue/html-self-closing': 'off',
    },
  },
)
