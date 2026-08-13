# Supabase setup — Creatory AI

## Run migrations (in order)

1. `migrations/20260331120000_scheduled_posts.sql` (if not already applied)
2. `migrations/20260401000000_production_schema.sql` — **full production schema**

Open **SQL Editor** in Supabase Dashboard → paste → Run.

## Tables

| Table                | Purpose                         |
| -------------------- | ------------------------------- |
| `profiles`           | User profile + timezone         |
| `connected_accounts` | Social platform connections     |
| `drafts`             | Saved composer drafts           |
| `scheduled_posts`    | Posts waiting to publish        |
| `published_posts`    | Published content history       |
| `notification_queue` | Email jobs for the email worker |

## Auth settings

1. **Authentication → Providers → Email** — Enable email confirmations for production.
2. **URL Configuration** — Add redirect URLs derived from your `APP_URL` environment variable:
   - `${APP_URL}/auth/callback`
   - `${APP_URL}/auth/instagram/callback`
   - `${APP_URL}/**` (wildcard for your deployment origin)
3. Customize email templates: Welcome, Confirm signup, Reset password.

Register `${APP_URL}/auth/instagram/callback` in the Meta Developer Console (Facebook Login → Valid OAuth Redirect URIs).

## RLS

All user tables enforce `auth.uid() = user_id`. Service role bypasses RLS for scheduler and email worker scripts.

## Storage

Run `migrations/20260607000000_post_media_storage.sql` in the SQL Editor if not applied. This creates the public `post-media` bucket used for Instagram image uploads.

## Background workers

- `npm run run:scheduler` — one-shot publish of due scheduled posts to Instagram via Meta Graph API
- `npm run run:scheduler:cron` — local cron loop (every 60s by default)
- `npm run run:email-worker` — sends queued emails

For production scheduling, use GitHub Actions (`.github/workflows/scheduler.yml`) or your host's cron to run `npm run run:scheduler` every 1–5 minutes.
