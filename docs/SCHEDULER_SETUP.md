# Scheduler Setup Guide

## Overview

The scheduler automatically publishes scheduled posts to Instagram using GitHub Actions. The scheduler runs every 5 minutes via cron.

## Architecture

### Components

- **scheduler.js**: One-time execution script that processes ready posts
- **scheduler-cron.js**: Local development wrapper with setInterval (for testing)
- **.github/workflows/scheduler.yml**: GitHub Actions workflow for production automation

### How it works

1. Users schedule posts via the Smart Scheduler UI
2. Posts are stored in `scheduled_posts` table with status "scheduled"
3. Database view `posts_ready_to_publish` filters posts where `scheduled_time <= now()`
4. GitHub Actions runs `scheduler.js` every 5 minutes
5. Scheduler fetches ready posts and publishes them via Meta Graph API
6. Published posts are marked with status "published" and external ID

## GitHub Actions Configuration

### Workflow Location

`.github/workflows/scheduler.yml`

### Schedule

Runs every 5 minutes: `cron: "*/5 * * * *"`

Also supports manual trigger via `workflow_dispatch`.

### Required GitHub Secrets

Configure these secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name                 | Description                              | Where to find                          |
| --------------------------- | ---------------------------------------- | -------------------------------------- |
| `SUPABASE_URL`              | Your Supabase project URL                | Supabase Dashboard → Settings → API    |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | Supabase Dashboard → Settings → API    |
| `META_APP_ID`               | Meta/Instagram App ID                    | Meta Developer Dashboard               |
| `META_APP_SECRET`           | Meta/Instagram App Secret                | Meta Developer Dashboard               |
| `META_GRAPH_VERSION`        | Meta Graph API version (e.g., v21.0)     | Meta Developer Dashboard               |
| `API_BASE_URL`              | Meta Graph API base URL                  | Typically `https://graph.facebook.com` |

### Setting up Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value from the table above

## Local Development

### Run scheduler once (for testing)

```bash
npm run run:scheduler
```

### Run scheduler with local cron (for development)

```bash
npm run run:scheduler:cron
```

Default interval: 60 seconds (configurable via `SCHEDULER_INTERVAL_MS` env var)

## Troubleshooting

### Scheduled posts not publishing

1. Check GitHub Actions workflow runs: **Actions** tab in your repository
2. Verify all secrets are configured correctly
3. Check workflow logs for errors
4. Verify scheduled posts have `status = 'scheduled'` and `scheduled_time <= now()`

### Workflow not running

1. Ensure workflow file is pushed to GitHub
2. Check that GitHub Actions is enabled for your repository
3. Verify the cron schedule is correct

### Permission errors

- Ensure `SUPABASE_SERVICE_ROLE_KEY` is used (not anon key)
- Service role key bypasses Row Level Security for scheduler operations

## Database Schema

### Key Tables/Views

- `scheduled_posts`: Stores scheduled posts with status tracking
- `posts_ready_to_publish`: View that filters ready-to-publish posts
- `published_posts`: Stores successfully published posts

### Key Functions

- `mark_post_published(post_id, external_id)`: Marks post as published
- `mark_post_published` function requires service role permissions

## Monitoring

### Check workflow status

- GitHub repository → Actions tab → "Publish scheduled posts" workflow

### Check scheduled posts

Query database for posts with status "scheduled":

```sql
SELECT * FROM scheduled_posts WHERE status = 'scheduled' ORDER BY scheduled_time;
```

### Check ready posts

Query the view that scheduler uses:

```sql
SELECT * FROM posts_ready_to_publish;
```

## Security Notes

- **Never commit secrets to the repository**
- Use service role key only for server-side operations (scheduler)
- Service role key has full database access - keep it secure
- Rotate keys periodically via Supabase Dashboard
