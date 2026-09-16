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
import Icon from "../components/Icon";

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

  return <main className="ba-page flex h-dvh min-h-0 flex-col overflow-hidden md:flex-row">
    <Sidebar onNewChat={newChat} chats={chats} activeChatId={activeChatId} onOpenChat={openChat} onDeleteChat={deleteChat} />
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="z-10 border-b border-[#e2e9ed] bg-white px-3 py-2.5 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
            <span className="ba-eyebrow shrink-0 whitespace-nowrap text-[.61rem] tracking-[.1em] sm:text-[.67rem]">Current project</span>
            <label htmlFor="assistant-project" className="group flex min-w-0 max-w-[min(60vw,27rem)] items-center gap-2 rounded-xl border border-[#dfe7eb] bg-[#f8fafb] px-2.5 py-2 transition hover:border-[#bccbd4] hover:bg-white focus-within:border-[#8da7ba] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgb(30_91_255_/_8%)] sm:gap-2.5 sm:px-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eaf0f4] text-[#294c68] transition group-hover:bg-[#edf3f7]"><Icon name="building" size={15}/></span>
              <select id="assistant-project" value={selectedProjectId} onChange={(event) => { setSelectedProjectId(event.target.value); newChat(); void loadChats(event.target.value); }} disabled={isPending || !projects.length} className="min-w-0 flex-1 cursor-pointer appearance-none truncate bg-transparent py-0.5 text-xs font-bold text-[#0F2A44] outline-none disabled:cursor-not-allowed sm:text-sm"><option value="">{projects.length ? "Select a project" : "No projects available"}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
              <Icon name="chevron" size={16} className="shrink-0 text-[#8190a0] transition group-hover:text-[#405c74]" />
            </label>
          </div>
          <span className="flex shrink-0 items-center gap-2 text-[.66rem] font-semibold text-[#637487] sm:rounded-full sm:bg-[#f4f7f8] sm:px-3 sm:py-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#D8A017]" /> <span className="hidden sm:inline">Construction assistant</span><span className="sm:hidden">Assistant</span></span>
        </div>
      </header>
      {projectError ? <p role="alert" className="mx-4 mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700 sm:mx-7">{projectError}</p> : null}
      <div className="ba-scrollbar min-h-0 flex-1 overflow-y-auto px-4 sm:px-7">
        <div className={`mx-auto flex w-full max-w-4xl flex-col ${messages.length ? "py-7 sm:py-9" : "min-h-full justify-center py-8"}`}>
          {messages.length === 0 ? <WelcomeScreen onSuggestion={sendMessage} /> : <ChatMessages messages={messages} />}
        </div>
      </div>
      <footer className="z-10 border-t border-[#e4eaed] bg-[#f1f6f6]/95 px-3 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 sm:py-4">
        <ChatInput value={message} onChange={setMessage} disabled={isPending || !selectedProjectId} onSubmit={handleSubmit} />
        <p className="mx-auto mt-2 max-w-4xl text-center text-[.65rem] text-[#8591a0]">BuildAssist can make mistakes. Verify critical project decisions with your team.</p>
      </footer>
    </section>
  </main>;
}
