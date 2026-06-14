import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const files = [
  'mong_logo-removebg.png',
  'images/placeholder.svg',
  'images/58645746-dfac-4e9f-8914-649ea9576caf.jpeg',
]

for (const file of files) {
  const source = join(root, 'public', file)
  const target = join(root, 'dist', file)
  if (!existsSync(source)) continue
  if (statSync(source).size === 0) continue
  mkdirSync(dirname(target), { recursive: true })
  rmSync(target, { force: true })
  copyFileSync(source, target)
}
