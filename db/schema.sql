-- ShowUp2Move — Supabase schema
-- Run in Supabase SQL editor, then enable Realtime for `messages` and `invitations`.

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  description text default '',
  age int,
  city text default '',
  gender text default '',
  sports text[] not null default '{}',
  skill_level text not null default '',
  available_today boolean not null default false,
  created_at timestamptz not null default now()
);

-- groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  captain_id uuid not null references public.profiles(id) on delete cascade,
  members uuid[] not null default '{}',
  status text not null default 'open',
  location text,
  event_time text,
  max_size int not null default 10,
  created_at timestamptz not null default now()
);

create index if not exists groups_sport_status_idx on public.groups (sport, status);

-- messages (group chat)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_group_idx on public.messages (group_id, created_at);

-- invitations (player-to-player invites)
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  group_id uuid references public.groups(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now()
);

create index if not exists invitations_to_idx on public.invitations (to_user_id, status, created_at desc);

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.invitations;

-- RLS (tighten before production)
alter table public.profiles      enable row level security;
alter table public.groups        enable row level security;
alter table public.messages      enable row level security;
alter table public.invitations   enable row level security;

create policy "profiles read"   on public.profiles    for select using (true);
create policy "profiles update" on public.profiles    for update using (auth.uid() = id);
create policy "profiles insert" on public.profiles    for insert with check (auth.uid() = id);

create policy "groups read"     on public.groups      for select using (true);
create policy "groups write"    on public.groups      for all   using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "messages read"   on public.messages    for select using (auth.uid() = any(
  (select members from public.groups where id = messages.group_id)
));
create policy "messages insert" on public.messages    for insert with check (auth.uid() = user_id and auth.uid() = any(
  (select members from public.groups where id = group_id)
));

create policy "invites read"    on public.invitations for select using (auth.uid() in (from_user_id, to_user_id));
create policy "invites insert"  on public.invitations for insert with check (auth.uid() = from_user_id);
create policy "invites update"  on public.invitations for update using (auth.uid() = to_user_id);
