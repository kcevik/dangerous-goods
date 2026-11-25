// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('Dockerfile', () => {
  const file = read('Dockerfile')
  const runtime = file.slice(file.lastIndexOf('FROM '))

  it('runs the app as the unprivileged node user', () => {
    expect(runtime).toMatch(/^USER node$/m)
    expect(runtime).toContain('CMD ["node", "build"]')
  })

  it('never copies the book or env files into an image', () => {
    expect(file).not.toMatch(/csvbase/)
    expect(file).not.toMatch(/COPY[^\n]*\.env/)
  })

  it('takes the public Supabase values as build args only', () => {
    expect(file).toContain('ARG PUBLIC_SUPABASE_URL')
    expect(file).toContain('ARG PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    expect(file).not.toMatch(/SERVICE_ROLE/)
  })
})

describe('.dockerignore', () => {
  const lines = read('.dockerignore').split('\n').map(l => l.trim())
  it.each(['csvbase', '.env', '.env.*', 'node_modules', '.git', '.superpowers'])('excludes %s', (entry) => {
    expect(lines).toContain(entry)
  })
})

describe('deploy/compose.yaml', () => {
  const compose = read('deploy/compose.yaml')

  it('publishes the app on the loopback interface only', () => {
    expect(compose).toContain('"127.0.0.1:3000:3000"')
    expect(compose).not.toMatch(/-\s*"?3000:3000/)
  })

  it('mounts the book read-only and refuses to invent a missing file', () => {
    expect(compose).toContain('source: /var/lib/gefahrgut/ADR2025-konsolidiert.md')
    expect(compose).toContain('target: /data/adr.md')
    expect(compose).toContain('read_only: true')
    expect(compose).toContain('create_host_path: false')
  })

  it('keeps secrets in the server env file', () => {
    expect(compose).toContain('/etc/gefahrgut/app.env')
    expect(compose).not.toMatch(/SUPABASE|KEY=/)
  })

  it('limits memory and log growth and restarts on failure', () => {
    expect(compose).toContain('mem_limit: 512m')
    expect(compose).toContain('max-size: "10m"')
    expect(compose).toContain('restart: unless-stopped')
  })
})

describe('deploy/app.env.example', () => {
  const env = read('deploy/app.env.example')
  it('defaults to the waitlist and trusts exactly one proxy hop', () => {
    expect(env).toMatch(/^REGISTRATION_MODE=waitlist$/m)
    expect(env).toMatch(/^ADDRESS_HEADER=X-Forwarded-For$/m)
    expect(env).toMatch(/^XFF_DEPTH=1$/m)
    expect(env).toMatch(/^ORIGIN=https:\/\/app\.gefahrgut\.org$/m)
  })
})

describe('deploy/Caddyfile', () => {
  const caddy = read('deploy/Caddyfile')

  it('serves exactly the app host (Caddy gets the certificate itself)', () => {
    expect(caddy).toMatch(/^app\.gefahrgut\.org \{$/m)
    expect(caddy).not.toContain('neu.gefahrgut.org')
  })

  it('is public: the landing page lives here, so no basic auth and no hash in the repo', () => {
    expect(caddy).not.toContain('basic_auth')
    expect(caddy).not.toMatch(/\$2[aby]\$/)
  })

  it('counts requests and status codes with Caddy metrics (no access log, so no IP is stored)', () => {
    expect(caddy).toMatch(/^\tservers \{\n\t\tmetrics\n\t\}$/m)
    expect(caddy).not.toMatch(/^\s*log\b/m)
  })

  it('compresses responses and sets the basic security headers', () => {
    expect(caddy).toMatch(/^\tencode zstd gzip$/m)
    for (const h of ['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy'])
      expect(caddy).toContain(h)
  })

  it('proxies to the loopback app', () => {
    expect(caddy).toMatch(/^\treverse_proxy 127\.0\.0\.1:3000$/m)
  })

  it('does not trust client-sent X-Forwarded-For (the rate limits rely on it)', () => {
    expect(caddy).not.toContain('trusted_proxies')
  })

  it('lets search engines index the site and limits request bodies', () => {
    expect(caddy).not.toContain('X-Robots-Tag')
    expect(caddy).toMatch(/request_body \{\s*max_size 1MB\s*\}/)
  })
})

describe('.deploy.env.example', () => {
  it('targets the app host', () => {
    expect(read('.deploy.env.example')).toMatch(/^DEPLOY_HOST=app\.gefahrgut\.org$/m)
  })
})
