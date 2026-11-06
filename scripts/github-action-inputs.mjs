import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const inputNames = [
  'command',
  'platform',
  'config',
  'project-path',
  'appid',
  'private-key',
  'private-key-path',
  'upload-version',
  'upload-desc',
  'robot',
  'tool-id',
  'token',
  'setting',
  'preview',
  'platform-options',
  'working-directory',
  'summary',
  'qrcode-output',
  'json-output',
  'dry-run',
]
export const removedInputs = [
  'json',
  'network',
  'yes',
  'version',
  'pr-comment',
  'history',
  'args',
  'package-version',
  'registry',
  'install-dependencies',
  'node-version',
]

export function validateInputs(env = process.env) {
  if (env.WOTCI_INPUTS_JSON) {
    let inputs
    try {
      inputs = JSON.parse(env.WOTCI_INPUTS_JSON)
    }
    catch {
      throw new Error('Invalid Action inputs JSON')
    }
    if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs))
      throw new Error('Invalid Action inputs')
    // Never log input values: credentials may be included in this object.
    if (Object.keys(inputs).some(key => !inputNames.includes(key)))
      throw new Error('发现不支持的 input；v2 已精简接口，请按 README 的“迁移到 v2”章节 迁移或使用 @v1')
  }
  for (const name of removedInputs) {
    if (env[`INPUT_${name.toUpperCase().replaceAll('-', '_')}`])
      throw new Error(`v2 已移除 ${name}；请按 README 的“迁移到 v2”章节 迁移或使用 @v1`)
  }
  const command = env.INPUT_COMMAND || 'upload'
  if (!['upload', 'preview', 'doctor'].includes(command))
    throw new Error('command 仅支持 upload / preview / doctor；其他命令请直接使用 CLI 或 @v1')
  if (env.INPUT_QRCODE_OUTPUT && command !== 'preview')
    throw new Error('qrcode-output 仅用于 command: preview')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    validateInputs()
  }
  catch (error) {
    console.error(`[wotci-action] ${error.message}`)
    process.exitCode = 1
  }
}
