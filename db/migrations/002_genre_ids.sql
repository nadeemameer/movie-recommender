-- Migration 002: store genre_ids on saved movies so the recommender can
-- read the user's taste profile from their ratings without extra TMDB calls.
--
-- Safe to run on existing data — adds the column with an empty default.

alter table public.recommendations
  add column if not exists genre_ids integer[] default '{}';
