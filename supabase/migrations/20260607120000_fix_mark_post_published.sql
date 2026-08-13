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
  SET
    status = 'published',
    published_at = now(),
    scheduler_job_id = COALESCE(scheduler_job_id, 'done'),
    error_message = NULL
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
