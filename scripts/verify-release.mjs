import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import process from 'node:process'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const tag = process.argv[2] || process.env.GITHUB_REF_NAME
assert.match(tag || '', /^v\d+\.\d+\.\d+(?:-[\da-z.-]+)?$/i, 'Expected an exact release tag')
assert.equal(tag, `v${pkg.version}`, 'Tag must match the Action package version')
assert.match(pkg.wotciVersion, /^\d+\.\d+\.\d+$/, 'Pin a tested stable CLI release')
assert.equal(pkg.devDependencies['@wot-ui/ci'], pkg.wotciVersion, 'Test the default CLI version')
assert.equal(pkg.private, true, 'The Action must not be published to npm')
console.log(`${tag}: Action release; tested CLI ${pkg.wotciVersion}`)
