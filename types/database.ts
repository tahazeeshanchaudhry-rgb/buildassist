export type ProjectStatus = "active" | "planning" | "on_hold" | "completed" | "archived";
export type DocumentStatus = "uploaded" | "processing" | "ready" | "error";
export type MessageRole = "user" | "assistant" | "system";
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; full_name?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      projects: {
        Row: { id: string; user_id: string; name: string; description: string | null; status: ProjectStatus; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; name: string; description?: string | null; status?: ProjectStatus; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; name?: string; description?: string | null; status?: ProjectStatus; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      documents: {
        Row: { id: string; user_id: string; project_id: string; name: string; storage_path: string | null; file_type: string | null; status: DocumentStatus; created_at: string };
        Insert: { id?: string; user_id: string; project_id: string; name: string; storage_path?: string | null; file_type?: string | null; status?: DocumentStatus; created_at?: string };
        Update: { id?: string; user_id?: string; project_id?: string; name?: string; storage_path?: string | null; file_type?: string | null; status?: DocumentStatus; created_at?: string };
        Relationships: [];
      };
      document_chunks: {
        Row: { id: string; user_id: string; project_id: string; document_id: string; content: string; chunk_index: number; page_number: number | null; embedding: number[]; created_at: string };
        Insert: { id?: string; user_id: string; project_id: string; document_id: string; content: string; chunk_index: number; page_number?: number | null; embedding: number[]; created_at?: string };
        Update: { id?: string; user_id?: string; project_id?: string; document_id?: string; content?: string; chunk_index?: number; page_number?: number | null; embedding?: number[]; created_at?: string };
        Relationships: [];
      };
      chats: {
        Row: { id: string; user_id: string; project_id: string; title: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; project_id: string; title?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; project_id?: string; title?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      messages: {
        Row: { id: string; chat_id: string; user_id: string; role: MessageRole; content: string; sources: Json | null; created_at: string };
        Insert: { id?: string; chat_id: string; user_id: string; role: MessageRole; content: string; sources?: Json | null; created_at?: string };
        Update: { id?: string; chat_id?: string; user_id?: string; role?: MessageRole; content?: string; sources?: Json | null; created_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          match_project_id: string;
          match_count?: number;
          similarity_threshold?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          document_name: string;
          project_id: string;
          content: string;
          chunk_index: number;
          page_number: number | null;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
