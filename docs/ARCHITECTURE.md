# Creatory AI — Production architecture

## Application routes

| Route                   | Purpose                     |
| ----------------------- | --------------------------- |
| `/`                     | Marketing landing           |
| `/signup`               | Registration + verification |
| `/login`                | Authentication              |
| `/dashboard`            | Home + stats                |
| `/dashboard/publishing` | Multi-platform composer     |
| `/dashboard/scheduler`  | Schedule + manage posts     |
| `/dashboard/accounts`   | Social connections          |
| `/dashboard/settings`   | Profile + timezone          |

## Database tables

- **profiles** — user metadata, default timezone
- **connected_accounts** — platform OAuth / connection records
- **drafts** — saved composer state
- **scheduled_posts** — future publishes (scheduler picks up)
- **published_posts** — completed publishes
- **notification_queue** — email jobs for the email worker

## Security

- Row Level Security on all user tables
- `email_exists()` RPC for login UX (limited enumeration risk)
- `mark_post_published()` — service role only
- Anon key in frontend; service role in backend scripts only

## Email notifications

Queued in `notification_queue` on:

- Signup (welcome — via DB trigger)
- Post scheduled (app)
- Post published (`mark_post_published` RPC)

Processed by `scripts/email-worker.js` (`npm run run:email-worker`).
