import { NextResponse } from "next/server";
import { constructionChatChain } from "../../../lib/ai/chain";
import { createClient } from "../../../lib/supabase/server";
import { CHAT_HISTORY_LIMIT, createChatTitle, toChatMessages } from "../../../lib/chats";
import type { ChatMessage } from "../../../types/chat";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.message !== "string" || !body.message.trim() || typeof body.projectId !== "string" || !body.projectId.trim()) {
    return NextResponse.json({ error: "A message and project are required." }, { status: 400 });
  }

  if (body.chatId !== undefined && (typeof body.chatId !== "string" || !body.chatId.trim())) {
    return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  }

  const rawHistory = body.history === undefined ? [] : body.history;
  if (!Array.isArray(rawHistory) || rawHistory.length > CHAT_HISTORY_LIMIT) {
    return NextResponse.json({ error: "Invalid conversation history." }, { status: 400 });
  }

  const clientHistory: ChatMessage[] = [];
  for (const [index, item] of rawHistory.entries()) {
    if (!isRecord(item) || (item.role !== "user" && item.role !== "assistant") || typeof item.content !== "string" || !item.content.trim()) {
      return NextResponse.json({ error: "Invalid conversation history." }, { status: 400 });
    }

    clientHistory.push({ id: `history-${index}`, role: item.role, content: item.content.trim() });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const projectId = body.projectId.trim();
    const { data: project, error: projectError } = await supabase.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).maybeSingle();
    if (projectError) return NextResponse.json({ error: "Unable to verify the project." }, { status: 500 });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    let chatId: string;
    let history = clientHistory;
    if (typeof body.chatId === "string") {
      chatId = body.chatId.trim();
      const { data: chat, error: chatError } = await supabase.from("chats").select("id").eq("id", chatId).eq("user_id", user.id).eq("project_id", projectId).maybeSingle();
      if (chatError) return NextResponse.json({ error: "Unable to verify the conversation." }, { status: 500 });
      if (!chat) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      const { data: storedMessages, error: messagesError } = await supabase.from("messages").select("*").eq("chat_id", chatId).eq("user_id", user.id).order("created_at", { ascending: false }).limit(CHAT_HISTORY_LIMIT);
      if (messagesError) return NextResponse.json({ error: "Unable to load conversation history." }, { status: 500 });
      history = toChatMessages((storedMessages ?? []).reverse());
    } else {
      const { data: chat, error: chatError } = await supabase.from("chats").insert({ user_id: user.id, project_id: projectId, title: createChatTitle(body.message.trim()) }).select("id").single();
      if (chatError || !chat) return NextResponse.json({ error: "Unable to start the conversation." }, { status: 500 });
      chatId = chat.id;
    }

    const { error: userMessageError } = await supabase.from("messages").insert({ chat_id: chatId, user_id: user.id, role: "user", content: body.message.trim() });
    if (userMessageError) return NextResponse.json({ error: "Unable to save your message.", chatId }, { status: 500 });

    const result = await constructionChatChain({ supabase, message: body.message.trim(), projectId, history, });
    const { error: assistantMessageError } = await supabase.from("messages").insert({ chat_id: chatId, user_id: user.id, role: "assistant", content: result.answer, sources: result.sources ?? null });
    if (assistantMessageError) return NextResponse.json({ error: "Unable to save the assistant response.", chatId }, { status: 500 });
    await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId).eq("user_id", user.id);
    return NextResponse.json({ ...result, chatId });
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Unable to process the message." },
      { status: 500 },
    );
  }
}
