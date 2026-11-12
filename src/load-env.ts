import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
config({ path: resolve(rootDir, '.env.local') })
config({ path: resolve(rootDir, '.env') })
