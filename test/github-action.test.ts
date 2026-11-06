import { execFileSync, spawnSync } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const repoRoot = path.resolve(import.meta.dirname, '..')
const actionPath = path.join(repoRoot, 'action.yml')
const scriptPath = path.join(repoRoot, 'scripts/github-action.sh')
const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { force: true, recursive: true })))
})

async function createProject(): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'wotci-action-'))
  tempDirs.push(cwd)
  return cwd
}

async function writeFakeCli(file: string): Promise<void> {
  await writeFile(file, '#!/usr/bin/env bash\nprintf \'%s\\n\' "$@" > "$OUTPUT_FILE"\n')
  await chmod(file, 0o755)
}

describe('action.yml', () => {
  it('passes every input to its consumer without interpolating values into shell code', async () => {
    const action = parse(await readFile(actionPath, 'utf8')) as {
      inputs: Record<string, { default?: string }>
      runs: { steps: { uses?: string, run?: string, shell?: string, env?: Record<string, string>, with?: Record<string, string> }[] }
    }
    const execution = action.runs.steps.find(step => step.run?.includes('github-action.sh'))!
    const names = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `import { inputNames } from ${JSON.stringify(new URL('../scripts/github-action-inputs.mjs', import.meta.url).href)}; console.log(JSON.stringify(inputNames))`], { encoding: 'utf8' }))
    expect(Object.keys(action.inputs).sort()).toEqual(names.sort())
    expect(action.runs.steps.find(step => step.uses?.startsWith('actions/setup-node@'))?.with?.['node-version']).toBe('22')
    expect(execution.env?.WOTCI_INPUTS_JSON).toBe(`\${{ toJSON(inputs) }}`)
    expect(execution.shell).toBe('bash')
    expect(execution.env?.WOTCI_ACTION_REF).toBeUndefined()
    expect(execution.run).not.toMatch(/inputs[.[]/)
    for (const [name, definition] of Object.entries(action.inputs)) {
      const reference = `\${{ inputs.${name} }}`
      const key = `INPUT_${name.toUpperCase().replaceAll('-', '_')}`
      expect(execution.env?.[key], name).toBe(reference)
      if (definition.default !== undefined)
        expect(typeof definition.default, name).toBe('string')
    }
  })

  it('声明 composite action 与核心输入', async () => {
    const action = parse(await readFile(actionPath, 'utf8')) as {
      name: string
      runs: { using: string, steps: unknown[] }
      inputs: Record<string, unknown>
    }

    expect(action.name).toBe('wot-ui-ci-action')
    expect(action.runs.using).toBe('composite')
    expect(action.runs.steps.length).toBeGreaterThan(0)
    for (const name of ['command', 'platform', 'config', 'summary', 'project-path', 'appid', 'private-key', 'private-key-path', 'upload-version', 'upload-desc', 'robot', 'tool-id', 'token'])
      expect(action.inputs).toHaveProperty(name)
  })
})

describe.skipIf(process.platform === 'win32')('github-action.sh', () => {
  it.each(['json', 'network', 'yes', 'version', 'pr-comment', 'history', 'args', 'package-version', 'registry', 'install-dependencies', 'node-version'])('rejects removed input %s before CLI invocation', async (name) => {
    const cwd = await createProject()
    const bin = path.join(cwd, 'node_modules/.bin')
    await mkdir(bin, { recursive: true })
    await writeFakeCli(path.join(bin, 'wotci'))
    const outputFile = path.join(cwd, 'args.txt')
    for (const supplied of [
      { [`INPUT_${name.toUpperCase().replaceAll('-', '_')}`]: 'false' },
      { WOTCI_INPUTS_JSON: JSON.stringify({ [name]: 'secret-not-to-log' }) },
    ]) {
      const result = spawnSync('bash', [scriptPath], {
        env: { ...process.env, INPUT_WORKING_DIRECTORY: cwd, OUTPUT_FILE: outputFile, ...supplied },
        encoding: 'utf8',
      })
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('v2')
      expect(result.stderr).not.toContain('secret-not-to-log')
      await expect(readFile(outputFile)).rejects.toThrow()
    }
  })

  it('passes a preview QR path as one argument with config reuse', async () => {
    const cwd = await createProject()
    const bin = path.join(cwd, 'node_modules/.bin')
    await mkdir(bin, { recursive: true })
    await writeFakeCli(path.join(bin, 'wotci'))
    const outputFile = path.join(cwd, 'args.txt')
    const env = { ...process.env, INPUT_WORKING_DIRECTORY: cwd, OUTPUT_FILE: outputFile, INPUT_CONFIG: 'wotci.config.ts', INPUT_QRCODE_OUTPUT: 'qr output/$(not-executed).png' }
    const result = spawnSync('bash', [scriptPath], { env: { ...env, INPUT_COMMAND: 'preview' }, encoding: 'utf8' })
    expect(result.status, result.stderr).toBe(0)
    expect((await readFile(outputFile, 'utf8')).trim().split('\n')).toEqual(['preview', '-c', 'wotci.config.ts', '--qr-output', env.INPUT_QRCODE_OUTPUT])
    expect(spawnSync('bash', [scriptPath], { env: { ...env, INPUT_COMMAND: 'upload' }, encoding: 'utf8' }).stderr).toContain('qrcode-output 仅用于')
  })

  it('组装 upload 参数并调用本地 wotci', async () => {
    const cwd = await createProject()
    const binDir = path.join(cwd, 'node_modules/.bin')
    await mkdir(binDir, { recursive: true })
    await writeFakeCli(path.join(binDir, 'wotci'))
    const outputFile = path.join(cwd, 'args.txt')

    execFileSync('bash', [scriptPath], {
      env: {
        ...process.env,
        WOTCI_ACTION_REF: 'v0.5.0',
        INPUT_COMMAND: 'upload',
        INPUT_CONFIG: 'wotci.config.ts',
        INPUT_DRY_RUN: 'true',
        INPUT_JSON_OUTPUT: 'result.json',
        INPUT_PLATFORM: 'weixin,alipay',
        INPUT_SUMMARY: 'summary.md',
        INPUT_WORKING_DIRECTORY: cwd,
        OUTPUT_FILE: outputFile,
      },
    })

    const args = (await readFile(outputFile, 'utf8')).trim().split('\n')
    expect(args).toEqual([
      'upload',
      '-p',
      'weixin,alipay',
      '-c',
      'wotci.config.ts',
      '--json',
      '--dry-run',
      '--summary',
      'summary.md',
    ])
  })

  it('本地没有 wotci 时回退到 npx', async () => {
    const cwd = await createProject()
    const binDir = path.join(cwd, 'bin')
    await mkdir(binDir, { recursive: true })
    await writeFakeCli(path.join(binDir, 'npx'))
    const outputFile = path.join(cwd, 'npx-args.txt')

    execFileSync('bash', [scriptPath], {
      env: {
        ...process.env,
        INPUT_COMMAND: 'doctor',
        WOTCI_ACTION_REF: 'v0.5.0',
        INPUT_WORKING_DIRECTORY: cwd,
        OUTPUT_FILE: outputFile,
        PATH: `${binDir}:${process.env.PATH}`,
      },
    })

    const args = (await readFile(outputFile, 'utf8')).trim().split('\n')
    expect(args).toEqual(['--yes', '--registry', expect.any(String), '--cache', expect.any(String), '@wot-ui/ci@0.5.3', 'doctor'])
  })

  it.each(['v1.0.0', 'v2.0.0', 'v1.1.0-beta.1'])('action ref 不影响默认 CLI 版本: %s', async (ref) => {
    const cwd = await createProject()
    const binDir = path.join(cwd, 'bin')
    await mkdir(binDir, { recursive: true })
    await writeFakeCli(path.join(binDir, 'npx'))
    const outputFile = path.join(cwd, 'ref-args.txt')

    execFileSync('bash', [scriptPath], {
      env: {
        ...process.env,
        GITHUB_ACTION_REF: '',
        WOTCI_ACTION_REF: ref,
        INPUT_COMMAND: 'doctor',
        INPUT_WORKING_DIRECTORY: cwd,
        OUTPUT_FILE: outputFile,
        PATH: `${binDir}:${process.env.PATH}`,
      },
    })

    const args = (await readFile(outputFile, 'utf8')).trim().split('\n')
    expect(args).toEqual(['--yes', '--registry', expect.any(String), '--cache', expect.any(String), '@wot-ui/ci@0.5.3', 'doctor'])
  })

  it.each(['v0', 'main', 'b202e082b134bc905ab11d96cceadb97a11aa5de', ''])('浮动 Action ref 使用已验证的 CLI 版本: %s', async (ref) => {
    const cwd = await createProject()
    const binDir = path.join(cwd, 'bin')
    await mkdir(binDir, { recursive: true })
    await writeFakeCli(path.join(binDir, 'npx'))
    const outputFile = path.join(cwd, 'floating-args.txt')

    execFileSync('bash', [scriptPath], {
      env: {
        ...process.env,
        WOTCI_ACTION_REF: ref,
        INPUT_COMMAND: 'doctor',
        INPUT_WORKING_DIRECTORY: cwd,
        OUTPUT_FILE: outputFile,
        PATH: `${binDir}:${process.env.PATH}`,
      },
    })

    const args = (await readFile(outputFile, 'utf8')).trim().split('\n')
    expect(args).toEqual(['--yes', '--registry', expect.any(String), '--cache', expect.any(String), '@wot-ui/ci@0.5.3', 'doctor'])
  })
})
