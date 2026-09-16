import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { MAX_PROJECT_DOCUMENT_SIZE, PROJECT_DOCUMENTS_BUCKET } from "../../../lib/documents/constants";

export const runtime = "nodejs";

async function getDocumentList(projectId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };

  let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data: documents, error: documentsError } = await query;
  if (documentsError) return { response: NextResponse.json({ error: "Unable to load documents." }, { status: 500 }) };

  const projectIds = [...new Set(documents.map((document) => document.project_id))];
  const { data: projects, error: projectsError } = projectIds.length
    ? await supabase.from("projects").select("id, name").in("id", projectIds)
    : { data: [], error: null };
  if (projectsError) return { response: NextResponse.json({ error: "Unable to load documents." }, { status: 500 }) };

  const projectNames = new Map((projects ?? []).map((project) => [project.id, project.name]));
  return { documents: documents.map((document) => ({ ...document, projectName: projectNames.get(document.project_id) ?? "Unknown project" })) };
}

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId") ?? undefined;
  const result = await getDocumentList(projectId);
  if (result.response) return result.response;
  return NextResponse.json({ documents: result.documents });
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

  const projectId = formData.get("projectId");
  const file = formData.get("file");
  if (typeof projectId !== "string" || !projectId || !(file instanceof File)) {
    return NextResponse.json({ error: "A project and PDF file are required." }, { status: 400 });
  }

  const { data: project, error: projectError } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
  if (projectError) return NextResponse.json({ error: "Unable to verify the project." }, { status: 500 });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
  }
  if (!file.size) return NextResponse.json({ error: "The PDF is empty." }, { status: 400 });
  if (file.size > MAX_PROJECT_DOCUMENT_SIZE) return NextResponse.json({ error: "The PDF must be 4 MB or smaller." }, { status: 400 });

  const storagePath = `${user.id}/${projectId}/${randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: "application/pdf", upsert: false });
  if (uploadError) return NextResponse.json({ error: "Unable to store the PDF." }, { status: 500 });

  const { data: document, error: documentError } = await supabase.from("documents").insert({ user_id: user.id, project_id: projectId, name: file.name, storage_path: storagePath, file_type: "pdf", status: "uploaded" }).select().single();
  if (documentError || !document) {
    await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "Unable to save the document record." }, { status: 500 });
  }

  return NextResponse.json({ documentId: document.id, name: document.name, projectId: document.project_id, status: document.status, createdAt: document.created_at });
}
