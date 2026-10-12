// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const script = readFileSync('scripts/deploy.sh', 'utf8')

describe('scripts/deploy.sh', () => {
  it('is valid bash and executable', () => {
    execFileSync('bash', ['-n', 'scripts/deploy.sh'])
    expect(statSync('scripts/deploy.sh').mode & 0o111).not.toBe(0)
  })

  it('stops on the first error', () => {
    expect(script).toMatch(/^set -euo pipefail$/m)
  })

  it('hands the switch, health check and rollback to scripts/remote-switch.sh', () => {
    // behaviour is tested in deploy-remote-switch.test.ts
    expect(script.match(/< scripts\/remote-switch\.sh/g)).toHaveLength(2)
    expect(script).toContain('.previous-tag')
    execFileSync('bash', ['-n', 'scripts/remote-switch.sh'])
  })

  it('refuses to build with missing or quoted Supabase values', () => {
    expect(script).toMatch(/missing in \.env/)
    expect(script).toMatch(/Remove the quotes/)
  })

  it('never ships secrets: only the two public values become build args', () => {
    const buildArgs = script.match(/--build-arg [A-Z_]+/g) ?? []
    expect(buildArgs.map(a => a.replace('--build-arg ', '')).sort()).toEqual(['PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'PUBLIC_SUPABASE_URL'])
    expect(script).not.toMatch(/SERVICE_ROLE/)
  })

  it('is wired into package.json and .deploy.env is gitignored', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.scripts['deploy:test']).toBe('bash scripts/deploy.sh deploy')
    expect(pkg.scripts['deploy:rollback']).toBe('bash scripts/deploy.sh rollback')
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^\.deploy\.env$/m)
  })
})
