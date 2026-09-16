import type { FormEvent } from "react";
import Icon from "./Icon";

type ChatInputProps = { value: string; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; disabled?: boolean };

export default function ChatInput({ value, onChange, onSubmit, disabled = false }: ChatInputProps) {
  const isEmpty = !value.trim();
  return <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-4xl items-center gap-2 rounded-2xl border border-[#dce5e9] bg-white p-2 shadow-[0_8px_28px_rgb(15_42_68_/_10%)] transition focus-within:border-[#9db4c4] focus-within:shadow-[0_8px_30px_rgb(15_42_68_/_14%)] sm:gap-3 sm:p-2.5">
    <span className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f1f5f7] text-[#536a7f]"><Icon name="assistant" size={17} /></span>
    <input type="text" aria-label="Ask BuildAssist" placeholder="Ask about your project…" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="ba-field min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-sm shadow-none placeholder:text-slate-400 focus:border-0 focus:shadow-none sm:px-2" />
    <button type="submit" disabled={disabled || isEmpty} aria-label={disabled ? "BuildAssist is thinking" : "Send message"} className="ba-button ba-button-primary min-h-10 shrink-0 px-3 sm:px-4">{disabled ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> <span className="hidden sm:inline">Thinking</span></> : <><span className="hidden sm:inline">Send</span><Icon name="arrow" size={17} /></>}</button>
  </form>;
}
