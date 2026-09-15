"use client";

import { useState, type FormEvent } from "react";
import type { ProjectStatus } from "../../types/database";
import type { ProjectValues } from "../../lib/projects";

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

type ProjectFormProps = {
  initialValues?: ProjectValues;
  submitLabel: string;
  onSubmit: (values: ProjectValues) => Promise<{ error?: string }>;
  onCancel?: () => void;
};

export default function ProjectForm({ initialValues, submitLabel, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(initialValues?.status ?? "active");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const result = await onSubmit({ name: name.trim(), description: description.trim(), status });
    if (result.error) setError(result.error);
    setIsSubmitting(false);
  }

  return <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><label className="block"><span className="text-sm font-semibold text-slate-700">Project name</span><input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label><label className="block"><span className="text-sm font-semibold text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label><label className="block"><span className="text-sm font-semibold text-slate-700">Status</span><select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>{error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}<div className="flex justify-end gap-3">{onCancel ? <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50">Cancel</button> : null}<button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#f4a300] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#df9300] disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Saving..." : submitLabel}</button></div></form>;
}
