import type { FormEvent } from "react";

type ChatInputProps = { value: string; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; disabled?: boolean };

export default function ChatInput({ value, onChange, onSubmit, disabled = false }: ChatInputProps) {
  return <form onSubmit={onSubmit} className="fixed bottom-4 left-4 right-4 z-20 mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/60 md:left-[calc(16rem+1.25rem)] md:right-5 lg:left-[calc(16rem+3rem)]"><input type="text" aria-label="Ask BuildAssist" placeholder="Ask about your project..." value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" /><button type="submit" disabled={disabled || !value.trim()} className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">{disabled ? "Thinking..." : "Send"} <span aria-hidden="true">↑</span></button></form>;
}
