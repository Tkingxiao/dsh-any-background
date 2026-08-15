/**
 * Standalone tsdown config for the Deep Midnight theme plugin.
 * Emits both the node-half lib and the browser client bundle.
 * Uses a self-contained config (no shared preset import) so the plugin
 * directory is fully copy-pasteable out of the monorepo.
 */
import type { UserConfig } from 'tsdown'

const ID = 'dsh-any-background'

/** Externals resolved from the loader module table at runtime. */
const EXTERNALS = [
  '@deepseek-ai/dsh-home-paths',
  'react',
  'react/jsx-runtime',
  '@deepseek-ai/dsh-client-connection',
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-settings',
  '@deepseek-ai/dsh-api-remotes',
  '@deepseek-ai/dsh-client-ui-theme',
]

const configs: UserConfig[] = [
  // Node half: lib/index.js + lib/invariant.js
  {
    name: ID,
    entry: {
      index: 'src/index.ts',
      invariant: 'src/invariant.ts',
    },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    external: EXTERNALS,
    dts: false,
    clean: false,
    fixedExtension: false,
  },
  // Client half: lib/client.js (browser bundle)
  {
    name: `${ID}/client`,
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    external: EXTERNALS,
    noExternal: (id: string) => (EXTERNALS.includes(id) ? undefined : true),
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
]

export default configs
