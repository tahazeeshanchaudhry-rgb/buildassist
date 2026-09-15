import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { PROJECT_DOCUMENTS_BUCKET } from "../../../../lib/documents/constants";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await params;
  const { data: project, error: projectError } = await supabase.from("projects").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (projectError) return NextResponse.json({ error: "Unable to find the project." }, { status: 500 });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const { data: documents, error: documentsError } = await supabase.from("documents").select("storage_path").eq("project_id", id).eq("user_id", user.id);
  if (documentsError) return NextResponse.json({ error: "Unable to prepare the project for deletion." }, { status: 500 });

  const { error: deleteError } = await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: "Unable to delete the project." }, { status: 500 });

  const paths = (documents ?? []).map((document) => document.storage_path).filter((path): path is string => Boolean(path));
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).remove(paths);
    if (storageError) return NextResponse.json({ error: "Project deleted, but some stored files could not be removed." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
