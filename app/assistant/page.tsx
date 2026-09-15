"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import ChatInput from "../components/ChatInput";
import ChatMessages from "../components/ChatMessages";
import Sidebar from "../components/Sidebar";
import WelcomeScreen from "../components/WelcomeScreen";
import type { ChatMessage, ChatSource } from "../../types/chat";
import { createClient } from "../../lib/supabase/client";
import { listProjects } from "../../lib/projects";
import type { Project } from "../../types/project";
import type { Chat } from "../../lib/chats";

const supabase = createClient();

function isChatResponse(data: unknown): data is { answer: string; sources?: ChatSource[] } {
  if (typeof data !== "object" || data === null || !("answer" in data) || typeof data.answer !== "string") return false;
  if (!("sources" in data) || data.sources === undefined) return true;
  return Array.isArray(data.sources) && data.sources.every((source) => typeof source === "object" && source !== null && "documentId" in source && typeof source.documentId === "string" && "documentName" in source && typeof source.documentName === "string" && "chunkIndex" in source && typeof source.chunkIndex === "number");
}

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectError, setProjectError] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const requestId = useRef(0);
  const pendingRef = useRef(false);

  useEffect(() => {
    async function loadProjects() {
      const { data, error } = await listProjects(supabase);
      if (error) setProjectError("Unable to load your projects.");
      else {
        setProjects(data ?? []);
        setSelectedProjectId((current) => current || data?.[0]?.id || "");
        if (data?.[0]?.id) void loadChats(data[0].id);
      }
    }
    void loadProjects();
  }, []);

  async function loadChats(projectId: string) {
    const response = await fetch(`/api/chats?projectId=${encodeURIComponent(projectId)}`);
    const data: unknown = await response.json();
    if (response.ok && typeof data === "object" && data !== null && "chats" in data && Array.isArray(data.chats)) setChats(data.chats as Chat[]);
    else setChats([]);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !selectedProjectId || pendingRef.current) return;

    pendingRef.current = true;
    setIsPending(true);
    const currentRequestId = ++requestId.current;
    const timestamp = Date.now();
    const assistantId = `${timestamp}-assistant`;
    setMessages((current) => [...current, { id: `${timestamp}-user`, role: "user", content: trimmed }, { id: assistantId, role: "assistant", content: "Thinking..." }]);
    setMessage("");

    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmed, projectId: selectedProjectId, chatId: activeChatId || undefined, history: messages }) });
      const data: unknown = await response.json();
      if (!response.ok || !isChatResponse(data)) throw new Error("Chat request failed");
      if (currentRequestId === requestId.current) setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: data.answer, sources: data.sources } : item));
      if (currentRequestId === requestId.current && "chatId" in data && typeof data.chatId === "string") {
        setActiveChatId(data.chatId);
        void loadChats(selectedProjectId);
      }
    } catch {
      if (currentRequestId === requestId.current) setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: "Sorry, something went wrong. Please try again." } : item));
    } finally {
      if (currentRequestId === requestId.current) {
        pendingRef.current = false;
        setIsPending(false);
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(message);
  }

  function newChat() {
    requestId.current += 1;
    pendingRef.current = false;
    setMessages([]);
    setActiveChatId("");
    setMessage("");
    setIsPending(false);
  }

  async function openChat(chatId: string) {
    const response = await fetch(`/api/chats/${chatId}`);
    const data: unknown = await response.json();
    if (!response.ok || typeof data !== "object" || data === null || !("messages" in data) || !Array.isArray(data.messages)) return;
    setMessages(data.messages as ChatMessage[]);
    setActiveChatId(chatId);
  }

  async function deleteChat(chatId: string) {
    const chat = chats.find((item) => item.id === chatId);
    if (!window.confirm(`Delete ${chat?.title || "this conversation"}?`)) return;
    const response = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    if (!response.ok) return;
    if (activeChatId === chatId) newChat();
    await loadChats(selectedProjectId);
  }

  return <main className="flex min-h-screen bg-[#f7f8fa] text-slate-900"><Sidebar onNewChat={newChat} chats={chats} activeChatId={activeChatId} onOpenChat={openChat} onDeleteChat={deleteChat} /><section className="flex min-w-0 flex-1 flex-col"><div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8 sm:px-8 lg:px-12"><div className="mb-3 flex items-center justify-between gap-3"><label htmlFor="assistant-project" className="text-sm font-semibold text-slate-600">Project</label><select id="assistant-project" value={selectedProjectId} onChange={(event) => { setSelectedProjectId(event.target.value); newChat(); void loadChats(event.target.value); }} disabled={isPending || !projects.length} className="max-w-[70%] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-amber-400"><option value="">{projects.length ? "Select a project" : "No projects available"}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>{projectError ? <p role="alert" className="mb-4 text-sm text-red-600">{projectError}</p> : null}<div className="m-auto w-full max-w-3xl pb-36">{messages.length === 0 ? <WelcomeScreen onSuggestion={sendMessage} /> : <ChatMessages messages={messages} />}</div><ChatInput value={message} onChange={setMessage} disabled={isPending || !selectedProjectId} onSubmit={handleSubmit} /></div></section></main>;
}
