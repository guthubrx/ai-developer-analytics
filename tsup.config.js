/**
 * Tsup configuration for bundling frontend JavaScript
 */

export default {
  entry: ['media/main.js'],
  format: 'iife',
  outDir: 'media',
  outExtension: () => ({ js: '.bundle.js' }),
  clean: false,
  bundle: true,
  splitting: false,
  sourcemap: false,
  minify: false,
  target: 'es2020',
  platform: 'browser',
  globalName: 'AIAnalytics',
  external: ['vscode'],
  noExternal: [],
  treeshake: true
};