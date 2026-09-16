import type { ChatMessage } from "../../types/chat";
import Icon from "./Icon";
import MarkdownText from "./MarkdownText";

function Sources({ sources }: { sources: NonNullable<ChatMessage["sources"]> }) {
  const uniqueSources = sources.filter((source, sourceIndex) => sources.findIndex((candidate) => candidate.documentId === source.documentId && candidate.chunkIndex === source.chunkIndex) === sourceIndex);
  if (!uniqueSources.length) return null;

  return <section className="mt-6 border-t border-[#e8edf0] pt-4" aria-label="Answer sources">
    <h3 className="ba-eyebrow flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[#D8A017]" />Sources</h3>
    <div className="mt-2 flex flex-wrap gap-2">{uniqueSources.map((source) => <div key={`${source.documentId}-${source.chunkIndex}`} className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-[#e0e8ec] bg-[#f8fafb] px-3 py-2 text-xs text-[#43566b]" title={source.documentName}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#edf3f7] text-[#1E5BFF]"><Icon name="file" size={15} /></span>
      <span className="min-w-0"><span className="block max-w-[15rem] truncate font-semibold">{source.documentName}</span>{source.pageNumber ? <span className="mt-0.5 block text-[.68rem] text-slate-500">Page {source.pageNumber}</span> : null}</span>
    </div>)}</div>
  </section>;
}

export default function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  return <div className="space-y-7 sm:space-y-9" aria-live="polite">{messages.map((item, index) => <article key={`${item.role}-${index}`} className={`flex min-w-0 gap-3 sm:gap-4 ${item.role === "user" ? "justify-end" : "justify-start"}`}>
    {item.role === "assistant" ? <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0F2A44] text-white shadow-sm"><Icon name="assistant" size={16} /></span> : null}
    <div className={`min-w-0 ${item.role === "user" ? "max-w-[88%] sm:max-w-[78%]" : "w-full max-w-[min(100%,49rem)]"}`}>
      <p className={`mb-1.5 px-1 text-[.68rem] font-bold uppercase tracking-[.12em] ${item.role === "user" ? "text-right text-slate-400" : "text-[#6a7b8d]"}`}>{item.role === "user" ? "You" : "BuildAssist"}</p>
      {item.role === "user" ? <div className="rounded-2xl rounded-br-md bg-[#0F2A44] px-4 py-3.5 text-sm leading-6 text-white shadow-[0_4px_12px_rgb(15_42_68_/_10%)] sm:px-5">{item.content}</div> : <div className="overflow-hidden rounded-2xl rounded-tl-md border border-[#e2e9ed] bg-white px-4 py-4 text-sm leading-7 text-[#34465a] shadow-[0_3px_12px_rgb(15_42_68_/_4%)] sm:px-6 sm:py-5"><MarkdownText content={item.content} /><Sources sources={item.sources ?? []} /></div>}
    </div>
    {item.role === "user" ? <span className="mt-7 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#dbe4e8] bg-white text-[.65rem] font-bold text-[#708096]">YOU</span> : null}
  </article>)}</div>;
}
