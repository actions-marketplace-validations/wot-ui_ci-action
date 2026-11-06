import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const result = JSON.parse(readFileSync('.smoke/artifacts/result.json', 'utf8'))
assert.equal(result.ok, true)
assert.ok(result.results.length > 0)
assert.ok(readFileSync('.smoke/artifacts/summary.md', 'utf8').length > 0)
console.log('Published CLI dry-run passed; no real platform upload was performed.')
