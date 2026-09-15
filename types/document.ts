import type { Database } from "./database";

export type ProjectDocument = {
  id: string;
  projectId: string;
  name: string;
  type: string;
};

export type DocumentStatus = "processing" | "ready" | "error";

export type DocumentListItem = ProjectDocument & {
  status: DocumentStatus;
  chunks: number;
};

export type DatabaseDocument = Database["public"]["Tables"]["documents"]["Row"];
export type ProjectDocumentListItem = DatabaseDocument & { projectName: string };
