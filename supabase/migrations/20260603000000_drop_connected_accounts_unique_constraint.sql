-- Remove stale unique constraint preventing multiple connections per platform for a single user.
ALTER TABLE public.connected_accounts
  DROP CONSTRAINT IF EXISTS connected_accounts_user_id_platform_key;

DROP INDEX IF EXISTS connected_accounts_user_id_platform_key;

-- Add a uniqueness rule for real external account identifiers while allowing multiple placeholder or null-account connections.
CREATE UNIQUE INDEX IF NOT EXISTS connected_accounts_user_id_platform_external_account_id_key
  ON public.connected_accounts (user_id, platform, external_account_id);
