-- Add last_seen_feed_at to profiles for unread badge tracking
alter table public.profiles
  add column if not exists last_seen_feed_at timestamptz default now();
