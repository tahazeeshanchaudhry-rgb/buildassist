"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { createClient } from "../../lib/supabase/client";
import type { Chat } from "../../lib/chats";

type SidebarProps = { onNewChat: () => void; activeItem?: "assistant" | "projects" | "documents"; chats?: Chat[]; activeChatId?: string; onOpenChat?: (chatId: string) => void; onDeleteChat?: (chatId: string) => void };

const navItems = [
  { label: "Assistant", icon: "✦", href: "/assistant", active: true },
  { label: "Projects", icon: "▦", href: "/projects", active: false },
  { label: "Documents", icon: "▤", href: "/documents", active: false },
];

export default function Sidebar({ onNewChat, activeItem = "assistant", chats = [], activeChatId, onOpenChat, onDeleteChat }: SidebarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <div className="flex items-center gap-3 px-3">
          <Image src="/brand/brand-mark.svg" alt="BuildAssist" width={36} height={36} />
          <span className="text-lg font-bold tracking-tight text-[#0F2A44]">BuildAssist</span>
        </div>
        <button onClick={onNewChat} className="mt-10 flex items-center justify-center gap-2 rounded-xl bg-[#f4a300] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df9300]"><span className="text-lg leading-none">+</span> New Chat</button>
        <nav className="mt-8 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => <a key={item.label} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${((item.label === "Assistant" && activeItem === "assistant") || (item.label === "Projects" && activeItem === "projects") || (item.label === "Documents" && activeItem === "documents")) ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><span className="w-5 text-center text-base">{item.icon}</span>{item.label}</a>)}
        </nav>
        {activeItem === "assistant" && chats.length ? <div className="mt-8"><p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Recent conversations</p><div className="mt-2 space-y-1">{chats.slice(0, 8).map((chat) => <div key={chat.id} className={`group flex items-center gap-1 rounded-xl ${activeChatId === chat.id ? "bg-slate-100" : "hover:bg-slate-50"}`}><button type="button" onClick={() => onOpenChat?.(chat.id)} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-xs font-medium text-slate-600">{chat.title || "Untitled conversation"}</button><button type="button" onClick={() => onDeleteChat?.(chat.id)} aria-label={`Delete ${chat.title || "conversation"}`} className="mr-2 hidden text-xs text-slate-400 hover:text-red-600 group-hover:block">×</button></div>)}</div></div> : null}
        <div className="mt-auto rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace</p><p className="mt-2 text-sm font-medium text-slate-700">Riverside Tower</p><p className="mt-1 text-xs text-slate-500">Last updated today</p><button type="button" onClick={handleLogout} disabled={isLoggingOut} className="mt-4 text-xs font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-50">{isLoggingOut ? "Signing out..." : "Log out"}</button></div>
      </aside>
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:hidden">
        <div className="flex items-center gap-2 font-bold text-[#0F2A44]"><Image src="/brand/brand-mark.svg" alt="BuildAssist" width={32} height={32} />BuildAssist</div>
        <div className="flex items-center gap-3"><button onClick={onNewChat} className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">+ New Chat</button><button type="button" onClick={handleLogout} disabled={isLoggingOut} className="text-xs font-semibold text-slate-500 disabled:opacity-50">{isLoggingOut ? "..." : "Log out"}</button></div>
      </header>
      {activeItem === "assistant" && chats.length ? <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-2 md:hidden">{chats.slice(0, 6).map((chat) => <button key={chat.id} type="button" onClick={() => onOpenChat?.(chat.id)} className={`max-w-48 shrink-0 truncate rounded-lg px-3 py-2 text-xs font-medium ${activeChatId === chat.id ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-500"}`}>{chat.title || "Untitled conversation"}</button>)}</div> : null}
    </>
  );
}
