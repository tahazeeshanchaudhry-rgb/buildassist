import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { PROJECT_DOCUMENTS_BUCKET } from "../../../../../lib/documents/constants";
import { extractDocumentText } from "../../../../../lib/ai/rag/loaders";
import { splitDocumentText } from "../../../../../lib/ai/rag/splitter";
import { geminiEmbeddings, GEMINI_EMBEDDING_DIMENSIONS } from "../../../../../lib/ai/rag/embeddings";

export const runtime = "nodejs";

async function updateDocumentStatus(documentId: string, userId: string, status: "processing" | "ready" | "error") {
  const supabase = await createClient();
  await supabase.from("documents").update({ status }).eq("id", documentId).eq("user_id", userId);
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await params;
  const { data: document, error: documentError } = await supabase.from("documents").select("id, user_id, project_id, name, storage_path, file_type, status").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (documentError) return NextResponse.json({ error: "Unable to find the document." }, { status: 500 });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (document.status === "processing") return NextResponse.json({ error: "This document is already processing." }, { status: 409 });
  if (document.file_type !== "pdf" || !document.storage_path) return NextResponse.json({ error: "Only stored PDF documents can be processed." }, { status: 400 });

  const { error: processingError } = await supabase.from("documents").update({ status: "processing" }).eq("id", id).eq("user_id", user.id);
  if (processingError) return NextResponse.json({ error: "Unable to start document processing." }, { status: 500 });

  const { error: removeError } = await supabase.from("document_chunks").delete().eq("document_id", id).eq("user_id", user.id);
  if (removeError) {
    await updateDocumentStatus(id, user.id, "error");
    return NextResponse.json({ error: "Unable to prepare the document for processing." }, { status: 500 });
  }

  try {
    const { data: storedFile, error: downloadError } = await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).download(document.storage_path);
    if (downloadError || !storedFile) throw new Error("Document download failed");

    const text = await extractDocumentText(Buffer.from(await storedFile.arrayBuffer()), "pdf");
    if (!text.trim()) throw new Error("Document contains no readable text");

    const chunks = await splitDocumentText(text, document.name, id);
    if (!chunks.length) throw new Error("Document produced no chunks");

    const embeddings = await geminiEmbeddings.embedDocuments(chunks.map((chunk) => chunk.content));
    if (embeddings.length !== chunks.length || embeddings.some((embedding) => embedding.length !== GEMINI_EMBEDDING_DIMENSIONS)) {
      throw new Error("Unexpected embedding dimensions");
    }

    const rows = chunks.map((chunk, index) => ({
      user_id: user.id,
      project_id: document.project_id,
      document_id: id,
      content: chunk.content,
      chunk_index: chunk.source.chunkIndex,
      page_number: null,
      embedding: embeddings[index],
    }));
    const { error: insertError } = await supabase.from("document_chunks").insert(rows);
    if (insertError) throw new Error("Chunk persistence failed");

    const { error: readyError } = await supabase.from("documents").update({ status: "ready" }).eq("id", id).eq("user_id", user.id);
    if (readyError) throw new Error("Document status update failed");

    return NextResponse.json({ documentId: id, chunks: chunks.length, status: "ready" });
  } catch (error) {
    const details = error instanceof Error
      ? { name: error.name, message: error.message.replace(/AIza[\w-]{20,}/g, "[redacted]") }
      : { message: "Unknown PDF processing error" };
    console.error("PDF processing failed:", details);
    await supabase.from("document_chunks").delete().eq("document_id", id).eq("user_id", user.id);
    await updateDocumentStatus(id, user.id, "error");
    return NextResponse.json({ error: "Unable to process the PDF." }, { status: 500 });
  }
}
