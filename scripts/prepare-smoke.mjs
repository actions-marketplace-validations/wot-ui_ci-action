import { mkdirSync, writeFileSync } from 'node:fs'

mkdirSync('.smoke/build', { recursive: true })
writeFileSync('.smoke/package.json', JSON.stringify({ version: '1.0.0', description: 'Offline Action smoke test' }))
writeFileSync('.smoke/build/app.json', JSON.stringify({ pages: [] }))
writeFileSync('.smoke/build/project.config.json', JSON.stringify({ appid: 'test-only-app', projectname: 'smoke', miniprogramRoot: './' }))
