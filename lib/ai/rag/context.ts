import type { RetrievedChunk } from "./retriever";

export type RagContext = {
  text: string;
  chunks: RetrievedChunk[];
};

export function buildRagContext(chunks: RetrievedChunk[]): RagContext {
  return {
    text: chunks
      .map((chunk) => `[${chunk.document_name}, chunk ${chunk.chunk_index}]\n${chunk.content}`)
      .join("\n\n"),
    chunks,
  };
}
