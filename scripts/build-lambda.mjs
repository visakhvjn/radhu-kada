import * as esbuild from 'esbuild'
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'dist/lambda')
const zipPath = resolve(root, 'dist/radhu-api.zip')
const rootPkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

rmSync(outDir, { recursive: true, force: true })
rmSync(zipPath, { force: true })
mkdirSync(outDir, { recursive: true })

await esbuild.build({
  entryPoints: [resolve(root, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: resolve(outDir, 'index.mjs'),
  format: 'esm',
  external: ['mongodb'],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
})

writeFileSync(
  resolve(outDir, 'package.json'),
  JSON.stringify(
    {
      name: 'radhu-api-lambda',
      private: true,
      type: 'module',
      dependencies: {
        mongodb: rootPkg.dependencies.mongodb,
      },
    },
    null,
    2,
  ),
)

execSync('npm install --omit=dev --no-package-lock', {
  cwd: outDir,
  stdio: 'inherit',
})

execSync(`zip -r "${zipPath}" .`, { cwd: outDir, stdio: 'inherit' })

console.log(`Lambda package created at ${zipPath}`)
