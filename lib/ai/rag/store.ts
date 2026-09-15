import { geminiEmbeddings } from "./embeddings";
import type { RagChunk, StoredChunk, StoredDocument } from "./types";

type RagState = {
  documents: Map<string, StoredDocument>;
  chunks: StoredChunk[];
};

const globalForRag = globalThis as typeof globalThis & { buildAssistRagState?: RagState };
const state = globalForRag.buildAssistRagState ?? {
  documents: new Map<string, StoredDocument>(),
  chunks: [],
};
globalForRag.buildAssistRagState = state;

function cosineSimilarity(left: number[], right: number[]): number {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export async function addDocument(document: StoredDocument, chunks: RagChunk[]): Promise<void> {
  const embeddings = await geminiEmbeddings.embedDocuments(chunks.map((chunk) => chunk.content));
  state.documents.set(document.id, document);
  state.chunks.push(...chunks.map((chunk, index) => ({ ...chunk, embedding: embeddings[index] })));
}

export function listDocuments(): StoredDocument[] {
  return Array.from(state.documents.values());
}

export async function retrieveRelevantChunks(query: string, topK = 4): Promise<RagChunk[]> {
  if (!state.chunks.length) return [];

  const queryEmbedding = await geminiEmbeddings.embedQuery(query);
  return state.chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK)
    .map(({ chunk }) => ({ content: chunk.content, source: chunk.source }));
}
