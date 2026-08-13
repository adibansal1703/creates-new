# Creatory AI - Architecture Diagram

## Overview
Creatory AI is a social media management platform built with TanStack Start (React SSR), Supabase backend, and Node.js background workers.

## Technology Stack

### Frontend
- **Framework**: TanStack Start (React SSR)
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: TanStack Router
- **Language**: TypeScript

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for media)
- **Real-time**: Supabase Realtime

### Background Services
- **Scheduler**: Node.js script for scheduled post publishing
- **Email Worker**: Node.js script with Nodemailer
- **Platform APIs**: Instagram Graph API, Facebook, LinkedIn, X, YouTube

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                    │
│                    (TanStack Start + React SSR)                             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ HTTP/HTTPS
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│                           VITE SERVER                                        │
│                         (SSR + HMR)                                         │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
┌────────▼────────┐                           ┌─────────▼──────────┐
│  React App      │                           │  Server Entry      │
│  (Client Side)  │                           │  (SSR Wrapper)     │
└────────┬────────┘                           └─────────┬──────────┘
         │                                               │
         │                                               │
         │            ┌───────────────────────────────────┘
         │            │
         │    ┌───────▼──────────────────────────────────────────────┐
         │    │              TanStack Router                          │
         │    │         (File-based routing + SSR)                     │
         │    └───────┬──────────────────────────────────────────────┘
         │            │
         │    ┌───────▼──────────────────────────────────────────────┐
         │    │              Route Structure                         │
         │    │  ┌─────────────────────────────────────────────┐   │
         │    │  │ / (Landing Page)                             │   │
         │    │  │ /login (Authentication)                      │   │
         │    │  │ /signup (Registration)                       │   │
         │    │  │ /dashboard (Main Dashboard)                  │   │
         │    │  │ /dashboard/accounts (Connected Accounts)     │   │
         │    │  │ /dashboard/scheduler (Scheduled Posts)        │   │
         │    │  │ /dashboard/publishing (Content Creation)     │   │
         │    │  │ /dashboard/settings (User Settings)          │   │
         │    │  └─────────────────────────────────────────────┘   │
         │    └───────┬──────────────────────────────────────────────┘
         │            │
         │    ┌───────▼──────────────────────────────────────────────┐
         │    │              Components Layer                         │
         │    │  ┌─────────────────────────────────────────────┐   │
         │    │  │ Landing Components (Navbar, Hero, Features)  │   │
         │    │  │ Dashboard Components (Stats, Cards, Lists)   │   │
         │    │  │ Auth Components (Login, Signup forms)        │   │
         │    │  │ UI Components (shadcn/ui primitives)         │   │
         │    │  └─────────────────────────────────────────────┘   │
         │    └───────┬──────────────────────────────────────────────┘
         │            │
         │    ┌───────▼──────────────────────────────────────────────┐
         │    │              Custom Hooks                            │
         │    │  ┌─────────────────────────────────────────────┐   │
         │    │  │ useAuth (Authentication state)               │   │
         │    │  │ useUserProfile (User data)                   │   │
         │    │  │ useScheduledPosts (Post management)          │   │
         │    │  │ useMobile (Responsive utilities)             │   │
         │    │  └─────────────────────────────────────────────┘   │
         │    └───────┬──────────────────────────────────────────────┘
         │            │
         │    ┌───────▼──────────────────────────────────────────────┐
         │    │              API Layer (lib/api/)                     │
         │    │  ┌─────────────────────────────────────────────┐   │
         │    │  │ connected-accounts.ts (Account management)  │   │
         │    │  │ scheduled-posts.ts (Scheduling logic)       │   │
         │    │  │ published-posts.ts (Published content)      │   │
         │    │  │ drafts.ts (Draft management)                │   │
         │    │  │ dashboard.ts (Stats & analytics)            │   │
         │    │  │ notifications.ts (Notification queue)       │   │
         │    │  │ instagram-oauth.functions.ts (Instagram)   │   │
         │    │  └─────────────────────────────────────────────┘   │
         │    └───────┬──────────────────────────────────────────────┘
         │            │
         └────────────┤
                      │
                      │ Supabase Client
                      │
┌─────────────────────▼────────────────────────────────────────────────────┐
│                        SUPABASE BACKEND                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     SUPABASE AUTH                                 │   │
│  │  - User registration/login                                        │   │
│  │  - Email verification                                              │   │
│  │  - Session management                                              │   │
│  │  - OAuth (Instagram)                                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  POSTGRESQL DATABASE                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ Tables:                                                 │    │   │
│  │  │ - profiles (User profiles)                              │    │   │
│  │  │ - connected_accounts (Social media connections)        │    │   │
│  │  │ - drafts (Draft posts)                                  │    │   │
│  │  │ - scheduled_posts (Scheduled content)                   │    │   │
│  │  │ - published_posts (Published content)                   │    │   │
│  │  │ - notification_queue (Email notifications)              │    │   │
│  │  │ - post_media (Media storage references)                │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ Views:                                                  │    │   │
│  │  │ - posts_ready_to_publish (Scheduler query)              │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ Functions:                                              │    │   │
│  │  │ - email_exists() (Email validation)                     │    │   │
│  │  │ - handle_new_user() (Signup trigger)                    │    │   │
│  │  │ - mark_post_published() (Publish callback)             │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ RLS Policies:                                             │    │   │
│  │  │ - Users can only access their own data                   │    │   │
│  │  │ - Service role bypasses RLS for background workers        │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   SUPABASE STORAGE                                 │   │
│  │  - Post media files (images, videos)                              │   │
│  │  - User avatars                                                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────┬────────────────────────────────────────────────────┘
                      │
                      │ Service Role Key
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐        ┌────────▼─────────┐
│  SCHEDULER      │        │  EMAIL WORKER    │
│  (Node.js)      │        │  (Node.js)       │
└───────┬────────┘        └────────┬─────────┘
        │                           │
        │                           │
┌───────▼────────┐        ┌────────▼─────────┐
│  Queries:       │        │  SMTP Server     │
│  - posts_ready  │        │  (Nodemailer)    │
│    _to_publish  │        └──────────────────┘
│  - mark_post    │
│    _published   │
└───────┬────────┘
        │
        │ Instagram Graph API
        │ Facebook API
        │ LinkedIn API
        │ X (Twitter) API
        │ YouTube API
        │
┌───────▼────────┐
│  SOCIAL MEDIA  │
│  PLATFORMS     │
└────────────────┘
```

## Data Flow

### 1. User Authentication Flow
```
User → Login/Signup → Supabase Auth → Email Verification → 
Session Creation → Profile Creation (trigger) → Welcome Notification
```

### 2. Account Connection Flow
```
Dashboard → Connect Account → OAuth Flow (Instagram) / Manual (Others) → 
Store Credentials → connected_accounts Table → Token Validation
```

### 3. Content Creation Flow
```
Dashboard → Create Post → Select Platforms → Upload Media → 
Save as Draft/Schedule → drafts/scheduled_posts Table → 
Notification Queue (if scheduled)
```

### 4. Scheduled Publishing Flow
```
Scheduler (cron) → Query posts_ready_to_publish → 
For each post: Get access token → Publish to Platform API → 
mark_post_published() → Move to published_posts → 
Notification Queue → Email Worker
```

### 5. Email Notification Flow
```
Database Trigger/API → notification_queue Table → 
Email Worker (polls) → Fetch user profile → 
Send via SMTP → Mark processed
```

## Key Components

### Frontend Structure
```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard-specific components
│   ├── landing/        # Landing page components
│   └── ui/             # shadcn/ui components
├── hooks/
│   ├── use-auth.tsx    # Authentication state
│   ├── use-user-profile.tsx
│   ├── use-scheduled-posts.ts
│   └── use-mobile.tsx
├── lib/
│   ├── api/            # API functions
│   ├── supabase/       # Supabase client
│   ├── types/          # TypeScript types
│   ├── validations/    # Zod schemas
│   └── utils.ts
├── routes/
│   ├── __root.tsx      # Root layout
│   ├── index.tsx       # Landing page
│   ├── login.tsx       # Login page
│   ├── signup.tsx      # Signup page
│   └── dashboard/      # Dashboard routes
├── server.ts           # SSR entry point
├── start.ts            # TanStack Start config
└── router.tsx          # Router configuration
```

### Background Scripts
```
scripts/
├── scheduler.js           # Main scheduler logic
├── scheduler-cron.js      # Cron wrapper
├── email-worker.js        # Email notification worker
├── lib/
│   ├── instagram-publish.js  # Instagram publishing
│   └── oauth-helpers.js      # OAuth utilities
└── test-e2e.js           # End-to-end tests
```

### Database Schema
```
Tables:
- profiles: User profiles and settings
- connected_accounts: Social media platform connections
- drafts: Draft posts for multiple platforms
- scheduled_posts: Posts scheduled for future publishing
- published_posts: History of published content
- notification_queue: Email notification queue
- post_media: Media file references

Views:
- posts_ready_to_publish: Optimized query for scheduler

Functions:
- email_exists(): Check if email is registered
- handle_new_user(): Trigger on user signup
- mark_post_published(): Mark post as published and create notification
```

## Environment Variables

### Required
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for background workers)

### Social Media APIs
- `META_APP_ID`: Instagram/Facebook app ID
- `META_APP_SECRET`: Instagram/Facebook app secret
- `META_GRAPH_VERSION`: Graph API version

### Email
- `EMAIL_SMTP_HOST`: SMTP server host
- `EMAIL_SMTP_PORT`: SMTP server port
- `EMAIL_SMTP_USER`: SMTP username
- `EMAIL_SMTP_PASS`: SMTP password
- `EMAIL_FROM`: From email address

### Application
- `API_BASE_URL`: Base URL for API callbacks
- `VITE_*`: Client-side environment variables

## Deployment Architecture

### Development
- Vite dev server with HMR
- Local Supabase instance or development project
- Manual script execution for background workers

### Production
- Vite build output deployed to CDN/hosting
- Supabase production project
- Cron jobs for scheduler (e.g., every 5 minutes)
- Cron jobs for email worker (e.g., every 1 minute)
- Environment-specific configuration

## Security Features

1. **Row Level Security (RLS)**: Users can only access their own data
2. **Service Role Authentication**: Background workers use service role key
3. **PKCE Flow**: Secure OAuth for Instagram
4. **Token Storage**: Access tokens stored securely in database
5. **Token Expiration**: Automatic token expiration handling
6. **Email Verification**: Required for account activation

## Scalability Considerations

1. **Database Indexing**: Optimized indexes on user_id, timestamps, status
2. **Materialized Views**: posts_ready_to_publish for scheduler performance
3. **Batch Processing**: Scheduler processes multiple posts per run
4. **Queue System**: Notification queue for async email sending
5. **CDN Deployment**: Static assets served via CDN
6. **SSR Caching**: TanStack Start caching for improved performance

## Monitoring & Logging

1. **Console Logging**: Extensive logging in background workers
2. **Error Tracking**: Custom error capture for SSR errors
3. **Status Tracking**: Post status updates throughout lifecycle
4. **Failure Handling**: Graceful failure handling with error messages
