-- Reconcile published posts that were incorrectly marked as failed
-- This migration fixes the critical bug where posts published to Instagram
-- were marked as failed due to database update errors

-- First, identify posts that have external_post_id in published_posts but are marked as failed in scheduled_posts
-- These are posts that were successfully published but the status update failed

-- Update scheduled_posts status to 'published' for posts that exist in published_posts
UPDATE public.scheduled_posts sp
SET 
  status = 'published',
  published_at = COALESCE(sp.published_at, pp.published_at),
  error_message = NULL,
  scheduler_job_id = COALESCE(sp.scheduler_job_id, 'reconciled')
FROM public.published_posts pp
WHERE sp.id = pp.scheduled_post_id
  AND sp.status = 'failed'
  AND pp.external_post_id IS NOT NULL;

-- Log the reconciliation
DO $$
DECLARE
  reconciled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO reconciled_count
  FROM public.scheduled_posts sp
  JOIN public.published_posts pp ON sp.id = pp.scheduled_post_id
  WHERE sp.status = 'published'
    AND sp.scheduler_job_id = 'reconciled';
  
  RAISE NOTICE 'Reconciled % posts from failed to published status', reconciled_count;
END $$;
