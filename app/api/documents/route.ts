import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { extractDocumentText, getSupportedDocumentType } from "../../../lib/ai/rag/loaders";
import { addDocument, listDocuments } from "../../../lib/ai/rag/store";
import { splitDocumentText } from "../../../lib/ai/rag/splitter";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ documents: listDocuments() });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF or TXT file is required." }, { status: 400 });
  }

  const type = getSupportedDocumentType(file.name, file.type);
  if (!type) {
    return NextResponse.json({ error: "Only PDF and TXT files are supported." }, { status: 400 });
  }
  if (!file.size) {
    return NextResponse.json({ error: "The document is empty." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "The document must be 10 MB or smaller." }, { status: 400 });
  }

  try {
    const documentId = randomUUID();
    const text = await extractDocumentText(Buffer.from(await file.arrayBuffer()), type);
    if (!text.trim()) {
      return NextResponse.json({ error: "No readable text was found in the document." }, { status: 400 });
    }

    const chunks = await splitDocumentText(text, file.name, documentId);
    await addDocument({ id: documentId, projectId: "current-session", name: file.name, type, status: "ready", chunks: chunks.length }, chunks);

    return NextResponse.json({ documentId, name: file.name, chunks: chunks.length, status: "ready" });
  } catch {
    return NextResponse.json({ error: "Unable to process the document." }, { status: 500 });
  }
}
