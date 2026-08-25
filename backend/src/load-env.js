import { config } from 'dotenv'
import { resolve } from 'path'

const root = resolve(process.cwd())
config({ path: resolve(root, '.env') })
if (process.env.GILLY_SKIP_LOCAL !== '1') {
  config({ path: resolve(root, '.env.local'), override: true })
}
