"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import ProjectForm from "../../components/ProjectForm";
import { createClient } from "../../../lib/supabase/client";
import { getProject, updateProject, type ProjectValues } from "../../../lib/projects";
import type { Project } from "../../../types/project";
import type { ProjectDocumentListItem } from "../../../types/document";

const supabase = createClient();

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function documentStatusLabel(status: ProjectDocumentListItem["status"]) {
  return status === "ready" ? "Processed" : status === "error" ? "Failed" : status[0].toUpperCase() + status.slice(1);
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocumentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [processingDocumentId, setProcessingDocumentId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProject() {
      const { data, error: projectError } = await getProject(supabase, id);
      if (projectError) setError("Unable to load this project.");
      else if (!data) setError("Project not found.");
      else {
        setProject(data);
        const documentsResponse = await fetch(`/api/project-documents?projectId=${encodeURIComponent(id)}`);
        const documentsData: unknown = await documentsResponse.json();
        if (documentsResponse.ok && typeof documentsData === "object" && documentsData !== null && "documents" in documentsData && Array.isArray(documentsData.documents)) {
          setDocuments(documentsData.documents as ProjectDocumentListItem[]);
        }
      }
      setIsLoading(false);
    }

    void loadProject();
  }, [id]);

  async function handleProcess(document: ProjectDocumentListItem) {
    setError("");
    setSuccess("");
    setProcessingDocumentId(document.id);
    try {
      const response = await fetch(`/api/project-documents/${document.id}/process`, { method: "POST" });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Unable to process the PDF.";
        throw new Error(message);
      }
      setSuccess("PDF processed successfully.");
      const documentsResponse = await fetch(`/api/project-documents?projectId=${encodeURIComponent(id)}`);
      const documentsData: unknown = await documentsResponse.json();
      if (documentsResponse.ok && typeof documentsData === "object" && documentsData !== null && "documents" in documentsData && Array.isArray(documentsData.documents)) {
        setDocuments(documentsData.documents as ProjectDocumentListItem[]);
      }
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "Unable to process the PDF.");
    } finally {
      setProcessingDocumentId("");
    }
  }

  async function handleUpdate(values: ProjectValues) {
    const { data, error: updateError } = await updateProject(supabase, id, values);
    if (updateError || !data) return { error: "Unable to update the project. Please try again." };
    setProject(data);
    setIsEditing(false);
    setSuccess("Project updated successfully.");
    return {};
  }

  async function handleDelete() {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setError("");
    setIsDeleting(true);
    const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Unable to delete the project. Please try again.");
      setIsDeleting(false);
      return;
    }
    router.replace("/projects");
    router.refresh();
  }

  return <main className="flex min-h-screen bg-[#f7f8fa] text-slate-900"><Sidebar activeItem="projects" onNewChat={() => undefined} /><section className="flex min-w-0 flex-1 flex-col"><div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-3xl"><Link href="/projects" className="text-sm font-semibold text-amber-700 hover:text-amber-800">← Back to projects</Link>{isLoading ? <p className="mt-8 text-sm text-slate-500">Loading project...</p> : !project ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h1 className="text-xl font-semibold">{error || "Project not found."}</h1><p className="mt-2 text-sm text-slate-500">This project may not exist or may not be available to your account.</p></div> : <><div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h1 className="text-3xl font-bold tracking-tight">{project.name}</h1><span className="mt-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700">{project.status.replace("_", " ")}</span></div><div className="flex gap-3"><button type="button" onClick={() => { setError(""); setSuccess(""); setIsEditing(true); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300">Edit</button><button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50">{isDeleting ? "Deleting..." : "Delete"}</button></div></div>{success ? <p role="status" className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}{error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}{isEditing ? <div className="mt-8"><ProjectForm initialValues={{ name: project.name, description: project.description ?? "", status: project.status }} submitLabel="Save changes" onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} /></div> : <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Description</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{project.description || "No description provided."}</p><div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created</p><p className="mt-1 text-slate-700">{formatDate(project.created_at)}</p></div><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Updated</p><p className="mt-1 text-slate-700">{formatDate(project.updated_at)}</p></div></div></div>}<div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Documents</h2><Link href={`/documents?projectId=${encodeURIComponent(id)}`} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">Upload document</Link></div>{documents.length === 0 ? <p className="mt-4 text-sm text-slate-500">No PDFs uploaded for this project yet.</p> : <div className="mt-4 space-y-3">{documents.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{document.name}</p><p className="mt-1 text-xs text-slate-400">Uploaded {formatDate(document.created_at)}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${document.status === "ready" ? "bg-emerald-50 text-emerald-700" : document.status === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{documentStatusLabel(document.status)}</span>{document.status !== "ready" ? <button type="button" onClick={() => void handleProcess(document)} disabled={processingDocumentId === document.id} className="text-xs font-semibold text-amber-700 hover:text-amber-800 disabled:opacity-50">{processingDocumentId === document.id ? "Processing..." : document.status === "error" ? "Retry" : "Process"}</button> : null}</div></div>)}</div>}</div></>}</div></div></section></main>;
}
