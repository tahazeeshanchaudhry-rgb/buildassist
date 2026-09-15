import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { constructionAssistantPrompt } from "./prompts";
import { geminiModel } from "./model";
import { buildRagContext } from "./rag/context";
import { retrieveProjectChunks } from "./rag/retriever";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";
import type { ChatMessage } from "../../types/chat";

const constructionModelChain = constructionAssistantPrompt.pipe(geminiModel);

export async function constructionChatChain({ supabase, message, projectId, history }: { supabase: SupabaseClient<Database>; message: string; projectId: string; history: ChatMessage[] }): Promise<{ answer: string; sources: ChatMessage["sources"] }> {
  const conversationHistory = history.map((item) => item.role === "user" ? new HumanMessage(item.content) : new AIMessage(item.content));
  const retrievalQuery = [...history.slice(-4).map((item) => item.content), message].join("\n");
  const retrievedChunks = await retrieveProjectChunks(supabase, retrievalQuery, projectId);
  const ragContext = buildRagContext(retrievedChunks);
  const response = await constructionModelChain.invoke({ input: message, history: conversationHistory, context: ragContext.text || "No relevant context was found in the selected project's processed documents." });
  const sources = retrievedChunks.filter((chunk, index, chunks) => chunks.findIndex((candidate) => candidate.document_id === chunk.document_id && candidate.chunk_index === chunk.chunk_index) === index).map((chunk) => ({ documentId: chunk.document_id, documentName: chunk.document_name, chunkIndex: chunk.chunk_index, pageNumber: chunk.page_number, similarity: chunk.similarity }));

  if (typeof response.content === "string") {
    return { answer: response.content, sources };
  }

  return {
    answer: response.content.map((part) => (typeof part === "string" || !("text" in part) ? "" : part.text)).join(""),
    sources,
  };
}
