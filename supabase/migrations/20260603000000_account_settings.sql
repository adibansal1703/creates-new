-- Add notification types for security events and account deletion requests
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'email_changed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'password_changed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'account_deletion_requested';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table to track deletion requests (user requests deletion, processed by service worker)
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by TEXT,
  status TEXT DEFAULT 'pending',
  reason TEXT
);

CREATE INDEX IF NOT EXISTS deletion_requests_user_id_idx ON public.deletion_requests (user_id);

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own deletion requests" ON public.deletion_requests;
CREATE POLICY "Users manage own deletion requests"
  ON public.deletion_requests FOR INSERT, SELECT
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC for requesting account deletion (creates a deletion request + notification)
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  req_id UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.deletion_requests (user_id)
  VALUES (uid)
  RETURNING id INTO req_id;

  INSERT INTO public.notification_queue (user_id, type, payload)
  VALUES (
    uid,
    'account_deletion_requested',
    jsonb_build_object('request_id', req_id)
  );

  RETURN req_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
