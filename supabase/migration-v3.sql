-- migration-v3.sql: Friend tags & availability visibility
-- Run this in Supabase SQL Editor

-- 1. friend_tags table (ユーザーが作るタグ、上限10個はアプリ側で制御)
create table if not exists public.friend_tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  constraint friend_tags_name_length check (char_length(name) between 1 and 20)
);

create index if not exists friend_tags_user_id_idx on public.friend_tags(user_id);

alter table public.friend_tags enable row level security;

create policy "Users can view own tags"
  on public.friend_tags for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own tags"
  on public.friend_tags for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own tags"
  on public.friend_tags for delete
  to authenticated
  using (auth.uid() = user_id);

-- 2. friend_tag_members table (タグに誰が入るか)
create table if not exists public.friend_tag_members (
  tag_id uuid references public.friend_tags(id) on delete cascade not null,
  friend_user_id uuid references public.profiles(id) on delete cascade not null,
  primary key (tag_id, friend_user_id)
);

alter table public.friend_tag_members enable row level security;

-- タグオーナーは全メンバーを見られる、自分が含まれているタグも確認できる（公開範囲チェックに必要）
create policy "Tag owners and members can view tag memberships"
  on public.friend_tag_members for select
  to authenticated
  using (
    exists (
      select 1 from public.friend_tags
      where id = tag_id and user_id = auth.uid()
    )
    or friend_user_id = auth.uid()
  );

create policy "Tag owners can add members"
  on public.friend_tag_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.friend_tags
      where id = tag_id and user_id = auth.uid()
    )
  );

create policy "Tag owners can remove members"
  on public.friend_tag_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.friend_tags
      where id = tag_id and user_id = auth.uid()
    )
  );

-- 3. Add visibility columns to availabilities
alter table public.availabilities
  add column if not exists visibility text not null default 'all' check (visibility in ('all', 'tags')),
  add column if not exists visibility_tag_ids uuid[] default null;

-- 4. Replace the permissive availabilities SELECT policy with one that respects visibility
drop policy if exists "Authenticated users can view availabilities" on public.availabilities;

create policy "Users can view relevant availabilities"
  on public.availabilities for select
  to authenticated
  using (
    -- 自分の投稿は常に見える
    auth.uid() = user_id
    or (
      -- フレンドの投稿
      exists (
        select 1 from public.friendships
        where status = 'accepted'
        and (
          (requester_id = user_id and addressee_id = auth.uid())
          or (addressee_id = user_id and requester_id = auth.uid())
        )
      )
      and (
        -- 公開範囲 ALL の場合は全フレンドに見える
        visibility = 'all'
        -- タグ絞り込みの場合は自分がそのタグに含まれている場合のみ
        or exists (
          select 1 from public.friend_tag_members ftm
          where ftm.tag_id = any(visibility_tag_ids)
          and ftm.friend_user_id = auth.uid()
        )
      )
    )
  );
