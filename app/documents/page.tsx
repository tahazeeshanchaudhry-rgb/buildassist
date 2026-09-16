"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import { createClient } from "../../lib/supabase/client";
import { MAX_PROJECT_DOCUMENT_SIZE } from "../../lib/documents/constants";
import type { Project } from "../../types/project";
import type { ProjectDocumentListItem } from "../../types/document";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";

const supabase = createClient();
type ProjectOption = Pick<Project, "id" | "name">;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function documentStatusLabel(status: ProjectDocumentListItem["status"]) {
  return status === "ready" ? "Ready" : status === "error" ? "Error" : status[0].toUpperCase() + status.slice(1);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default function DocumentsPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documents, setDocuments] = useState<ProjectDocumentListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [{ data: projectData, error: projectError }, documentsResponse] = await Promise.all([
        supabase.from("projects").select("id, name").order("name"),
        fetch("/api/project-documents"),
      ]);
      const documentsData = await readJson(documentsResponse);
      if (projectError || !documentsResponse.ok) {
        setError("Unable to load projects and documents.");
        return;
      }
      setProjects(projectData ?? []);
      if (!selectedProject) {
        const projectFromUrl = new URLSearchParams(window.location.search).get("projectId");
        setSelectedProject(projectFromUrl && projectData?.some((project) => project.id === projectFromUrl) ? projectFromUrl : projectData?.[0]?.id ?? "");
      }
      if (typeof documentsData === "object" && documentsData !== null && "documents" in documentsData && Array.isArray(documentsData.documents)) {
        setDocuments(documentsData.documents as ProjectDocumentListItem[]);
      }
    } catch {
      setError("Unable to load projects and documents.");
    }
  }, [selectedProject]);

  useEffect(() => {
    async function load() {
      try {
        await loadData();
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [loadData]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!selectedProject || !file) {
      setError("Choose a project and PDF file first.");
      return;
    }
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    if (!file.size) {
      setError("The PDF is empty.");
      return;
    }
    if (file.size > MAX_PROJECT_DOCUMENT_SIZE) {
      setError("The PDF must be 4 MB or smaller.");
      return;
    }

    setError("");
    setSuccess("");
    setIsUploading(true);
    const formData = new FormData();
    formData.append("projectId", selectedProject);
    formData.append("file", file);

    try {
      const response = await fetch("/api/project-documents", { method: "POST", body: formData });
      const data = await readJson(response);
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Unable to upload the PDF.";
        throw new Error(message);
      }
      await loadData();
      if (fileInput.current) fileInput.current.value = "";
      setSuccess("PDF uploaded successfully.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the PDF.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(document: ProjectDocumentListItem) {
    if (!window.confirm(`Delete ${document.name}? This cannot be undone.`)) return;
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/project-documents/${document.id}`, { method: "DELETE" });
      const data = await readJson(response);
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Unable to delete the PDF.";
        throw new Error(message);
      }
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setSuccess("Document deleted successfully.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete the PDF.");
    }
  }

  async function handleProcess(document: ProjectDocumentListItem) {
    setError("");
    setSuccess("");
    setProcessingId(document.id);
    try {
      const response = await fetch(`/api/project-documents/${document.id}/process`, { method: "POST" });
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        // A proxy/runtime may return an empty or non-JSON error response.
      }
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Unable to process the PDF. Please try again.";
        throw new Error(message);
      }
      if (typeof data !== "object" || data === null || !("status" in data) || data.status !== "ready") {
        throw new Error("Unable to process the PDF. Please try again.");
      }
      await loadData();
      setSuccess("PDF processed successfully.");
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "Unable to process the PDF.");
      await loadData();
    } finally {
      setProcessingId("");
    }
  }

  return <main className="ba-page flex min-h-dvh flex-col md:flex-row"><Sidebar activeItem="documents" onNewChat={() => undefined} /><section className="min-w-0 flex-1"><div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-10 lg:px-10"><div className="mx-auto max-w-6xl">
    <header className="mb-7 border-b border-[#dfe7eb] pb-6"><p className="ba-eyebrow mb-2">Workspace / Library</p><h1 className="ba-page-title">Documents</h1><p className="ba-page-subtitle">Keep your project PDFs private, organized, and ready to process.</p></header>
    <section className="ba-surface overflow-hidden"><div className="flex items-center gap-3 border-b border-[#edf1f3] px-5 py-4 sm:px-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fbf4e3] text-[#98700e]"><Icon name="upload" size={18}/></span><div><h2 className="text-sm font-bold text-[#2b4258]">Upload a project PDF</h2><p className="mt-1 text-xs text-[#8190a0]">Files stay private to your account.</p></div></div>
      <form onSubmit={handleUpload} className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <label className="block"><span className="ba-label">Project</span><select id="project-select" value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)} disabled={!projects.length || isUploading} className="ba-field mt-2 cursor-pointer px-3.5 py-3 text-sm"><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{!isLoading && !projects.length ? <span className="mt-2 block text-xs leading-5 text-[#778699]">Create a project before uploading. <Link href="/projects" className="font-bold text-[#1E5BFF] hover:underline">Go to projects</Link></span> : null}</label>
        <div><label htmlFor="document-file" className="ba-label">PDF file</label><div className="mt-2 flex min-h-[4.1rem] flex-col gap-3 rounded-xl border border-dashed border-[#cbd7dd] bg-[#f8fafb] p-2.5 sm:flex-row sm:items-center"><input ref={fileInput} id="document-file" name="file" type="file" accept=".pdf,application/pdf" disabled={!projects.length || isUploading} className="min-w-0 flex-1 text-xs text-[#53677b] file:mr-2 file:rounded-lg file:border-0 file:bg-[#edf3f7] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#294b67]" /><button type="submit" disabled={!projects.length || isUploading} className="ba-button ba-button-gold min-h-9 shrink-0 px-3 py-2 text-xs"><Icon name="upload" size={15}/>{isUploading ? "Uploading…" : "Upload PDF"}</button></div><p className="mt-2 text-[.68rem] text-[#8793a0]">PDF only · Up to 4 MB · Private storage</p></div>
      </form>
    </section>
    {error ? <p role="alert" className="ba-alert ba-alert-error mt-4">{error}</p> : null}{success ? <p role="status" className="ba-alert ba-alert-success mt-4">{success}</p> : null}
    <section className="mt-8"><div className="mb-3 flex items-end justify-between gap-3"><div><p className="ba-eyebrow">Project library</p><h2 className="mt-1 text-base font-bold text-[#2a4157]">Uploaded documents</h2></div>{!isLoading ? <span className="text-xs text-[#8793a0]">{documents.length} {documents.length === 1 ? "file" : "files"}</span> : null}</div>
      {isLoading ? <div className="ba-surface animate-pulse space-y-4 p-5"><div className="h-4 w-1/3 rounded bg-slate-100"/><div className="h-3 w-2/3 rounded bg-slate-100"/></div> : documents.length === 0 ? <div className="ba-empty"><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#edf3f7] text-[#3a5b75]"><Icon name="documents" size={20}/></span><p className="mt-3 text-sm font-bold text-[#344b61]">No PDFs uploaded yet</p><p className="mt-1 text-xs text-[#8290a0]">Choose a project and add a PDF to get started.</p></div> : <div className="ba-surface divide-y divide-[#edf1f3] overflow-hidden">{documents.map((document) => <article key={document.id} className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fbf4e3] text-[#98700e]"><Icon name="file" size={18}/></span><div className="min-w-0 flex-1"><p className="break-words text-sm font-bold text-[#2d4359]">{document.name}</p><p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8190a0]"><span>{document.projectName}</span><span aria-hidden="true" className="text-slate-300">·</span><span>Uploaded {formatDate(document.created_at)}</span></p></div><div className="flex flex-wrap items-center gap-2 border-t border-[#f0f3f5] pt-3 sm:border-0 sm:pt-0"><StatusBadge status={document.status} label={documentStatusLabel(document.status)}/>{document.status !== "ready" ? <button type="button" onClick={() => handleProcess(document)} disabled={processingId === document.id} className="ba-button ba-button-quiet min-h-8 px-2.5 py-1.5 text-xs">{processingId === document.id ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current"/>Processing…</> : document.status === "error" ? "Retry" : "Process"}</button> : null}<button type="button" onClick={() => handleDelete(document)} className="ba-button min-h-8 border border-transparent px-2.5 py-1.5 text-xs text-[#a5423b] hover:border-[#f0d9d7] hover:bg-[#fff5f4]"><Icon name="trash" size={14}/>Delete</button></div></article>)}</div>}
    </section>
  </div></div></section></main>;
}
