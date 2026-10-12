# Test deployment runbook — app.gefahrgut.org (Strato VPS)

The app runs as a Docker container bound to `127.0.0.1:3000`; Caddy on the host terminates
HTTPS (automatic Let's Encrypt certificate) and proxies to it. During the test phase the whole
site sits behind basic auth, so the launch-list form, Google Fonts and the ADR book are not
reachable for strangers.

`<ip>` = the VPS IPv4. Each step says how to check it worked — do not continue until it does.

## 1. VPS

Strato VPS Linux, **Ubuntu 24.04**, ≥ 2 GB RAM. Note the IPv4 (and IPv6, if any). If the Strato
panel has a firewall for the server, allow TCP 22, 80 and 443 there too.

## 2. DNS at Strato

Domains → gefahrgut.org → DNS: add `A app → <ipv4>` (and `AAAA app → <ipv6>` if the VPS has one).
**Do not touch MX or the apex** — the blog and mail stay where they are.

Check: `dig +short app.gefahrgut.org` prints the IP (can take up to an hour).

## 3. First login + user

```bash
ssh root@<ip>
adduser deploy
usermod -aG sudo deploy
# on your machine:
ssh-copy-id deploy@<ip>
```

Check: `ssh deploy@<ip>` works **before** step 4.

## 4. Lock SSH

`/etc/ssh/sshd_config.d/10-hardening.conf`:

```
PasswordAuthentication no
PermitRootLogin no
```

`sudo systemctl reload ssh`. Check from a **second** terminal that `ssh deploy@<ip>` still works.

## 5. Firewall + automatic updates

```bash
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable
sudo apt install unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades
```

Check: `sudo ufw status` lists 22, 80, 443.

## 6. Docker

Install Docker Engine from Docker's apt repository (docs.docker.com → "Install Docker Engine on
Ubuntu"), then `sudo usermod -aG docker deploy` and log in again.

Check: `docker run --rm hello-world`.

## 7. Caddy

Ubuntu's own `caddy` package is too old for `basic_auth` (needs ≥ 2.8) — use Caddy's repository:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
caddy version          # must be v2.8 or newer
```

Copy the config and set the password (DNS from step 2 must already resolve):

```bash
# on your machine:
scp deploy/Caddyfile deploy@<ip>:/tmp/Caddyfile
# on the server:
caddy hash-password                     # type the partner password, copy the $2a$… line
sudo mv /tmp/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile          # replace HASH with that line
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Check: `curl -I https://app.gefahrgut.org` shows `HTTP/2 401` with a valid certificate
(after the password: 502 until step 9). Logs: `journalctl -u caddy -f`.

## 8. App files

```bash
# on the server:
sudo mkdir -p /opt/gefahrgut /etc/gefahrgut /var/lib/gefahrgut && sudo chown deploy /opt/gefahrgut
# on your machine:
scp deploy/compose.yaml deploy@<ip>:/opt/gefahrgut/compose.yaml
scp csvbase/ADR2025-konsolidiert.md deploy@<ip>:/tmp/
# on the server:
sudo mv /tmp/ADR2025-konsolidiert.md /var/lib/gefahrgut/
sudo nano /etc/gefahrgut/app.env            # paste deploy/app.env.example
sudo chmod 600 /etc/gefahrgut/app.env && sudo chown root:root /etc/gefahrgut/app.env
```

Check: `ls -l /var/lib/gefahrgut/` shows the book (> 1 MB).

## 9. First deploy

**Commit first** — the image tag carries the commit hash, and uncommitted changes ship too.

```bash
cp .deploy.env.example .deploy.env   # DEPLOY_HOST=app.gefahrgut.org, DEPLOY_USER=deploy
pnpm deploy:test
```

Check: the script ends with `healthy: <tag>`; `https://app.gefahrgut.org/healthz` (after the
password) shows `ok`.

## 10. Supabase (dashboard)

- Authentication → URL Configuration: add `https://app.gefahrgut.org/**` to the redirect URLs.
- Authentication → Sign In / Providers: disable "Allow new users to sign up".
- Authentication → Users → Add user, tick "Auto Confirm User" — one per tester.
- Table `profiles`: set `activated_at = now()` for each tester.

## 11. Acceptance

As a test user: log in; `/un/1090` shows data; `/regelwerk/adr?sv=243` opens;
`/registrieren` shows the notification form.

## 12. Everyday

- Deploy: `pnpm deploy:test` · roll back: `pnpm deploy:rollback`
- App logs: `ssh deploy@<ip> 'cd /opt/gefahrgut && docker compose logs -f --tail 100'`
- Proxy logs: `journalctl -u caddy -f`
- Another tester: add a line `name <hash>` under `basic_auth`, then `sudo systemctl reload caddy`.
- Go-live (later): remove `basic_auth` and the `X-Robots-Tag` header, set
  `REGISTRATION_MODE=open` in `/etc/gefahrgut/app.env`, then `docker compose up -d` in `/opt/gefahrgut`.
