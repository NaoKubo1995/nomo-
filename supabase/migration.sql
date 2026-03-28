-- nomo! Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  invite_code text unique not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Friendships table
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted')) default 'pending' not null,
  created_at timestamptz default now() not null,
  unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

-- Friendships policies
create policy "Users can view their friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can create friend requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id);

create policy "Users can update friendships they're part of"
  on public.friendships for update
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can delete friendships they're part of"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Availabilities table
create table if not exists public.availabilities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  message text,
  created_at timestamptz default now() not null
);

alter table public.availabilities enable row level security;

-- Availabilities policies
create policy "Authenticated users can view availabilities"
  on public.availabilities for select
  to authenticated
  using (true);

create policy "Users can create own availabilities"
  on public.availabilities for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own availabilities"
  on public.availabilities for delete
  to authenticated
  using (auth.uid() = user_id);

-- Hangouts table (Phase 2)
create table if not exists public.hangouts (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  max_people int not null default 4,
  created_at timestamptz default now() not null
);

alter table public.hangouts enable row level security;

create policy "Authenticated users can view hangouts"
  on public.hangouts for select
  to authenticated
  using (true);

create policy "Users can create hangouts"
  on public.hangouts for insert
  to authenticated
  with check (auth.uid() = creator_id);

create policy "Users can delete own hangouts"
  on public.hangouts for delete
  to authenticated
  using (auth.uid() = creator_id);

-- Hangout participants table (Phase 2)
create table if not exists public.hangout_participants (
  hangout_id uuid references public.hangouts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  primary key (hangout_id, user_id)
);

alter table public.hangout_participants enable row level security;

create policy "Authenticated users can view participants"
  on public.hangout_participants for select
  to authenticated
  using (true);

create policy "Users can join hangouts"
  on public.hangout_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can leave hangouts"
  on public.hangout_participants for delete
  to authenticated
  using (auth.uid() = user_id);

-- Enable Realtime for availabilities
alter publication supabase_realtime add table public.availabilities;
