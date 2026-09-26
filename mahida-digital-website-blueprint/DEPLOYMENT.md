# Mahida Digital production deployment

Mahida Digital is designed so the application, PostgreSQL database, and email provider can live on different services. The source code stays in GitHub and no provider-specific secret belongs in the repository.

## Required environment variables

Copy the variable names from `.env.example` into the hosting platform. Never commit real credentials.

Required at runtime:

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: long random signing secret for sessions.
- `RESEND_API_KEY`: API key used to deliver OTP email over HTTPS.
- `EMAIL_FROM`: verified sender identity, for example `Mahida Digital <no-reply@example.com>`.

`PORT` and `HOSTNAME` are optional. Most platforms provide them automatically.

## Standard deployment sequence

Run commands from `mahida-digital-website-blueprint/`.

```bash
npm install
npm run db:migrate
npm run typecheck
npm run lint
npm run build
npm start
```

The migration runner applies `drizzle/*.sql` in filename order and stores checksums in `mahida_migrations`. Never edit an SQL migration after it has been applied; add a new numbered migration instead.

Do not use `db:push` against production.

## Health check

The application exposes:

```text
GET /api/health
```

A healthy instance returns HTTP 200 only when the application is running and PostgreSQL answers a simple query. Configure hosting health checks to use this path when supported.

## Email

OTP email is sent through the Resend HTTPS API rather than raw SMTP. This works on platforms that block outbound SMTP and keeps the application portable across Railway, Vercel, Cloudflare-compatible Node hosting, Docker, and VPS deployments.

Before launch, verify the sender domain with the email provider and set both `RESEND_API_KEY` and `EMAIL_FROM`.

## PostgreSQL

Use a managed PostgreSQL service with backups enabled, or run PostgreSQL on infrastructure you administer. Create a dedicated database/user for Mahida.

Run migrations once as a release/pre-deploy step before routing traffic to a new application version.

## Docker

The repository includes a multi-stage `Dockerfile` using Next.js standalone output.

Build:

```bash
docker build -t mahida-digital .
```

Run:

```bash
docker run --rm -p 3000:3000 \
  --env-file .env.production \
  mahida-digital
```

Before starting a new production image, run the migration command against the same `DATABASE_URL`.

## VPS pattern

A simple VPS deployment can use:

```text
Internet
  -> HTTPS reverse proxy (Nginx/Caddy)
  -> Mahida Docker container :3000
  -> PostgreSQL
```

Recommended VPS workflow:

1. Install Docker and a reverse proxy.
2. Clone the GitHub repository.
3. Create a server-only environment file containing production secrets.
4. Build the image.
5. Run `npm run db:migrate` (or the migration script from a release container).
6. Start the application container.
7. Proxy the domain to port 3000.
8. Enable HTTPS.
9. Configure `/api/health` as the health endpoint.

## Authentication launch checklist

1. Set a strong `JWT_SECRET`.
2. Verify OTP email delivery using a real mailbox.
3. Register and verify a test user.
4. Promote the intended administrator account to role `admin` in PostgreSQL.
5. Confirm `/admin` rejects normal users and allows only verified admins.

## CI

`.github/workflows/production-check.yml` starts PostgreSQL 16, applies migrations, runs TypeScript checking and ESLint, builds Next.js for production, and verifies the Docker image can be built.
