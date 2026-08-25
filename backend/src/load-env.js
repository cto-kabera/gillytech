import { config } from 'dotenv'
import { resolve } from 'path'

const root = resolve(process.cwd())
config({ path: resolve(root, '.env') })
config({ path: resolve(root, '.env.local'), override: true })
