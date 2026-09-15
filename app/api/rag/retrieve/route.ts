import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { buildRagContext } from "../../../../lib/ai/rag/context";
import { retrieveProjectChunks } from "../../../../lib/ai/rag/retriever";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.projectId !== "string" || !body.projectId.trim() || typeof body.query !== "string" || !body.query.trim()) {
    return NextResponse.json({ error: "Project ID and query are required." }, { status: 400 });
  }

  try {
    const chunks = await retrieveProjectChunks(supabase, body.query.trim(), body.projectId.trim());
    const context = buildRagContext(chunks);
    return NextResponse.json({ context: context.text, chunks: context.chunks });
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to retrieve project documents." }, { status: 500 });
  }
}
