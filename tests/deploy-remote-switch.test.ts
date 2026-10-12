// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Runs scripts/remote-switch.sh (the part of the deploy that executes on the
 * server) against fake `docker` and `curl` commands in a temp directory.
 *   FAKE_BROKEN_TAG  — `docker compose up -d` fails while .env points at this tag
 *   FAKE_HEALTHY     — space-separated tags whose /healthz answers
 */
function run(opts: { newTag: string, fallback?: string, broken?: string, healthy: string[] }) {
  const appDir = mkdtempSync(join(tmpdir(), 'gg-switch-'))
  const bin = mkdtempSync(join(tmpdir(), 'gg-bin-'))
  const tag = `$(sed -n 's/^IMAGE_TAG=//p' "$APP_DIR/.env")`
  writeFileSync(join(bin, 'docker'), `#!/usr/bin/env bash
case "$*" in
  "compose up -d") [ "${tag}" = "$FAKE_BROKEN_TAG" ] && { echo "bind source path does not exist" >&2; exit 1; }; echo "up ${tag}" >> "$APP_DIR/calls"; exit 0 ;;
  *logs*) echo "fake logs"; exit 0 ;;
esac
exit 0
`)
  writeFileSync(join(bin, 'curl'), `#!/usr/bin/env bash
for t in $FAKE_HEALTHY; do [ "${tag}" = "$t" ] && exit 0; done
exit 22
`)
  chmodSync(join(bin, 'docker'), 0o755)
  chmodSync(join(bin, 'curl'), 0o755)
  const result = spawnSync('bash', ['scripts/remote-switch.sh', opts.newTag, opts.fallback ?? ''], {
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      APP_DIR: appDir,
      HEALTH_TRIES: '2',
      HEALTH_SLEEP: '0',
      FAKE_BROKEN_TAG: opts.broken ?? '',
      FAKE_HEALTHY: opts.healthy.join(' '),
    },
    encoding: 'utf8',
  })
  const read = (f: string) => { try { return readFileSync(join(appDir, f), 'utf8').trim() } catch { return null } }
  return { status: result.status, stderr: result.stderr, env: read('.env'), previous: read('.previous-tag') }
}

describe('scripts/remote-switch.sh', () => {
  it('switches to a healthy new tag and remembers the old one for rollback', () => {
    const r = run({ newTag: 'new', fallback: 'old', healthy: ['new', 'old'] })
    expect(r.status).toBe(0)
    expect(r.env).toBe('IMAGE_TAG=new')
    expect(r.previous).toBe('old')
  })

  it('rolls back when the new tag starts but never gets healthy', () => {
    const r = run({ newTag: 'new', fallback: 'old', healthy: ['old'] })
    expect(r.status).not.toBe(0)
    expect(r.env).toBe('IMAGE_TAG=old')
    expect(r.stderr).toContain('rolled back to old')
    // the running version must not also be the rollback target
    expect(r.previous).toBeNull()
  })

  it('rolls back when `docker compose up` itself fails (e.g. book file missing)', () => {
    const r = run({ newTag: 'new', fallback: 'old', broken: 'new', healthy: ['old'] })
    expect(r.status).not.toBe(0)
    expect(r.env).toBe('IMAGE_TAG=old')
    expect(r.stderr).toContain('rolled back to old')
  })

  it('reports failure on a first deploy with nothing to fall back to', () => {
    const r = run({ newTag: 'new', broken: 'new', healthy: [] })
    expect(r.status).not.toBe(0)
    expect(r.stderr).toMatch(/nothing to roll back to/)
  })
})
