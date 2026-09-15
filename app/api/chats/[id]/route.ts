import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { toChatMessages } from "../../../../lib/chats";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const { data: chat, error: chatError } = await supabase.from("chats").select("id, project_id, title, created_at, updated_at").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (chatError) return NextResponse.json({ error: "Unable to load conversation." }, { status: 500 });
  if (!chat) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const { data: messages, error: messagesError } = await supabase.from("messages").select("*").eq("chat_id", id).eq("user_id", user.id).order("created_at", { ascending: true });
  if (messagesError) return NextResponse.json({ error: "Unable to load conversation messages." }, { status: 500 });
  return NextResponse.json({ chat, messages: toChatMessages(messages ?? []) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const { error } = await supabase.from("chats").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Unable to delete conversation." }, { status: 500 });
  return NextResponse.json({ success: true });
}
