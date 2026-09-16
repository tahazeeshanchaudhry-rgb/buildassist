"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import type { Chat } from "../../lib/chats";
import Icon, { type IconName } from "./Icon";

type SidebarProps = { onNewChat: () => void; activeItem?: "assistant" | "projects" | "documents"; chats?: Chat[]; activeChatId?: string; onOpenChat?: (chatId: string) => void; onDeleteChat?: (chatId: string) => void };

const navItems: Array<{ label: string; icon: IconName; href: string; id: SidebarProps["activeItem"] }> = [
  { label: "Assistant", icon: "assistant", href: "/assistant", id: "assistant" },
  { label: "Projects", icon: "projects", href: "/projects", id: "projects" },
  { label: "Documents", icon: "documents", href: "/documents", id: "documents" },
];

function Brand() {
  return <Link href="/assistant" className="flex w-fit items-center gap-3 rounded-lg" aria-label="BuildAssist home">
    <Image src="/brand/brand-mark.svg" alt="" width={38} height={38} />
    <span className="leading-tight"><span className="block text-[1.03rem] font-bold tracking-tight text-[#0F2A44]">BuildAssist</span><span className="mt-0.5 block text-[0.6rem] font-semibold tracking-[.11em] text-slate-400">PLAN. BUILD. SMARTER.</span></span>
  </Link>;
}

export default function Sidebar({ onNewChat, activeItem = "assistant", chats = [], activeChatId, onOpenChat, onDeleteChat }: SidebarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return <>
    <aside className="hidden w-[17rem] shrink-0 flex-col border-r border-[#dfe7eb] bg-white px-4 py-6 md:flex">
      <div className="px-2"><Brand /></div>
      <button type="button" onClick={onNewChat} className="ba-button ba-button-primary mt-7 w-full justify-start px-3.5"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10"><Icon name="plus" size={17} /></span>New Chat</button>
      <nav className="mt-6 space-y-1" aria-label="Main navigation">
        <p className="ba-eyebrow mb-2 px-3">Workspace</p>
        {navItems.map((item) => <Link key={item.label} href={item.href} aria-current={activeItem === item.id ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[.84rem] font-semibold transition-colors ${activeItem === item.id ? "bg-[#edf3f7] text-[#0F2A44]" : "text-[#68788a] hover:bg-[#f5f8f9] hover:text-[#0F2A44]"}`}><Icon name={item.icon} size={18} className={activeItem === item.id ? "text-[#1E5BFF]" : "text-slate-400 group-hover:text-[#1E5BFF]"} />{item.label}{activeItem === item.id ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D8A017]" /> : null}</Link>)}
      </nav>
      {activeItem === "assistant" && chats.length ? <section className="mt-8 min-h-0" aria-label="Recent conversations">
        <div className="flex items-center justify-between px-3"><h2 className="ba-eyebrow">Recent conversations</h2><span className="text-[.65rem] font-semibold text-slate-400">{chats.length}</span></div>
        <div className="ba-scrollbar mt-2 max-h-[min(42vh,24rem)] space-y-1 overflow-y-auto pr-1">{chats.slice(0, 8).map((chat) => <div key={chat.id} className={`group flex min-w-0 items-center gap-1 rounded-xl border border-transparent transition ${activeChatId === chat.id ? "border-[#e4ebef] bg-[#f6f8f9]" : "hover:bg-[#f7f9fa]"}`}>
          <button type="button" onClick={() => onOpenChat?.(chat.id)} aria-current={activeChatId === chat.id ? "page" : undefined} className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-[.76rem] font-medium text-[#536477] focus-visible:rounded-xl"><Icon name="chat" size={15} className="shrink-0 text-slate-400" /><span className="truncate">{chat.title || "Untitled conversation"}</span></button>
          <button type="button" onClick={() => onDeleteChat?.(chat.id)} aria-label={`Delete ${chat.title || "conversation"}`} className="mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100"><Icon name="trash" size={14} /></button>
        </div>)}</div>
      </section> : null}
      <div className="mt-auto border-t border-[#e8edef] pt-4">
        <div className="overflow-hidden rounded-xl border border-[#e5ebee] bg-[#f8fafb] p-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eaf0f4] text-[#0F2A44]"><Icon name="building" size={18} /></span><span className="min-w-0"><span className="block text-xs font-semibold text-[#293e53]">Your workspace</span><span className="mt-1 block truncate text-[.68rem] text-slate-500">Projects & construction files</span></span></div><button type="button" onClick={handleLogout} disabled={isLoggingOut} className="mt-3 flex min-h-9 w-full items-center gap-2 border-t border-[#e5ebee] px-1 pt-2 text-left text-xs font-semibold text-[#68788a] transition hover:text-red-700 disabled:opacity-50"><Icon name="logout" size={15} />{isLoggingOut ? "Signing out…" : "Log out"}</button></div>
      </div>
    </aside>

    <div className="border-b border-[#dfe7eb] bg-white md:hidden">
      <header className="flex min-h-[4.25rem] items-center justify-between gap-3 px-4 py-3 sm:px-6"><Brand /><div className="flex shrink-0 items-center gap-2"><button type="button" onClick={onNewChat} className="ba-button ba-button-primary min-h-9 px-3 py-2 text-xs"><Icon name="plus" size={15} />New Chat</button><button type="button" onClick={handleLogout} disabled={isLoggingOut} aria-label={isLoggingOut ? "Signing out" : "Log out"} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#0F2A44] disabled:opacity-50"><Icon name="logout" size={17} /></button></div></header>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 sm:px-5" aria-label="Main navigation">{navItems.map((item) => <Link key={item.label} href={item.href} aria-current={activeItem === item.id ? "page" : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${activeItem === item.id ? "bg-[#edf3f7] text-[#0F2A44]" : "text-slate-500 hover:bg-slate-50"}`}><Icon name={item.icon} size={15} />{item.label}</Link>)}</nav>
      {activeItem === "assistant" && chats.length ? <div className="ba-scrollbar flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2.5 sm:px-6">{chats.slice(0, 8).map((chat) => <button key={chat.id} type="button" onClick={() => onOpenChat?.(chat.id)} aria-current={activeChatId === chat.id ? "page" : undefined} className={`flex max-w-52 shrink-0 items-center gap-2 truncate rounded-lg px-3 py-2 text-xs font-medium ${activeChatId === chat.id ? "bg-[#edf3f7] text-[#0F2A44]" : "bg-[#f6f8f9] text-slate-600 hover:bg-[#edf3f7]"}`}><Icon name="chat" size={14} className="shrink-0" /><span className="truncate">{chat.title || "Untitled conversation"}</span></button>)}</div> : null}
    </div>
  </>;
}
