"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import { createClient } from "../../lib/supabase/client";
import { MAX_PROJECT_DOCUMENT_SIZE } from "../../lib/documents/constants";
import type { Project } from "../../types/project";
import type { ProjectDocumentListItem } from "../../types/document";

const supabase = createClient();
type ProjectOption = Pick<Project, "id" | "name">;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function documentStatusLabel(status: ProjectDocumentListItem["status"]) {
  return status === "ready" ? "Processed" : status === "error" ? "Failed" : status[0].toUpperCase() + status.slice(1);
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
    const [{ data: projectData, error: projectError }, documentsResponse] = await Promise.all([
      supabase.from("projects").select("id, name").order("name"),
      fetch("/api/project-documents"),
    ]);
    const documentsData: unknown = await documentsResponse.json();
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
  }, [selectedProject]);

  useEffect(() => {
    async function load() {
      await loadData();
      setIsLoading(false);
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
      setError("The PDF must be 10 MB or smaller.");
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
      const data: unknown = await response.json();
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
      const data: unknown = await response.json();
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
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Unable to process the PDF.";
        throw new Error(message);
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

  return <main className="flex min-h-screen bg-[#f7f8fa] text-slate-900"><Sidebar activeItem="documents" onNewChat={() => undefined} /><section className="flex min-w-0 flex-1 flex-col"><div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-4xl"><div className="mb-8"><h1 className="text-3xl font-bold tracking-tight">Documents</h1><p className="mt-2 text-sm text-slate-500">Upload PDF project files for secure storage.</p></div><form onSubmit={handleUpload} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><label htmlFor="project-select" className="block text-sm font-semibold text-slate-800">Project</label><select id="project-select" value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)} disabled={!projects.length || isUploading} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><label htmlFor="document-file" className="mt-4 block text-sm font-semibold text-slate-800">PDF file</label><div className="mt-2 flex flex-col gap-3 sm:flex-row"><input ref={fileInput} id="document-file" name="file" type="file" accept=".pdf,application/pdf" disabled={!projects.length || isUploading} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-amber-700" /><button type="submit" disabled={!projects.length || isUploading} className="rounded-xl bg-[#f4a300] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#df9300] disabled:cursor-not-allowed disabled:opacity-50">{isUploading ? "Uploading..." : "Upload PDF"}</button></div><p className="mt-2 text-xs text-slate-400">PDF only, up to 10 MB. Files remain private to your account.</p>{!isLoading && !projects.length ? <p className="mt-3 text-sm text-slate-500">Create a project before uploading documents. <Link href="/projects" className="font-semibold text-amber-700">Create project</Link></p> : null}</form>{error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}{success ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}<div className="mt-8"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Uploaded documents</h2>{isLoading ? <p className="mt-4 text-sm text-slate-500">Loading documents...</p> : documents.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No PDF documents uploaded yet.</p> : <div className="mt-3 space-y-3">{documents.map((document) => <div key={document.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{document.name}</p><p className="mt-1 text-xs text-slate-500">{document.projectName} · Uploaded {formatDate(document.created_at)}</p></div><div className="flex shrink-0 items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${document.status === "ready" ? "bg-emerald-50 text-emerald-700" : document.status === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{documentStatusLabel(document.status)}</span>{document.status !== "ready" ? <button type="button" onClick={() => handleProcess(document)} disabled={processingId === document.id} className="text-xs font-semibold text-amber-700 hover:text-amber-800 disabled:opacity-50">{processingId === document.id ? "Processing..." : document.status === "error" ? "Retry" : "Process"}</button> : null}<button type="button" onClick={() => handleDelete(document)} className="text-xs font-semibold text-red-600 hover:text-red-700">Delete</button></div></div>)}</div>}</div></div></div></section></main>;
}
