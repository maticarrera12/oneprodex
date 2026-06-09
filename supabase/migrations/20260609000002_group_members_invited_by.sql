-- Migration: add invited_by column to group_members
-- Nullable UUID FK → users(id). Existing rows receive NULL.

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL NULL;
