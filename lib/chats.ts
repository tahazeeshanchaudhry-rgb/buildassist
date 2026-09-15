import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, ChatSource } from "../types/chat";
import type { Database, Json } from "../types/database";

export const CHAT_HISTORY_LIMIT = 20;
export type ChatClient = SupabaseClient<Database>;
export type Chat = Database["public"]["Tables"]["chats"]["Row"];

export function createChatTitle(message: string) {
  const title = message.replace(/\s+/g, " ").trim();
  return title.length > 60 ? `${title.slice(0, 57).trimEnd()}...` : title;
}

function parseSources(value: Json | null): ChatSource[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const sources = value.filter((source): source is Record<string, Json | undefined> => typeof source === "object" && source !== null && !Array.isArray(source)).filter((source) => typeof source.documentId === "string" && typeof source.documentName === "string" && typeof source.chunkIndex === "number");
  return sources.map((source) => ({ documentId: source.documentId as string, documentName: source.documentName as string, chunkIndex: source.chunkIndex as number, pageNumber: typeof source.pageNumber === "number" ? source.pageNumber : null, similarity: typeof source.similarity === "number" ? source.similarity : undefined }));
}

export function toChatMessages(rows: Database["public"]["Tables"]["messages"]["Row"][]): ChatMessage[] {
  const chatRows = rows.filter((row): row is Database["public"]["Tables"]["messages"]["Row"] & { role: "user" | "assistant" } => row.role === "user" || row.role === "assistant");
  return chatRows.map((row) => ({ id: row.id, role: row.role, content: row.content, sources: parseSources(row.sources) }));
}

export async function listChats(client: ChatClient, projectId: string) {
  return client.from("chats").select("*").eq("project_id", projectId).order("updated_at", { ascending: false });
}
