import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { PROJECT_DOCUMENTS_BUCKET } from "../../../../lib/documents/constants";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await params;
  const { data: document, error: documentError } = await supabase.from("documents").select("id, storage_path").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (documentError) return NextResponse.json({ error: "Unable to find the document." }, { status: 500 });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!document.storage_path) return NextResponse.json({ error: "Document storage is unavailable." }, { status: 500 });

  const { error: storageError } = await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).remove([document.storage_path]);
  if (storageError) return NextResponse.json({ error: "Unable to delete the stored PDF." }, { status: 500 });

  const { error: deleteError } = await supabase.from("documents").delete().eq("id", id).eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: "Unable to delete the document record." }, { status: 500 });

  return NextResponse.json({ success: true });
}
