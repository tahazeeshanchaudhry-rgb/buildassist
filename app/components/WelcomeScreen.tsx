import Image from "next/image";

type WelcomeScreenProps = { onSuggestion: (title: string) => void };

const suggestions = [
  { title: "Project Status", description: "Get a quick progress summary", icon: "↗" },
  { title: "Material Estimate", description: "Calculate quantities and costs", icon: "▥" },
  { title: "Safety Query", description: "Find guidance for your site", icon: "✓" },
  { title: "Document Search", description: "Locate project files instantly", icon: "⌕" },
];

export default function WelcomeScreen({ onSuggestion }: WelcomeScreenProps) {
  return <div className="relative overflow-hidden">
    <Image src="/brand/watermark.svg" alt="" width={360} height={360} className="pointer-events-none absolute -right-20 top-0 z-0 h-72 w-72 sm:-right-10" aria-hidden="true" /><div className="relative z-10 mb-10 text-center"><Image src="/brand/brand-mark.svg" alt="" width={56} height={56} className="mx-auto mb-5 h-14 w-14" aria-hidden="true" /><h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Construction Project Assistant</h1><p className="mt-3 text-sm font-semibold tracking-[0.25em] text-[#D8A017]">PLAN. BUILD. SMARTER.</p><p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500">AI-powered construction project assistant for clear answers, project insights, and practical guidance.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">{suggestions.map((suggestion) => <button key={suggestion.title} type="button" onClick={() => onSuggestion(suggestion.title)} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-600 transition group-hover:bg-amber-100 group-hover:text-amber-600">{suggestion.icon}</span><span><span className="block text-sm font-semibold text-slate-800">{suggestion.title}</span><span className="mt-1 block text-xs text-slate-500">{suggestion.description}</span></span></button>)}</div>
  </div>;
}
