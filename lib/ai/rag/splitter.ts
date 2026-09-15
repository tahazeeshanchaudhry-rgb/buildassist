import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { ChatSource } from "../../../types/chat";
import type { RagChunk } from "./types";

export const chunkingConfig = {
  chunkSize: 1000,
  chunkOverlap: 150,
};

const textSplitter = new RecursiveCharacterTextSplitter(chunkingConfig);

export async function splitDocumentText(text: string, documentName: string, documentId: string): Promise<RagChunk[]> {
  const chunks = await textSplitter.splitText(text);

  return chunks.map((content, chunkIndex) => ({
    content,
    source: { documentId, documentName, chunkIndex } satisfies ChatSource,
  }));
}
