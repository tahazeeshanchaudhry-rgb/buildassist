import type { SupabaseClient } from "@supabase/supabase-js";
import { geminiEmbeddings } from "./embeddings";
import type { Database } from "../../../types/database";

export const retrievalConfig = {
  matchCount: 5,
  similarityThreshold: 0.65,
};

export type RetrievedChunk = Database["public"]["Functions"]["match_document_chunks"]["Returns"][number];

export async function retrieveProjectChunks(
  supabase: SupabaseClient<Database>,
  query: string,
  projectId: string,
): Promise<RetrievedChunk[]> {
  const { data: project, error: projectError } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
  if (projectError) throw new Error("Project verification failed");
  if (!project) throw new Error("Project not found");

  const { data: processedDocument, error: documentsError } = await supabase
    .from("documents")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "ready")
    .limit(1)
    .maybeSingle();
  if (documentsError) throw new Error("Processed document check failed");
  if (!processedDocument) return [];

  const queryEmbedding = await geminiEmbeddings.embedQuery(query);
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_project_id: projectId,
    match_count: retrievalConfig.matchCount,
    similarity_threshold: retrievalConfig.similarityThreshold,
  });
  if (error) throw new Error("Document retrieval failed");

  return data ?? [];
}
