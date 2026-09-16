import Image from "next/image";
import Icon, { type IconName } from "./Icon";

type WelcomeScreenProps = { onSuggestion: (title: string) => void };

const suggestions: Array<{ title: string; description: string; icon: IconName }> = [
  { title: "Project Status", description: "Get a clear progress summary", icon: "projects" },
  { title: "Material Estimate", description: "Explore quantities and costs", icon: "building" },
  { title: "Safety Query", description: "Review practical site guidance", icon: "check" },
  { title: "Document Search", description: "Find information in project files", icon: "documents" },
];

export default function WelcomeScreen({ onSuggestion }: WelcomeScreenProps) {
  return <div className="relative isolate mx-auto w-full max-w-3xl py-3 sm:py-7">
    <Image src="/brand/watermark.svg" alt="" width={320} height={320} className="pointer-events-none absolute -right-12 top-0 -z-10 h-52 w-52 opacity-[.035] sm:-right-8 sm:h-72 sm:w-72" aria-hidden="true" />
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-[#e3e9ec] bg-white px-3 py-1.5 text-[.69rem] font-semibold text-[#586b7f] shadow-sm"><Image src="/brand/brand-mark.svg" alt="" width={18} height={18} aria-hidden="true" />BUILDASSIST WORKSPACE</div>
      <h1 className="text-[1.7rem] font-bold tracking-[-.04em] text-[#0F2A44] sm:text-[2.25rem]">Your construction project,<br className="hidden sm:block" /> in clearer focus.</h1>
      <p className="mt-2.5 text-sm font-bold tracking-[.2em] text-[#a97806]">PLAN. BUILD. SMARTER.</p>
      <p className="mx-auto mt-2.5 max-w-lg text-sm leading-6 text-[#69798b] sm:text-[.95rem]">AI-powered construction project assistant for project insight, document answers, and practical guidance.</p>
    </div>
    <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2">{suggestions.map((suggestion, index) => <button key={suggestion.title} type="button" onClick={() => onSuggestion(suggestion.title)} className="ba-card-hover group flex min-w-0 items-center gap-3.5 rounded-2xl border border-[#e1e8eb] bg-white p-4 text-left shadow-[0_3px_10px_rgb(15_42_68_/_3%)] sm:p-[1.125rem]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#e7edf0] bg-[#f5f8f9] text-[#33516c] transition group-hover:border-[#ecd9a5] group-hover:bg-[#fbf5e6] group-hover:text-[#98700e]"><Icon name={suggestion.icon} size={19} /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#263e54]">{suggestion.title}</span><span className="mt-1 block text-xs leading-5 text-[#758395]">{suggestion.description}</span></span>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition group-hover:bg-[#f3f6f8] group-hover:text-[#1E5BFF]"><Icon name="arrow" size={15} /></span>
      <span className="sr-only">Suggestion {index + 1}</span>
    </button>)}</div>
  </div>;
}
