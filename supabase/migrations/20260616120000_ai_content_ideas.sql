-- AI Content Ideas table for storing generated content ideas
-- Run in Supabase SQL Editor or via: supabase db push

CREATE TABLE public.ai_content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  goal TEXT NOT NULL,
  emotion TEXT NOT NULL DEFAULT 'Default',
  generated_content_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_content_ideas IS 'AI-generated content ideas for Instagram posts';

CREATE INDEX ai_content_ideas_user_id_idx ON public.ai_content_ideas (user_id);
CREATE INDEX ai_content_ideas_created_at_idx ON public.ai_content_ideas (created_at);

-- Row Level Security
ALTER TABLE public.ai_content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI content ideas"
  ON public.ai_content_ideas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI content ideas"
  ON public.ai_content_ideas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI content ideas"
  ON public.ai_content_ideas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
