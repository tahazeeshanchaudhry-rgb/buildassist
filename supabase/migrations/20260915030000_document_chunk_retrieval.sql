create or replace function public.match_document_chunks(
  query_embedding extensions.vector(3072),
  match_project_id uuid,
  match_count integer default 5,
  similarity_threshold real default 0.65
)
returns table (
  id uuid,
  document_id uuid,
  document_name text,
  project_id uuid,
  content text,
  chunk_index integer,
  page_number integer,
  similarity real
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    chunks.id,
    chunks.document_id,
    documents.name,
    chunks.project_id,
    chunks.content,
    chunks.chunk_index,
    chunks.page_number,
    (1 - (chunks.embedding <=> query_embedding))::real as similarity
  from public.document_chunks as chunks
  join public.documents as documents on documents.id = chunks.document_id
  join public.projects as projects on projects.id = chunks.project_id
  where chunks.user_id = auth.uid()
    and chunks.project_id = match_project_id
    and documents.user_id = auth.uid()
    and documents.status = 'ready'
    and projects.user_id = auth.uid()
    and (1 - (chunks.embedding <=> query_embedding)) >= similarity_threshold
  order by chunks.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 10);
$$;

revoke execute on function public.match_document_chunks(extensions.vector(3072), uuid, integer, real) from public;
grant execute on function public.match_document_chunks(extensions.vector(3072), uuid, integer, real) to authenticated;
