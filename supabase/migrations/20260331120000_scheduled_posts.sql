-- Scheduled posts table for Creatory AI post scheduling
-- Run in Supabase SQL Editor or via: supabase db push

-- Platform enum
CREATE TYPE public.post_platform AS ENUM (
  'linkedin',
  'x',
  'instagram',
  'facebook'
);

-- Post lifecycle status
CREATE TYPE public.post_status AS ENUM (
  'scheduled',
  'published',
  'failed',
  'cancelled'
);

CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platform public.post_platform NOT NULL,
  content TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status public.post_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_posts_content_not_empty CHECK (char_length(trim(content)) > 0),
  CONSTRAINT scheduled_posts_scheduled_time_future_on_insert CHECK (scheduled_time > now())
);

COMMENT ON TABLE public.scheduled_posts IS 'Social posts scheduled by users for future publishing';

CREATE INDEX scheduled_posts_user_id_idx ON public.scheduled_posts (user_id);
CREATE INDEX scheduled_posts_scheduled_time_idx ON public.scheduled_posts (scheduled_time);
CREATE INDEX scheduled_posts_status_idx ON public.scheduled_posts (status);

-- Row Level Security
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled posts"
  ON public.scheduled_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled posts"
  ON public.scheduled_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled posts"
  ON public.scheduled_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled posts"
  ON public.scheduled_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow updates to reschedule (relax future-time check on update via app validation)
ALTER TABLE public.scheduled_posts
  DROP CONSTRAINT IF EXISTS scheduled_posts_scheduled_time_future_on_insert;
