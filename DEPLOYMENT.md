# ImageSpace — Production Deployment & Operations Runbook

This guide outlines the production deployment, infrastructure provisioning, and operational maintenance for **ImageSpace**.

---

## 1. System Architecture & Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Database**: PostgreSQL 15+ (Hosted on Neon, Supabase, AWS RDS, or Railway)
- **ORM**: Prisma Client v7
- **Object Storage**: Cloudflare R2 (S3-compatible, Zero Egress Fees)
- **Authentication**: Credentials & Google OAuth (Encrypted Session Cookies)
- **Image Processing**: Sharp (High-performance WebP thumbnail generator & metadata extractor)
- **Background Jobs**: Automated maintenance runner (`/api/v1/jobs/run`) protected via `CRON_SECRET`

---

## 2. Environment Variables Configuration

Ensure the following environment variables are securely provisioned in your production hosting platform (e.g. Vercel, Railway, Fly.io, AWS Amplify):

| Variable | Required | Description | Example / Recommendation |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public&sslmode=require` |
| `AUTH_SECRET` | **Yes** | 32+ character cryptographic secret for session tokens | Generate with `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Canonical public URL of the application | `https://imagespace.app` |
| `CRON_SECRET` | **Yes** | Secret bearer token protecting `/api/v1/jobs/run` | Generate with `openssl rand -hex 24` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| Optional | Google OAuth client secret | `GOCSPX-xxxxxx` |
| `SMTP_HOST` | **Yes** | SMTP relay server hostname | `smtp.sendgrid.net` / `email-smtp.us-east-1.amazonaws.com` |
| `SMTP_PORT` | **Yes** | SMTP port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | **Yes** | SMTP authentication username | `apikey` |
| `SMTP_PASSWORD` | **Yes** | SMTP authentication password/token | Secret SMTP key |
| `SMTP_FROM` | **Yes** | Verified sender email address | `ImageSpace <noreply@imagespace.app>` |
| `R2_ACCOUNT_ID` | **Yes** | Cloudflare account ID | Found in Cloudflare Dashboard |
| `R2_ACCESS_KEY_ID` | **Yes** | Cloudflare R2 S3 access key | R2 API Token settings |
| `R2_SECRET_ACCESS_KEY`| **Yes** | Cloudflare R2 S3 secret access key | R2 API Token settings |
| `R2_BUCKET_NAME` | **Yes** | Name of the R2 bucket | `imagespace-production` |
| `R2_PUBLIC_DOMAIN` | Optional | Public CDN domain for high-speed serving | `https://cdn.imagespace.app` |

---

## 3. Database Migration & Provisioning

Before starting the web service, execute Prisma migrations against your production database:

```bash
# 1. Generate the Prisma Client
npx prisma generate

# 2. Push schema or apply migrations
npx prisma db push
# OR for migration history:
npx prisma migrate deploy
```

> [!TIP]
> If using serverless connection pools (e.g., Supabase Transaction Pooler, Prisma Data Proxy, or PgBouncer), ensure `?pgbouncer=true&connection_limit=10` is appended to your connection string.

---

## 4. Cloudflare R2 CORS Configuration

To allow direct client-side uploads (zero server bandwidth consumption), add this CORS policy to your Cloudflare R2 bucket:

1. Navigate to **Cloudflare Dashboard &rarr; R2 &rarr; `<your-bucket>` &rarr; Settings &rarr; CORS Policy**.
2. Save the following JSON rule:

```json
[
  {
    "AllowedOrigins": [
      "https://imagespace.app",
      "https://*.imagespace.app",
      "http://localhost:3001"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 5. Automated Background Maintenance Jobs

ImageSpace includes an automated maintenance worker endpoint at `POST /api/v1/jobs/run`.
It performs:
1. **Orphaned Upload Cleanup**: Removes uploads stuck in `PENDING` or `PROCESSING` for $>2$ hours, and `FAILED` uploads older than 24 hours.
2. **Expired Invitation Reconciliation**: Marks pending invitations older than 7 days as `EXPIRED`.
3. **Permanent Trash Purge**: Purges images that have been in the Trash for $>30$ days, deletes binaries from Cloudflare R2, releases user/workspace storage quota, and creates audit records.

### Option A: Vercel Cron (`vercel.json`)
If hosting on Vercel, add a `vercel.json` file in the project root:
```json
{
  "crons": [
    {
      "path": "/api/v1/jobs/run",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Option B: External Cron / Linux Crontab
```bash
# Run daily at 02:00 UTC
0 2 * * * curl -X POST https://imagespace.app/api/v1/jobs/run \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Option C: GitHub Actions Scheduled Workflow
```yaml
name: Maintenance Jobs
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  run-maintenance:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Job Runner
        run: |
          curl -f -X POST "${{ secrets.PROD_URL }}/api/v1/jobs/run" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## 6. System Health Monitoring

ImageSpace provides a production health check endpoint:
```
GET /api/v1/health
```
- **Operational (200 OK)**:
  ```json
  {
    "data": {
      "status": "healthy",
      "database": "connected",
      "latencyMs": 4,
      "service": "ImageSpace API",
      "version": "v1",
      "timestamp": "2026-09-10T12:00:00.000Z"
    }
  }
  ```
- **Service Degraded (503 Service Unavailable)**:
  ```json
  {
    "error": {
      "code": "SERVICE_UNAVAILABLE",
      "message": "Database probe failed or service connection unreachable"
    }
  }
  ```

Hook this endpoint up to your uptime monitoring service (Better Uptime, Datadog, UptimeRobot, or Pingdom).

---

## 7. Security & Pre-Flight Verification Checklist

Before opening the platform to public users, verify:
- [x] **Strict Transport Security (HSTS)** and clickjacking prevention (`X-Frame-Options: DENY`) are active via `next.config.ts`.
- [x] **Sliding-window rate limits** active across registration, password resets, email verification, invitations, and upload presigns.
- [x] **Binary magic bytes detector** validates JPEG, PNG, GIF, WebP, and HEIC signatures before processing buffers with Sharp.
- [x] **Quota enforcement**: 500 MB total account storage limit and 2 owned workspaces cap verified.
- [x] **Zero-Trust Access Control**: Workspace membership and role (`OWNER`, `EDITOR`, `VIEWER`) checked on every single endpoint.
- [x] **64 Automated Invariant Tests** passing via `npm test`.
