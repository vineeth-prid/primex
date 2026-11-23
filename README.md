# PRIMEX Digital Job Card

Tablet-first replacement for the paper job card at PRIMEX Tinting & Protection Centre.
Next.js 16 · PostgreSQL (Drizzle) · S3-compatible storage (MinIO) · PDFKit · Docker Compose.

## How it works

| Who | Does |
|---|---|
| Staff | **New Job Card** → customer & vehicle → inspection (diagram ✓ marks, fuel, condition ticks, notes) → photos → terms (EN/AR) + customer signature → **Save** → Download / Share via WhatsApp |
| Staff | **Delivery** → find the open card by plate/number → Time Car Out, Delivered By, customer signs Box 2 → final PDF |
| Admin | **Dashboard** → totals (today / week (Sun–Sat) / month, Qatar time), search, date/month/status filters, pagination, view, PDFs, amendments |

- Card numbers: `PMX-YYYY-00001`, sequential per year (DB counter, gap-free unless a save fails).
- Drafts autosave on the tablet (IndexedDB, photos included) and survive refresh.
- Double-tap / retry safe: each draft has a `clientRef`; the server returns the existing card instead of creating a duplicate.
- **Immutability:** the check-in PDF is generated once at save and stored with a SHA-256; downloads serve the stored file. A Postgres trigger blocks any change to check-in data and any delete; delivery data can be written once. Corrections go in **Amendments** (append-only).
- Terms: 26 clauses from the certified translation, `src/lib/terms.ts`, versioned by `TERMS_VERSION` (bump it on any wording change).
- Files are private: photos/PDFs are served only through authenticated routes (`/api/jobcards/...`); the bucket is never public.

## Local development

```bash
cp .env.example .env.local      # point DATABASE_URL/S3_* at localhost, set SESSION_SECRET
docker compose -f docker-compose.dev.yml up -d
npm install
node --env-file=.env.local scripts/migrate.mjs
ADMIN_USERNAME=admin ADMIN_PASSWORD=... STAFF_USERNAME=staff STAFF_PASSWORD=... node --env-file=.env.local scripts/setup-users.mjs
npm run dev
```

End-to-end check (creates real cards — dev/staging only):
```bash
node --env-file=.env.local scripts/smoke-test.mjs http://localhost:3000
```

> Keep the project **outside OneDrive/Dropbox** when building — sync clients lock/delete files in `.next/`.

## Production (single VPS)

1. Install Docker + Compose. Point the DNS A record for `DOMAIN` at the VPS. Open only ports 80/443.
2. `git clone` to `/opt/jobcard`, `cp .env.example .env`, fill every value (long random passwords; `openssl rand -base64 48` for `SESSION_SECRET`). `DATABASE_URL` must use the same user/password as `POSTGRES_*`.
3. First TLS certificate (before nginx starts):
   ```bash
   docker run --rm -p 80:80 -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly --standalone -d $DOMAIN --agree-tos -m you@example.com -n
   ```
   Renewal (cron, monthly): `docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v jobcard_certbot-www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot && docker compose exec nginx nginx -s reload`
4. `docker compose up -d --build` — the app container applies migrations and creates the private bucket on every start.
5. Create the two accounts (one admin, one staff), then delete the `*_PASSWORD` lines from `.env`:
   ```bash
   docker compose run --rm app node scripts/setup-users.mjs
   ```
   Re-run the same command to rotate a password.
6. Logs: `docker compose logs -f app` (rotated, 5×10 MB per service). Health: `GET /api/health`.

### Backups
`scripts/backup.sh` dumps Postgres and copies the MinIO data. Schedule it nightly with cron and **sync `./backups` to storage outside this VPS** (e.g. `rclone sync backups remote:primex-backups`).
Restore: `docker compose exec -T db pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --clean < backups/db-XXXX.dump`, and copy `backups/minio/` back into the `miniodata` volume with MinIO stopped.

### Object storage
MinIO stopped publishing binaries/Docker images and archived its repository in 2026, so `minio.Dockerfile` builds the **final community release** (`RELEASE.2025-10-15T17-29-55Z`) from source. It works, but will get no further security fixes. Because MinIO is never exposed publicly the risk is limited; to switch later, point `S3_ENDPOINT`/keys at any S3-compatible store (AWS S3, Cloudflare R2, Garage, SeaweedFS) — no code changes (`src/lib/storage.ts`).

## Layout

```
src/lib/terms.ts      job-card labels + 26 T&C clauses (EN/AR) + version
src/lib/pdf.ts        PDF layout (front of card, photos, T&C; Arabic RTL)
src/lib/jobcards.ts   validation, numbering, save, delivery, queries
src/lib/auth.ts       scrypt passwords, HMAC-signed session cookie, login throttle
src/lib/storage.ts    S3 client (MinIO / S3)
src/db/schema.ts      tables; drizzle/0000_init.sql adds pg_trgm + immutability triggers
src/components/       JobCardForm, DeliveryForm, SignaturePad, SavedCard (share), TermsView
scripts/              migrate, setup-users, smoke-test, backup
```

## Known limits
- Arabic text in the PDF is wrapped by a small custom routine (pdfkit has no bidi); mixed Arabic + Latin in one sentence may order oddly. The Arabic delivery acknowledgement (Box 2) is an in-house translation — the certified translation covers check-in only — please have it verified.
- Login throttle is in-memory (single app instance).
