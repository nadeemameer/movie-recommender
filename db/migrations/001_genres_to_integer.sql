-- Migration: convert favorite_genres and favorite_actors from text[] to integer[]
-- Run this in the Supabase SQL Editor if you applied schema.sql before Phase 4.
--
-- Safe because:
--   - The preferences table is empty at this point (no rows saved yet).
--   - PostgreSQL casts text[]::integer[] element-wise; with zero rows it's a no-op.

alter table public.preferences
  alter column favorite_genres type integer[]
  using favorite_genres::integer[];

alter table public.preferences
  alter column favorite_actors type integer[]
  using favorite_actors::integer[];
