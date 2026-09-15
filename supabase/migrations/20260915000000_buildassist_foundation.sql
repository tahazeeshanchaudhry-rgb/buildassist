create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'planning', 'on_hold', 'completed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  storage_path text,
  file_type text,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'error')),
  created_at timestamptz default now()
);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

create index projects_user_id_idx on public.projects(user_id);
create index documents_user_id_idx on public.documents(user_id);
create index documents_project_id_idx on public.documents(project_id);
create index chats_user_id_idx on public.chats(user_id);
create index chats_project_id_idx on public.chats(project_id);
create index messages_chat_id_idx on public.messages(chat_id);
create index messages_user_id_idx on public.messages(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger chats_set_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name)
select id, nullif(trim(raw_user_meta_data ->> 'full_name'), '')
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can manage their own projects"
on public.projects for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can manage their own documents"
on public.documents for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.projects
    where projects.id = project_id and projects.user_id = auth.uid()
  )
);

create policy "Users can manage their own chats"
on public.chats for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.projects
    where projects.id = project_id and projects.user_id = auth.uid()
  )
);

create policy "Users can view their own messages"
on public.messages for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.chats
    where chats.id = chat_id and chats.user_id = auth.uid()
  )
);

create policy "Users can create their own messages"
on public.messages for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.chats
    where chats.id = chat_id and chats.user_id = auth.uid()
  )
);

create policy "Users can delete their own messages"
on public.messages for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.chats
    where chats.id = chat_id and chats.user_id = auth.uid()
  )
);
