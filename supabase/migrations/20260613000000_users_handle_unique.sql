-- Ensure a UNIQUE constraint on users.handle so /perfil/[handle] resolves to at most one user.
-- Idempotent: the constraint already exists in prod (part of the original users DDL, untracked here),
-- so guard the ADD to keep the migration safe on prod and on fresh environments alike.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_handle_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_handle_key UNIQUE (handle);
  END IF;
END $$;
