import { readFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

export function resolvePackageVersion(env = process.env) {
  return env.INPUT_PACKAGE_VERSION?.trim() || manifest.wotciVersion
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  process.stdout.write(resolvePackageVersion())
