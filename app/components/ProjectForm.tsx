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

  return <form onSubmit={handleSubmit} className="ba-surface max-w-2xl space-y-5 p-5 sm:p-6">
    <div className="border-b border-[#edf1f3] pb-4"><p className="ba-eyebrow">Project details</p><p className="mt-1 text-xs text-[#8390a0]">Fields marked required are needed to save.</p></div>
    <label className="block"><span className="ba-label">Project name <span className="text-[#a97806]">*</span></span><input required value={name} onChange={(event) => setName(event.target.value)} className="ba-field mt-2 px-3.5 py-3 text-sm" /></label>
    <label className="block"><span className="ba-label">Description <span className="font-normal text-[#8491a0]">(optional)</span></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="ba-field mt-2 resize-y px-3.5 py-3 text-sm leading-6" /></label>
    <label className="block"><span className="ba-label">Status</span><select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} className="ba-field mt-2 cursor-pointer bg-white px-3.5 py-3 text-sm">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    {error ? <p role="alert" className="ba-alert ba-alert-error">{error}</p> : null}
    <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#edf1f3] pt-4 sm:flex-row">{onCancel ? <button type="button" onClick={onCancel} disabled={isSubmitting} className="ba-button ba-button-secondary">Cancel</button> : null}<button type="submit" disabled={isSubmitting} className="ba-button ba-button-gold">{isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden="true"/>Saving…</> : submitLabel}</button></div>
  </form>;
}
