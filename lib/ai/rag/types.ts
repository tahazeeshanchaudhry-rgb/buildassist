import type { ChatSource } from "../../../types/chat";
import type { DocumentListItem } from "../../../types/document";

export type RagChunk = {
  content: string;
  source: ChatSource;
};

export type StoredChunk = RagChunk & {
  embedding: number[];
};

export type StoredDocument = DocumentListItem;
