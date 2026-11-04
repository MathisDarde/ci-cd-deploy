// Bundles the API into self-contained files: no node_modules needed at runtime.
//   dist/server.mjs        Node server (Docker, VM)
//   dist/lambda/index.mjs  AWS Lambda handler (index.handler), zipped by the CD workflow
import { build } from 'esbuild'
import { rm } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })

const common = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  minify: true,
  legalComments: 'none',
  // The artefact knows its own version (git SHA in CI): GET /health reports it.
  define: { __APP_VERSION__: JSON.stringify(process.env.APP_VERSION ?? 'dev') },
  // Some CommonJS dependencies call require(): give them one in the ESM bundle.
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
}

await Promise.all([
  build({ ...common, entryPoints: ['src/server.ts'], outfile: 'dist/server.mjs' }),
  build({ ...common, entryPoints: ['src/lambda.ts'], outfile: 'dist/lambda/index.mjs' }),
])

console.warn('API built in dist/')
