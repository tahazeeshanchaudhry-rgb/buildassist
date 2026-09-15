export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
};

export type ChatSource = {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  pageNumber?: number | null;
  similarity?: number;
};
