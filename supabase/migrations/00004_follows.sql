-- Follows table: user-to-user follows (works for both trainers and regular users)
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_no_self check (follower_id != following_id),
  constraint follows_unique unique (follower_id, following_id)
);

create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);

-- Add follower/following counts to profiles
alter table public.profiles
  add column if not exists follower_count integer not null default 0,
  add column if not exists following_count integer not null default 0;

-- Auto-update counts on follow/unfollow
create or replace function update_follow_counts()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set follower_count = follower_count + 1 where id = NEW.following_id;
    update public.profiles set following_count = following_count + 1 where id = NEW.follower_id;
    -- Also update creators.follower_count if the followed user is a creator
    update public.creators set follower_count = follower_count + 1
      where user_id = NEW.following_id;
    return NEW;
  elsif (tg_op = 'DELETE') then
    update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = OLD.following_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = OLD.follower_id;
    update public.creators set follower_count = greatest(follower_count - 1, 0)
      where user_id = OLD.following_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_follow_change
  after insert or delete on public.follows
  for each row execute function update_follow_counts();

-- RLS
alter table public.follows enable row level security;

-- Anyone can see follows
create policy "follows_select" on public.follows
  for select using (true);

-- Users can follow/unfollow (insert/delete their own follows)
create policy "follows_insert" on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "follows_delete" on public.follows
  for delete using (auth.uid() = follower_id);

-- Convenience RPCs
create or replace function get_follower_count(p_user_id uuid)
returns integer
language sql stable security definer as $$
  select coalesce((select follower_count from public.profiles where id = p_user_id), 0);
$$;

create or replace function get_following_count(p_user_id uuid)
returns integer
language sql stable security definer as $$
  select coalesce((select following_count from public.profiles where id = p_user_id), 0);
$$;

create or replace function is_following(p_follower_id uuid, p_following_id uuid)
returns boolean
language sql stable security definer as $$
  select exists(select 1 from public.follows where follower_id = p_follower_id and following_id = p_following_id);
$$;
