-- Movie Recommender — Supabase schema
-- Run this in the Supabase Dashboard → SQL Editor → New query, or via the Supabase CLI.
--
-- We do NOT create a `users` table. Supabase Auth manages users in `auth.users`.
-- Our app tables reference `auth.users(id)` (UUID).

------------------------------------------------------------
-- 1. preferences
------------------------------------------------------------
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  favorite_genres integer[] default '{}',
  favorite_actors integer[] default '{}',
  min_rating numeric(3,1) default 0,
  year_min integer,
  year_max integer,
  max_duration integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

create index if not exists idx_preferences_user on public.preferences(user_id);

------------------------------------------------------------
-- 2. recommendations  (saved / favorited items)
------------------------------------------------------------
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,                -- TMDB id (string for safety)
  item_type text not null default 'movie',
  title text not null,
  poster_path text,
  genre_ids integer[] default '{}',     -- TMDB genre IDs of this movie (Phase 7)
  score numeric(5,2),
  saved_at timestamptz default now(),
  user_rating integer check (user_rating between 1 and 5),
  user_review text
);

create index if not exists idx_recommendations_user on public.recommendations(user_id);
create unique index if not exists uniq_user_item
  on public.recommendations(user_id, item_id, item_type);

------------------------------------------------------------
-- 3. Row Level Security
--    Each user can read/write ONLY their own rows.
------------------------------------------------------------
alter table public.preferences enable row level security;
alter table public.recommendations enable row level security;

drop policy if exists "preferences are owner-only" on public.preferences;
create policy "preferences are owner-only"
  on public.preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "recommendations are owner-only" on public.recommendations;
create policy "recommendations are owner-only"
  on public.recommendations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
