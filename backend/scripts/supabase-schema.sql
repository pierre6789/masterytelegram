create table if not exists public.live_data_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists live_data_state_updated_at_idx
  on public.live_data_state (updated_at desc);

create table if not exists public.platform_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists platform_state_updated_at_idx
  on public.platform_state (updated_at desc);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  title text not null,
  description text not null default '',
  thumbnail text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  title text not null,
  thumbnail text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists modules_course_id_sort_order_idx
  on public.modules (course_id, sort_order asc);

create table if not exists public.lessons (
  id text primary key,
  module_id text not null references public.modules (id) on delete cascade,
  title text not null,
  video_url text not null default '',
  content text not null default '',
  duration text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lessons_module_id_sort_order_idx
  on public.lessons (module_id, sort_order asc);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists lesson_progress_user_id_idx
  on public.lesson_progress (user_id);

create table if not exists public.affiliate_codes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliate_codes_code_idx
  on public.affiliate_codes (code);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.affiliate_codes enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists courses_select_all on public.courses;
create policy courses_select_all on public.courses
  for select
  to authenticated
  using (true);

drop policy if exists modules_select_all on public.modules;
create policy modules_select_all on public.modules
  for select
  to authenticated
  using (true);

drop policy if exists lessons_select_all on public.lessons;
create policy lessons_select_all on public.lessons
  for select
  to authenticated
  using (true);

drop policy if exists lesson_progress_select_self on public.lesson_progress;
create policy lesson_progress_select_self on public.lesson_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists lesson_progress_insert_self on public.lesson_progress;
create policy lesson_progress_insert_self on public.lesson_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists lesson_progress_delete_self on public.lesson_progress;
create policy lesson_progress_delete_self on public.lesson_progress
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists affiliate_codes_select_self on public.affiliate_codes;
create policy affiliate_codes_select_self on public.affiliate_codes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists affiliate_codes_upsert_self on public.affiliate_codes;
create policy affiliate_codes_upsert_self on public.affiliate_codes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists affiliate_codes_update_self on public.affiliate_codes;
create policy affiliate_codes_update_self on public.affiliate_codes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
