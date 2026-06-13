-- Add UNIQUE constraint to users.handle so /perfil/[handle] resolves to at most one user.
-- Safe to run: confirmed 0 duplicate handles in prod before this migration.
ALTER TABLE public.users ADD CONSTRAINT users_handle_key UNIQUE (handle);
