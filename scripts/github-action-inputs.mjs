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
      throw new Error('发现不支持的 input；请查看 README 的“参数参考”章节')
  }
  for (const name of removedInputs) {
    if (env[`INPUT_${name.toUpperCase().replaceAll('-', '_')}`])
      throw new Error(`不支持 input ${name}；请查看 README 的“参数参考”章节`)
  }
  const command = env.INPUT_COMMAND || 'upload'
  if (!['upload', 'preview', 'doctor'].includes(command))
    throw new Error('command 仅支持 upload / preview / doctor；其他命令请直接使用 CLI')
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
