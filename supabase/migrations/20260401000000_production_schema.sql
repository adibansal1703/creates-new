-- Creatory AI production schema
-- Run after 20260331120000_scheduled_posts.sql OR on fresh project (uses IF NOT EXISTS)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (create or extend)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.post_platform AS ENUM (
    'instagram', 'facebook', 'linkedin', 'x', 'youtube'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.post_platform ADD VALUE IF NOT EXISTS 'youtube';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.post_status AS ENUM (
    'draft', 'scheduled', 'published', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'draft';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'welcome',
    'email_verification',
    'post_scheduled',
    'post_published'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Connected accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platform public.post_platform NOT NULL,
  account_name TEXT NOT NULL,
  external_account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS connected_accounts_user_id_idx ON public.connected_accounts (user_id);
ALTER TABLE public.connected_accounts DROP CONSTRAINT IF EXISTS connected_accounts_user_id_platform_key;

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own connected accounts" ON public.connected_accounts;
CREATE POLICY "Users manage own connected accounts"
  ON public.connected_accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Drafts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platforms public.post_platform[] NOT NULL DEFAULT '{}',
  content_payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drafts_user_id_idx ON public.drafts (user_id);

ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own drafts" ON public.drafts;
CREATE POLICY "Users manage own drafts"
  ON public.drafts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Scheduled posts (upgrade existing table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platform public.post_platform NOT NULL,
  content TEXT NOT NULL,
  content_payload JSONB NOT NULL DEFAULT '{}',
  scheduled_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status public.post_status NOT NULL DEFAULT 'scheduled',
  scheduler_job_id TEXT,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS content_payload JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS scheduler_job_id TEXT;
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.scheduled_posts ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS scheduled_posts_user_id_idx ON public.scheduled_posts (user_id);
CREATE INDEX IF NOT EXISTS scheduled_posts_scheduled_time_idx ON public.scheduled_posts (scheduled_time);
CREATE INDEX IF NOT EXISTS scheduled_posts_status_idx ON public.scheduled_posts (status);
CREATE INDEX IF NOT EXISTS scheduled_posts_ready_idx
  ON public.scheduled_posts (scheduled_time)
  WHERE status = 'scheduled';

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can create own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can update own scheduled posts" ON public.scheduled_posts;
DROP POLICY IF EXISTS "Users can delete own scheduled posts" ON public.scheduled_posts;

CREATE POLICY "Users can view own scheduled posts"
  ON public.scheduled_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled posts"
  ON public.scheduled_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled posts"
  ON public.scheduled_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled posts"
  ON public.scheduled_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Published posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.published_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platform public.post_platform NOT NULL,
  content TEXT NOT NULL,
  content_payload JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.post_status NOT NULL DEFAULT 'published',
  external_post_id TEXT,
  scheduled_post_id UUID REFERENCES public.scheduled_posts (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS published_posts_user_id_idx ON public.published_posts (user_id);
CREATE INDEX IF NOT EXISTS published_posts_published_at_idx ON public.published_posts (published_at DESC);

ALTER TABLE public.published_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own published posts" ON public.published_posts;
CREATE POLICY "Users manage own published posts"
  ON public.published_posts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Notification queue (email worker polls this)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_queue_unprocessed_idx
  ON public.notification_queue (created_at)
  WHERE processed_at IS NULL;

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_queue;
CREATE POLICY "Users can view own notifications"
  ON public.notification_queue FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can enqueue own notifications" ON public.notification_queue;
CREATE POLICY "Users can enqueue own notifications"
  ON public.notification_queue FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role updates processed_at via service key (bypasses RLS)

-- ---------------------------------------------------------------------------
-- Auth helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_exists(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(email_input))
  );
$$;

REVOKE ALL ON FUNCTION public.email_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_exists(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profile + welcome notification on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = now();

  INSERT INTO public.notification_queue (user_id, type, payload)
  VALUES (
    NEW.id,
    'welcome',
    jsonb_build_object(
      'email', NEW.email,
      'full_name', COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'there')
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Posts ready to publish (queried by scheduler)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.posts_ready_to_publish AS
SELECT
  sp.id,
  sp.user_id,
  sp.platform,
  sp.content,
  sp.content_payload,
  sp.scheduled_time,
  sp.timezone,
  ca.access_token,
  ca.external_account_id,
  ca.account_name
FROM public.scheduled_posts sp
LEFT JOIN public.connected_accounts ca
  ON ca.user_id = sp.user_id AND ca.platform = sp.platform AND ca.is_connected = true
WHERE sp.status = 'scheduled'
  AND sp.scheduled_time <= now();

GRANT SELECT ON public.posts_ready_to_publish TO service_role;

-- Mark published (callable by scheduler with service role)
CREATE OR REPLACE FUNCTION public.mark_post_published(
  post_id UUID,
  external_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.scheduled_posts%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM public.scheduled_posts WHERE id = post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  UPDATE public.scheduled_posts
  SET status = 'published', published_at = now(), scheduler_job_id = COALESCE(scheduler_job_id, 'done')
  WHERE id = post_id;

  INSERT INTO public.published_posts (
    user_id, platform, content, content_payload, published_at, scheduled_post_id, external_post_id
  ) VALUES (
    rec.user_id, rec.platform, rec.content, rec.content_payload, now(), rec.id, external_id
  );

  INSERT INTO public.notification_queue (user_id, type, payload)
  VALUES (
    rec.user_id,
    'post_published',
    jsonb_build_object(
      'platform', rec.platform,
      'content_preview', left(rec.content, 120),
      'published_at', now()
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_post_published(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_post_published(UUID, TEXT) TO service_role;
