# Mahida Digital production deployment

## Required environment variables

Copy the variable names from `.env.example` into the hosting provider. Never commit real credentials.

Required:

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: long random signing secret for sessions.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: SMTP credentials used to send OTP emails.
- `SMTP_FROM`: sender identity, for example `Mahida Digital <no-reply@example.com>`.

## Production sequence

Run commands from `mahida-digital-website-blueprint/`.

```bash
npm install
npm run db:migrate
npm run typecheck
npm run lint
npm run build
npm start
```

The migration runner applies `drizzle/*.sql` in filename order and records checksums in the `mahida_migrations` table. Applied SQL files must never be edited; add a new numbered migration instead.

## PostgreSQL

Use a managed PostgreSQL instance with backups enabled. Create a dedicated application database/user and grant only the privileges required by this application.

For production deploys, run migrations exactly once as a release/deploy step before routing traffic to the new application version. Do not use `db:push` against production.

## Authentication

Sessions are signed JWTs stored in the HttpOnly `mahida_session` cookie. Production HTTPS causes the cookie to be marked `Secure`.

Before launch:

1. Set a strong `JWT_SECRET`.
2. Verify SMTP delivery using a real mailbox.
3. Register and verify a test user.
4. Promote the intended administrator account to role `admin` in PostgreSQL.
5. Confirm `/admin` rejects normal users and allows only verified admins.

## CI

`.github/workflows/production-check.yml` starts PostgreSQL 16, applies migrations, then runs TypeScript checking, ESLint, and the Next.js production build.
