create extension if not exists vector with schema extensions;

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,
  chunk_index integer not null check (chunk_index >= 0),
  page_number integer check (page_number is null or page_number > 0),
  embedding extensions.vector(3072) not null,
  created_at timestamptz default now(),
  unique (document_id, chunk_index)
);

create index document_chunks_user_id_idx on public.document_chunks(user_id);
create index document_chunks_project_id_idx on public.document_chunks(project_id);
create index document_chunks_document_id_idx on public.document_chunks(document_id);

alter table public.document_chunks enable row level security;

create policy "Users can view their own document chunks"
on public.document_chunks for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.documents
    where documents.id = document_id and documents.user_id = auth.uid()
  )
);

create policy "Users can create their own document chunks"
on public.document_chunks for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.documents
    where documents.id = document_id
      and documents.user_id = auth.uid()
      and documents.project_id = project_id
  )
);

create policy "Users can delete their own document chunks"
on public.document_chunks for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.documents
    where documents.id = document_id and documents.user_id = auth.uid()
  )
);
